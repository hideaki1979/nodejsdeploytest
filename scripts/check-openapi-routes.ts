/**
 * OpenAPI spec（@swagger JSDoc から生成）と、Express が実際にマウントしている
 * ルート一覧を突き合わせ、片側にしか存在しないオペレーションを検出する。
 *
 * #72 で見つかった「ドキュメントのパスが存在しない」（/map, /call-options）と
 * 「未ドキュメントのエンドポイント」（/, /health）の両方を機械的に拾うためのもの。
 *
 * 使い方: npm run openapi:check-routes
 */
import { collectExpressRoutes, type ExpressRoute } from './collectExpressRoutes'
import { swaggerSpec } from '../src/config/swagger'

/** OpenAPI の Path Item のうち、オペレーションではないキー。 */
const NON_OPERATION_KEYS = new Set(['$ref', 'summary', 'description', 'servers', 'parameters'])

interface Operation {
    method: string
    path: string
}

function formatOperation(operation: Operation): string {
    return `${operation.method.toUpperCase()} ${operation.path}`
}

/** Express のパスパラメータ表記（:id）を OpenAPI 表記（{id}）へ変換する。 */
function toOpenApiPath(expressPath: string): string {
    return expressPath.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

/**
 * OpenAPI のパステンプレートに変換できない Express 独自の記法を検出する。
 * ワイルドカード（*splat）や省略可能パラメータ（{/:id}）は OpenAPI に対応表現がないため、
 * 黙って読み替えず、突き合わせ前にエラーとして知らせる。
 */
function findUnconvertiblePaths(routes: ExpressRoute[]): ExpressRoute[] {
    return routes.filter((route) => /[*(){}]|:[^A-Za-z0-9_]/.test(route.path))
}

function collectSpecOperations(): Operation[] {
    const paths = (swaggerSpec as { paths?: Record<string, Record<string, unknown>> }).paths ?? {}
    const operations: Operation[] = []

    for (const [specPath, pathItem] of Object.entries(paths)) {
        for (const key of Object.keys(pathItem)) {
            if (NON_OPERATION_KEYS.has(key)) continue
            operations.push({ method: key.toLowerCase(), path: specPath })
        }
    }
    return operations
}

function printSection(title: string, operations: string[]): void {
    console.error(`\n❌ ${title}: ${operations.length}件`)
    for (const operation of operations) console.error(`   - ${operation}`)
}

function main(): void {
    const expressRoutes = collectExpressRoutes()

    const unconvertible = findUnconvertiblePaths(expressRoutes)
    if (unconvertible.length > 0) {
        printSection(
            'OpenAPI のパス表記へ変換できないルート（このスクリプトの対応が必要です）',
            unconvertible.map(formatOperation),
        )
        process.exitCode = 1
        return
    }

    const implemented = new Map<string, Operation>()
    for (const route of expressRoutes) {
        const operation: Operation = { method: route.method, path: toOpenApiPath(route.path) }
        implemented.set(formatOperation(operation), operation)
    }

    const documented = new Map<string, Operation>()
    for (const operation of collectSpecOperations()) {
        documented.set(formatOperation(operation), operation)
    }

    const documentedOnly = [...documented.keys()].filter((key) => !implemented.has(key)).sort()
    const implementedOnly = [...implemented.keys()].filter((key) => !documented.has(key)).sort()
    const matched = documented.size - documentedOnly.length

    console.log(`実装されているオペレーション: ${implemented.size}件`)
    console.log(`ドキュメント化されているオペレーション: ${documented.size}件`)
    console.log(`一致: ${matched}件`)

    if (documentedOnly.length === 0 && implementedOnly.length === 0) {
        console.log('\n✅ Swagger と実ルートは一致しています。')
        return
    }

    if (documentedOnly.length > 0) {
        printSection(
            'ドキュメントにはあるが実装に存在しないオペレーション（叩くと404になります）',
            documentedOnly,
        )
    }
    if (implementedOnly.length > 0) {
        printSection('実装されているがドキュメント化されていないオペレーション', implementedOnly)
    }

    console.error(
        '\nルート定義（src/routes/*.ts）か @swagger JSDoc のどちらかを修正してください。',
    )
    process.exitCode = 1
}

main()
