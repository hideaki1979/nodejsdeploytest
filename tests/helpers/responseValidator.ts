import Ajv, { type ValidateFunction } from 'ajv'
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
 * - nullable: true → 型ユニオン（JSON Schema に nullable は無い）
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

    if (source.nullable === true && typeof source.type === 'string') {
        converted.type = [source.type, 'null']
    }
    return converted
}

const ajv = new Ajv({ strict: false, allErrors: true })
addFormats(ajv)
// spec 全体を1つのスキーマとして登録し、$ref: '#/components/schemas/...' を解決できるようにする
ajv.addSchema(toJsonSchema(swaggerSpec) as object, 'openapi')

function escapeJsonPointer(segment: string): string {
    return segment.replace(/~/g, '~0').replace(/\//g, '~1')
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
    const method = (pathItem?.[operation.method.toLowerCase()] ?? undefined) as
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
            escapeJsonPointer(operation.path),
            operation.method.toLowerCase(),
            'responses',
            String(operation.status),
            'content',
            escapeJsonPointer(contentType),
            'schema',
        ].join('/'),
    )
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
    const content = response.content as Record<string, unknown> | undefined

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

    const validate = getValidator(operation, actualContentType)
    // content に載っているがスキーマの記載が無いケースは、検証対象なしとして扱う
    if (!validate || validate(body)) return []

    return (validate.errors ?? []).map((error) => {
        const at = error.instancePath === '' ? '(ルート)' : error.instancePath
        return `${at} ${error.message}`
    })
}
