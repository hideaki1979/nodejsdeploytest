import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { swaggerSpec } from '../../src/config/swagger'

/**
 * 実際に送信されたレスポンスボディを OpenAPI spec で検証する。
 *
 * express-openapi-validator のレスポンス検証を使っていないのは、
 * あちらが `res.json()` に渡された「シリアライズ前の JS オブジェクト」を見るため。
 * 本プロジェクトは setupBigIntSerialization() で BigInt.prototype.toJSON を
 * 上書きして主キーを文字列化しており、検証時点ではまだ BigInt のままになる。
 * 結果、spec が正しくても "must be string" と誤検知する。
 *
 * ここでは HTTP で実際に流れたテキストをパースして検証するため、
 * BigInt の文字列化（#72 B-1）も含めて本当のレスポンスを見られる。
 * リクエスト・パラメータ・security の検証は express-openapi-validator が担当する。
 */

/**
 * OpenAPI 3.0 のスキーマを JSON Schema として扱える形へ直す。
 *
 * - nullable: true → null を許容する形へ
 * - example       → Ajv が解釈できない上、検証には不要なため落とす
 */
function toJsonSchema(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(toJsonSchema)
    if (node === null || typeof node !== 'object') return node

    const source = node as Record<string, unknown>
    const converted: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(source)) {
        if (key === 'nullable' || key === 'example') continue
        converted[key] = toJsonSchema(value)
    }

    if (source.nullable !== true) return converted

    // `type: 'string'` のような素の型指定なら型ユニオンで済む
    if (typeof source.type === 'string') {
        converted.type = [source.type, 'null']
        return converted
    }

    // $ref / oneOf / anyOf などを持つノードは型ユニオンにできない。
    // そのまま落とすと null が弾かれて誤検知になるため、null 許容を外側に足す。
    return { anyOf: [converted, { type: 'null' }] }
}

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
// spec 全体を1つのスキーマとして登録し、$ref: '#/components/schemas/...' を解決できるようにする
ajv.addSchema(toJsonSchema(swaggerSpec) as object, 'openapi')

/**
 * JSON Pointer のセグメントを URI フラグメントとして安全な形にする。
 *
 * `~` `/` のエスケープ（RFC 6901）に加えて、パステンプレートに含まれる `{` `}` を
 * パーセントエンコードする（RFC 3986 のフラグメントに使えない文字のため）。
 * エンコードせずとも現状の Ajv は解決できてしまうが、仕様上は不正な参照であり
 * 依存の更新で解決に失敗しうる。
 */
function encodePointerSegment(segment: string): string {
    return encodeURIComponent(segment.replace(/~/g, '~0').replace(/\//g, '~1'))
}

/** encodePointerSegment の逆。$ref のセグメントから元のキー名へ戻す */
function decodePointerSegment(segment: string): string {
    return decodeURIComponent(segment).replace(/~1/g, '/').replace(/~0/g, '~')
}

export interface OperationRef {
    method: string
    /** OpenAPI のパステンプレート。例: /stores/{id}/toppingcalls */
    path: string
    status: number
}

/** $ref を辿った先のレスポンスと、その位置を指す JSON Pointer */
interface ResolvedResponse {
    response: Record<string, unknown>
    /** レスポンスオブジェクトまでのセグメント列（URIフラグメント形式でエスケープ済み） */
    pointer: string[]
}

/** 循環参照で無限ループしないための上限（実際の spec は1段しか辿らない） */
const MAX_REF_DEPTH = 5

/**
 * `$ref: '#/components/responses/StoreNotFound'` のような
 * spec 内部への参照を辿り、実体のレスポンスオブジェクトへ解決する。
 *
 * spec は $ref を展開しないまま出力されるため、辿らないと
 * 「content が無い＝本文なしのレスポンス」と誤認してしまう。
 */
function resolveRefs(response: Record<string, unknown>, pointer: string[]): ResolvedResponse {
    let current = response
    let segments = pointer

    for (let depth = 0; typeof current.$ref === 'string'; depth += 1) {
        const ref = current.$ref
        if (depth >= MAX_REF_DEPTH) {
            throw new Error(`$ref の入れ子が深すぎます（循環参照の可能性）: ${ref}`)
        }
        if (!ref.startsWith('#/')) {
            throw new Error(`spec 内部への参照のみ対応しています: ${ref}`)
        }

        segments = ref.slice(2).split('/')
        const target = segments.reduce<unknown>(
            (node, segment) =>
                node === null || typeof node !== 'object'
                    ? undefined
                    : (node as Record<string, unknown>)[decodePointerSegment(segment)],
            swaggerSpec,
        )

        if (target === null || typeof target !== 'object') {
            throw new Error(`$ref を解決できませんでした: ${ref}`)
        }
        current = target as Record<string, unknown>
    }

    return { response: current, pointer: segments }
}

/** spec 上の当該レスポンス（responses[status]）を取り出す */
function getResponseObject(operation: OperationRef): ResolvedResponse {
    const paths = swaggerSpec.paths ?? {}
    const pathItem = paths[operation.path] as Record<string, unknown> | undefined
    const method = operation.method.toLowerCase()
    const operationObject = pathItem?.[method] as
        | { responses?: Record<string, Record<string, unknown>> }
        | undefined
    const response = operationObject?.responses?.[String(operation.status)]

    if (!response) {
        throw new Error(
            `spec に ${operation.method.toUpperCase()} ${operation.path} の ${operation.status} が定義されていません`,
        )
    }

    return resolveRefs(response, [
        'paths',
        encodePointerSegment(operation.path),
        method,
        'responses',
        String(operation.status),
    ])
}

function getValidator(pointer: string[], contentType: string): ValidateFunction | undefined {
    return ajv.getSchema(
        ['openapi#', ...pointer, 'content', encodePointerSegment(contentType), 'schema'].join('/'),
    )
}

/** ajv のエラーを、原因が分かる1行にする */
function describeError(error: ErrorObject): string {
    const at = error.instancePath === '' ? '(ルート)' : error.instancePath
    // params には missingProperty / allowedValues など「何が期待値だったか」が入る
    const params = Object.entries(error.params ?? {})
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(', ')

    return params === '' ? `${at} ${error.message}` : `${at} ${error.message} (${params})`
}

/**
 * 実際に本文が返っているか。
 *
 * Content-Type が無いレスポンスの本文は文字列のまま渡ってくる（supertest の res.text）。
 * 本文なしの場合は空文字になるため、長さで判定する。
 */
function hasBody(body: unknown): boolean {
    if (typeof body === 'string') return body.length > 0
    return body !== undefined && body !== null
}

/**
 * レスポンスを検証し、spec と食い違う点を人が読める形で返す。一致していれば空配列。
 *
 * Content-Type も契約の一部（responses[status].content のキー）なので、
 * テストの申告ではなく実際のレスポンスヘッダを突き合わせる。
 * ここを見ないと、実装が text/html から application/json に変わっても気づけない。
 */
export function findResponseViolations(
    body: unknown,
    operation: OperationRef,
    actualContentType: string | undefined,
): string[] {
    const { response, pointer } = getResponseObject(operation)
    const content = response.content as Record<string, { schema?: unknown }> | undefined

    // spec が本文を定義していないレスポンス（204 など）
    if (!content) {
        // Content-Type だけを見ると、ヘッダを外して本文を書くケース
        // （res.end() の直接呼び出しなど）を見逃す。本文の有無も併せて確認する。
        return [
            ...(hasBody(body) ? ['spec は本文なしと定義していますが本文が返りました'] : []),
            ...(actualContentType === undefined
                ? []
                : [`spec は本文なしと定義していますが Content-Type '${actualContentType}' が返りました`]),
        ]
    }

    const declared = Object.keys(content)
    if (actualContentType === undefined) {
        return [`Content-Type が返っていません（spec の定義: ${declared.join(', ')}）`]
    }
    if (!declared.includes(actualContentType)) {
        return [
            `Content-Type '${actualContentType}' は spec に定義されていません（定義: ${declared.join(', ')}）`,
        ]
    }

    // spec にスキーマの記載が無ければ検証対象なし
    if (content[actualContentType].schema === undefined) return []

    const validate = getValidator(pointer, actualContentType)
    if (!validate) {
        // spec にスキーマはあるのに Ajv が引けない＝参照の組み立てが壊れている。
        // 「違反なし」で返すと検証したつもりの素通りになるため、明示的に落とす。
        throw new Error(
            `spec のスキーマを解決できませんでした: ${operation.method.toUpperCase()} ${operation.path} ` +
            `${operation.status} ${actualContentType}`,
        )
    }

    if (validate(body)) return []
    return (validate.errors ?? []).map(describeError)
}
