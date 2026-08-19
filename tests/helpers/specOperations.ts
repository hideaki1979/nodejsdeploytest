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
    return Object.entries(swaggerSpec.paths ?? {}).flatMap(([specPath, pathItem]) =>
        Object.keys(pathItem as object)
            .filter((key) => OPENAPI_OPERATION_METHODS.has(key.toLowerCase()))
            .map((method) => formatOperation(method, specPath)),
    )
}
