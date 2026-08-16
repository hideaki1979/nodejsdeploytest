import { swaggerSpec } from '../../src/config/swagger'

/** OpenAPI 3.0 の Path Item Object がオペレーションとして定義しているキー */
const OPENAPI_OPERATION_METHODS = new Set([
    'get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace',
])

export function formatOperation(method: string, specPath: string): string {
    return `${method.toUpperCase()} ${specPath}`
}

/** spec に定義されている全オペレーション */
export function listSpecOperations(): string[] {
    const paths = (swaggerSpec as { paths?: Record<string, Record<string, unknown>> }).paths ?? {}

    return Object.entries(paths).flatMap(([specPath, pathItem]) =>
        Object.keys(pathItem)
            .filter((key) => OPENAPI_OPERATION_METHODS.has(key.toLowerCase()))
            .map((method) => formatOperation(method, specPath)),
    )
}
