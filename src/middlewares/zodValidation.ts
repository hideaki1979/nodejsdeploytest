import { NextFunction, Request, RequestHandler, Response } from 'express'
import { Logger } from 'pino'
import { container } from 'tsyringe'
import { pinoLogger } from '../di.token'
import { z } from '../openapi/zod'
import { pathWithoutQuery } from '../utils/requestPath'

/**
 * zod スキーマでリクエストを検証するミドルウェア。
 *
 * スキーマは OpenAPI spec の生成にも使う同じオブジェクトを受け取る。
 * これにより「検証は直したがドキュメントを直し忘れた（またはその逆）」が
 * 構造的に起きなくなる。
 *
 * エラーレスポンスの形（{ success, error, details }）は移行前の
 * express-validator + handleValidationErrors から変えていない。
 * details も同じキー（type / value / msg / path / location）で返す。
 */

/**
 * 検証対象。書き戻し先は3つとも異なる（理由は validate 内）。
 *   body   … 検証済みの値を req.body へ書き戻す
 *   query  … 検証済みの値を res.locals へ置く（getValidatedQuery で読む）
 *   params … 検証のみ
 */
export interface ValidationSchemas {
    body?: z.ZodType
    params?: z.ZodType
    query?: z.ZodType
}

type ValidationLocation = 'body' | 'params' | 'query'

/** express-validator の ValidationError（type: 'field'）と同じ形 */
interface FieldValidationError {
    type: 'field'
    value: unknown
    msg: string
    path: string
    location: ValidationLocation
}

/**
 * zod の issue パスを express-validator の表記へ変換する。
 * 例: ['topping_calls', 0, 'topping_id'] → 'topping_calls[0].topping_id'
 */
function formatPath(path: readonly PropertyKey[]): string {
    return path.reduce<string>((acc, segment) => {
        if (typeof segment === 'number') return `${acc}[${segment}]`
        return acc === '' ? String(segment) : `${acc}.${String(segment)}`
    }, '')
}

/** issue のパスが指す位置にある元の値を取り出す（details の value 用） */
function valueAtPath(input: unknown, path: readonly PropertyKey[]): unknown {
    return path.reduce<unknown>((node, segment) => {
        if (node === null || typeof node !== 'object') return undefined
        return (node as Record<PropertyKey, unknown>)[segment]
    }, input)
}

function toFieldErrors(
    error: z.ZodError,
    input: unknown,
    location: ValidationLocation,
): FieldValidationError[] {
    return error.issues.map((issue) => ({
        type: 'field',
        value: valueAtPath(input, issue.path),
        msg: issue.message,
        path: formatPath(issue.path),
        location,
    }))
}

/**
 * 同一フィールドの2件目以降を落とす。
 *
 * 移行前は errors.array({ onlyFirstError: true }) が同じ絞り込みを行っていた。
 * 合否は変わらず details の件数だけが減るため、既存クライアントへの影響はない。
 */
function onlyFirstErrorPerField(errors: FieldValidationError[]): FieldValidationError[] {
    const seen = new Set<string>()
    return errors.filter((error) => {
        const key = `${error.location}:${error.path}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

/** 検証済みクエリを置く res.locals のキー */
const VALIDATED_QUERY = 'validatedQuery'

/**
 * res.locals へは検証結果を包んで置く。値のまま置くと、検証結果が undefined の
 * スキーマで「validate を通っていない」と区別が付かなくなるため。
 */
interface ValidatedQuery {
    data: unknown
}

/**
 * validate({ query }) が検証を通したクエリを取り出す。
 *
 * 型引数はスキーマから導く（例: `z.output<typeof storeToppingCallsQuerySchema>`）。
 * ルートに validate({ query }) が付いていなければ包みごと無く、
 * 「絞り込み無しの 200」として静かに流れるより先に、設定漏れとして落とす。
 */
export function getValidatedQuery<T>(res: Response): T {
    const validated = res.locals[VALIDATED_QUERY] as ValidatedQuery | undefined
    if (validated === undefined) {
        throw new Error(
            'getValidatedQuery は validate({ query }) を通したルートでのみ使える（ルート定義を確認）',
        )
    }
    return validated.data as T
}

export function validate(schemas: ValidationSchemas): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: FieldValidationError[] = []

        // params は検証のみで書き戻さない。
        // コントローラは Number(req.params.id) で読み直しており、
        // 型を変えると経路によって値の型が変わってしまうため。
        if (schemas.params) {
            const result = schemas.params.safeParse(req.params ?? {})
            if (!result.success) errors.push(...toFieldErrors(result.error, req.params, 'params'))
        }

        // query は req.query へ書き戻せない（Express 5 では getter のため）。
        // かわりに検証を通った値を res.locals へ置き、コントローラは getValidatedQuery で読む。
        // 同じスキーマでコントローラが読み直す形にすると、パースが2箇所に増えるうえ、
        // ルートから validate({ query }) が外れたときに ZodError が 500 になって現れる。
        //
        // 検証結果は包んだまま res.locals へ渡す（理由は ValidatedQuery）
        let parsedQuery: ValidatedQuery | undefined
        if (schemas.query) {
            const result = schemas.query.safeParse(req.query ?? {})
            if (result.success) parsedQuery = { data: result.data }
            else errors.push(...toFieldErrors(result.error, req.query, 'query'))
        }

        // body は検証を通った値（trim / HTMLエスケープ / 数値化を適用したもの）を書き戻す。
        // 移行前も express-validator のサニタイザが同じ位置で req.body を書き換えていた。
        let parsedBody: unknown
        if (schemas.body) {
            const result = schemas.body.safeParse(req.body ?? {})
            if (result.success) parsedBody = result.data
            else errors.push(...toFieldErrors(result.error, req.body, 'body'))
        }

        if (errors.length > 0) {
            const logger = container.resolve<Logger>(pinoLogger)
            // ログは原因調査のため全件残す（絞り込みはレスポンスのみ）。
            // ただし value は落とす。メールアドレスやプロフィールがそのまま
            // ログに残るのを避けるため（logger.ts で認証ヘッダをマスクしているのと同じ理由）。
            // どの項目がどのルールで落ちたかは path / msg / location で追える。
            // レスポンスの details は移行前の形を保つため value を含めたままにする。
            //
            // path はクエリ文字列を落とす。クエリを検証するようになった後も、
            // どの項目がどのルールで落ちたかは details（value を除く）で追えるため、
            // クライアントが任意の内容を載せられる生のクエリを常時ログへ残す理由はない。
            logger.error(
                {
                    errors: errors.map(({ value: _value, ...rest }) => rest),
                    path: pathWithoutQuery(req),
                },
                'バリデーションエラーが発生しました。',
            )
            res.status(400).json({
                success: false,
                error: 'バリデーションエラー発生：入力値に誤りがあります。',
                details: onlyFirstErrorPerField(errors),
            })
            return
        }

        // スキーマに無いキーは zod が落とすため、意図しない項目が
        // そのままサービス層へ流れることはない
        if (parsedBody !== undefined) req.body = parsedBody
        if (parsedQuery) res.locals[VALIDATED_QUERY] = parsedQuery

        next()
    }
}
