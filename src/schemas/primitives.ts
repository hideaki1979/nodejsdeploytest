/**
 * リクエスト項目の検証部品。
 *
 * express-validator から zod へ移行するにあたり、本番の入力検証が
 * 気づかないうちに緩くなる・エラーメッセージが変わることを避けるため、
 * 移行前のチェーンと同じ判定・同じメッセージ・同じサニタイズ結果になるよう組み立てている。
 *
 * 判定そのものは validator パッケージ（express-validator が内部で使っていたもの）を
 * 直接呼ぶ。isLength のサロゲートペア勘定や normalizeEmail のプロバイダ別処理を
 * 自前で書き直すと、その差分がそのまま挙動の変化になるため。
 */
import validator from 'validator'
import { z } from '../openapi/zod'

/**
 * OpenAPI のドキュメント用メタデータ（生成される spec の記述に使う）。
 *
 * interface ではなく type にしているのは、`.openapi()` が受け取る型が
 * `x-` 拡張のインデックスシグネチャを要求するため。
 * interface は暗黙のインデックスシグネチャを持たず、そのままでは渡せない。
 */
export type FieldDoc = {
    description: string
    example?: unknown
}

/**
 * express-validator が検証前に値を文字列化していた規則を再現する。
 * （express-validator v7 の lib/utils.js:toString と同じ分岐）
 *
 * 「必須です」と「文字列で指定してください」のどちらを返すかは、
 * 移行前は notEmpty() がこの文字列を見て決めていた。
 * 例えば null は空文字になるため「必須です」側に倒れる。
 *
 * 唯一あえて揃えていないのが配列で、移行前は要素を1つずつ検証していた。
 * その結果 `store_id: []` が「要素が無いので全て合格」として isInt() を通り抜け、
 * BigInt([]) → 0n として登録される・`[1,2]` なら BigInt が例外を投げて 500 になる、
 * という穴になっていた。ここでは配列をそのまま文字列化して弾く。
 */
export function toValidatorString(value: unknown): string {
    if (value instanceof Date) return value.toISOString()
    if (value !== null && typeof value === 'object') {
        return typeof value.toString === 'function' ? value.toString() : ''
    }
    if (value === null || value === undefined) return ''
    if (Number.isNaN(Number(value)) && !(value as { length?: number }).length) return ''
    return String(value)
}

/** 移行前の notEmpty() が「空」と判定した値か */
function isEmptyValue(value: unknown): boolean {
    return toValidatorString(value) === ''
}

/**
 * 必須テキスト項目。
 *
 * 移行前: notEmpty → isString → trim → notEmpty → isLength({ max })
 * trim はサニタイザのため、検証を通った値は前後の空白が落ちた状態で
 * req.body へ書き戻される（zodValidation ミドルウェアが担う）。
 */
export function requiredText(label: string, maxLength: number, doc: FieldDoc) {
    return z
        .string({
            // 移行前は notEmpty() と isString() の両方が失敗し、先頭1件だけが返っていた。
            // undefined・null は notEmpty() 側、数値やオブジェクトは isString() 側になる。
            error: (issue) =>
                isEmptyValue(issue.input)
                    ? `${label}は必須です`
                    : `${label}は文字列で指定してください`,
        })
        .transform((value) => value.trim())
        .refine((value) => value !== '', { error: `${label}は必須です` })
        .refine((value) => validator.isLength(value, { max: maxLength }), {
            error: `${label}は${maxLength}文字以内で入力してください`,
        })
        .openapi({ maxLength, ...doc })
}

/**
 * 任意テキスト項目。未指定と null は素通しする（移行前の optional({ values: 'null' })）。
 *
 * 空文字は「入力なし」としてそのまま許容するため、必須テキストと違って空判定は行わない。
 */
export function optionalText(label: string, maxLength: number, doc: FieldDoc) {
    return z
        .string({ error: `${label}は文字列で指定してください` })
        .transform((value) => value.trim())
        .refine((value) => validator.isLength(value, { max: maxLength }), {
            error: `${label}は${maxLength}文字以内で入力してください`,
        })
        // メタデータは nullish() より内側に付ける。外側に付けると
        // ZodNullable から導かれる nullable: true が spec に出なくなる。
        // type も渡さない（渡すとメタデータが生成結果を丸ごと置き換えてしまう）。
        .openapi({ maxLength, ...doc })
        .nullish()
}

/**
 * 必須テキスト項目のうち、文字数制限も trim も持たないもの（menu_name）。
 *
 * 移行前が notEmpty → isString だけだったものを、ここで文字数制限や trim を足すと
 * 「今まで登録できていた値が通らなくなる」変更になるため、あえて揃えている。
 */
export function requiredPlainText(label: string, doc: FieldDoc) {
    return z
        .string({
            error: (issue) =>
                isEmptyValue(issue.input)
                    ? `${label}は必須です`
                    : `${label}は文字列で指定してください`,
        })
        .refine((value) => value !== '', { error: `${label}は必須です` })
        .openapi(doc)
}

/** 移行前の isInt()（validator.isInt に文字列化した値を渡す）と同じ判定 */
function isIntegerValue(value: unknown): boolean {
    return validator.isInt(toValidatorString(value))
}

/**
 * 数値へ変換しても値が変わらない範囲か。
 *
 * 主キーは DB 側が BigInt のため、2^53 を超える値を Number() に通すと
 * 静かに別の行を指す ID へ化ける。数値化するのはこの範囲に収まる値だけにし、
 * 超えるものは黙って丸めずエラーにする。
 */
function isSafeIntegerValue(value: unknown): boolean {
    return Number.isSafeInteger(Number(toValidatorString(value)))
}

/**
 * 整数項目の共通処理。
 *
 * 移行前の isInt() は「整数として読める文字列」も通していたが、数値化まではしていなかった。
 * そのため文字列のまま Prisma へ渡り、実行時エラー（500）になる経路が残っていた。
 * ここでは受理範囲を変えずに数値へ寄せる。
 */
function integerLike(
    label: string,
    doc: FieldDoc,
    message: (value: unknown) => string | undefined,
) {
    // union が失敗した時点で number でも string でもないため必ずエラーだが、
    // 文字列化すると整数に読める値（例: [5] → '5'）では message が undefined を返す。
    // zod は error コールバックが undefined を返すと既定メッセージ（英語）へ倒すため、
    // ここで整数エラーへ寄せて日本語のメッセージを保つ。
    const notInteger = `${label}は整数で指定してください`

    return z
        .union([z.number(), z.string()], { error: (issue) => message(issue.input) ?? notInteger })
        .superRefine((value, ctx) => {
            const error = message(value)
            if (error !== undefined) ctx.addIssue({ code: 'custom', message: error })
        })
        .transform((value) => Number(value))
        .openapi({ type: 'integer', ...doc })
}

/** 整数判定と、数値化しても壊れない範囲かの判定をまとめる */
function integerMessage(label: string, value: unknown): string | undefined {
    if (!isIntegerValue(value)) return `${label}は整数で指定してください`
    if (!isSafeIntegerValue(value)) return `${label}は扱える整数の範囲を超えています`
    return undefined
}

/**
 * 必須の整数項目。移行前: notEmpty → isInt
 * 空なら「必須です」、値はあるが整数でなければ「整数で指定してください」を返す。
 */
export function requiredInteger(label: string, doc: FieldDoc) {
    return integerLike(label, doc, (value) =>
        isEmptyValue(value) ? `${label}は必須です` : integerMessage(label, value),
    )
}

/**
 * 整数項目のうち、notEmpty() を持たなかったもの（店舗登録の topping_calls 配下）。
 * 未指定でも「整数で指定してください」になるのが移行前の挙動。
 */
export function integerOnly(label: string, doc: FieldDoc) {
    return integerLike(label, doc, (value) => integerMessage(label, value))
}

/**
 * 真偽値項目。移行前: isBoolean()
 *
 * isBoolean() は 'true' / 'false' / '0' / '1' も通していたため受理範囲は変えず、
 * 整数項目と同じ理由で真偽値へ寄せてから Prisma へ渡す。
 */
export function booleanField(label: string, doc: FieldDoc) {
    const message = `${label}は真偽値で指定してください`
    const isTrue = (value: unknown) => ['true', '1'].includes(toValidatorString(value))

    return z
        .union([z.boolean(), z.number(), z.string()], { error: message })
        .superRefine((value, ctx) => {
            if (!validator.isBoolean(toValidatorString(value))) {
                ctx.addIssue({ code: 'custom', message })
            }
        })
        .transform(isTrue)
        .openapi({ type: 'boolean', ...doc })
}

/** 列挙値項目。移行前: isIn([...])（前後の空白は許容しない点も同じ） */
export function enumField<const T extends readonly [string, ...string[]]>(
    values: T,
    message: string,
    doc: FieldDoc,
) {
    return z.enum(values, { error: message }).openapi(doc)
}

/**
 * 任意の配列項目。移行前: optional() → isArray()
 * 未指定のみ素通しし、null は配列でないため弾かれる。
 */
export function optionalArray<T extends z.ZodType>(item: T, message: string, doc: FieldDoc) {
    return z.array(item, { error: message }).optional().openapi(doc)
}
