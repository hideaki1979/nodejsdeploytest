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

export interface OperationRef {
    method: string
    /** OpenAPI のパステンプレート。例: /stores/{id}/toppingcalls */
    path: string
    status: number
}

/** spec 上の当該レスポンス（responses[status]）を取り出す */
function getResponseObject(operation: OperationRef): Record<string, unknown> {
    const paths = (swaggerSpec as { paths?: Record<string, Record<string, unknown>> }).paths ?? {}
    const pathItem = paths[operation.path] as Record<string, unknown> | undefined
    const method = pathItem?.[operation.method.toLowerCase()] as
        | { responses?: Record<string, Record<string, unknown>> }
        | undefined
    const response = method?.responses?.[String(operation.status)]

    if (!response) {
        throw new Error(
            `spec に ${operation.method.toUpperCase()} ${operation.path} の ${operation.status} が定義されていません`,
        )
    }
    return response
}

function getValidator(operation: OperationRef, contentType: string): ValidateFunction | undefined {
    return ajv.getSchema(
        [
            'openapi#',
            'paths',
            encodePointerSegment(operation.path),
            operation.method.toLowerCase(),
            'responses',
            String(operation.status),
            'content',
            encodePointerSegment(contentType),
            'schema',
        ].join('/'),
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
    const response = getResponseObject(operation)
    const content = response.content as Record<string, { schema?: unknown }> | undefined

    // spec が本文を定義していないレスポンス（204 など）
    if (!content) {
        return actualContentType === undefined
            ? []
            : [`spec は本文なしと定義していますが Content-Type '${actualContentType}' が返りました`]
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

    const validate = getValidator(operation, actualContentType)
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
