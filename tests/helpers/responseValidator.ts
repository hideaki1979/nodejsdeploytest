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
    /** 省略時は application/json */
    contentType?: string
}

/**
 * 検証に使うスキーマを取り出す。spec に content が無いレスポンス（本文なし）は null を返す。
 */
function getValidator(operation: OperationRef): ValidateFunction | null {
    const contentType = operation.contentType ?? 'application/json'
    const ref = [
        'openapi#',
        'paths',
        escapeJsonPointer(operation.path),
        operation.method.toLowerCase(),
        'responses',
        String(operation.status),
        'content',
        escapeJsonPointer(contentType),
        'schema',
    ].join('/')

    const validate = ajv.getSchema(ref)
    if (validate) return validate

    // content 自体が無い（本文を返さない）ケースと、spec の記載漏れを区別する
    const responseRef = [
        'openapi#',
        'paths',
        escapeJsonPointer(operation.path),
        operation.method.toLowerCase(),
        'responses',
        String(operation.status),
    ].join('/')

    if (ajv.getSchema(responseRef)) return null

    throw new Error(
        `spec に ${operation.method.toUpperCase()} ${operation.path} の ${operation.status} が定義されていません`,
    )
}

/**
 * レスポンスボディを検証し、spec と食い違う点を人が読める形で返す。一致していれば空配列。
 */
export function findResponseViolations(body: unknown, operation: OperationRef): string[] {
    const validate = getValidator(operation)
    if (!validate) return []
    if (validate(body)) return []

    return (validate.errors ?? []).map((error) => {
        const at = error.instancePath === '' ? '(ルート)' : error.instancePath
        return `${at} ${error.message}`
    })
}
