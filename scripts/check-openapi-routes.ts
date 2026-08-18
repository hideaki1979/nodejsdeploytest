/**
 * OpenAPI spec（zod スキーマから生成）と、Express が実際にマウントしている
 * ルート一覧を突き合わせ、片側にしか存在しないオペレーションを検出する。
 *
 * #72 で見つかった「ドキュメントのパスが存在しない」（/map, /call-options）と
 * 「未ドキュメントのエンドポイント」（/, /health）の両方を機械的に拾うためのもの。
 *
 * 使い方: npm run openapi:check-routes
 */
import { collectExpressRoutes, type ExpressRoute } from './collectExpressRoutes'

/**
 * OpenAPI 3.0 の Path Item Object がオペレーションとして定義しているキー。
 *
 * 除外キーの一覧（summary / parameters など）を持つ方式では、
 * Path Item に許された `x-` 拡張をオペレーションとして誤って拾ってしまう。
 * 仕様上メソッドは閉じた集合なので、許可する側を列挙する。
 */
const OPENAPI_OPERATION_METHODS = new Set([
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
])

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

/**
 * OpenAPI のオペレーションとして表現できないメソッドで登録されたルートを検出する。
 *
 * router.all() の 'all' や、router パッケージが持つ CONNECT / PROPFIND などには
 * Path Item Object 側に対応するキーが無く、そもそもドキュメント化する手段がない
 * （redocly も Path Item の不正なキーとしてエラーにする）。
 *
 * これらを「未ドキュメント」として報告すると、書きようのない修正を促すことになる。
 * また all を8メソッドへ展開すると、405 応答やプリフライト用の catch-all に対して
 * 8件の未ドキュメントを並べることになり、こちらも実態と合わない。
 * どう扱うべきかは登録の意図によるため、機械的に読み替えず個別の判断を促す。
 */
function findUnsupportedMethods(routes: ExpressRoute[]): ExpressRoute[] {
    return routes.filter((route) => !OPENAPI_OPERATION_METHODS.has(route.method))
}

/**
 * spec を読み込む。
 *
 * spec の生成はルート定義の require を伴うため、collectExpressRoutes() が
 * express.Router を差し替えるより先に読み込んではならない
 * （先に読み込むと routes が require キャッシュに載り、ルートを1件も拾えなくなる）。
 * import 文は巻き上げられて実行順を選べないため、ここで動的に読み込む。
 */
function collectSpecOperations(): Operation[] {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { swaggerSpec } = require('../src/config/swagger') as typeof import('../src/config/swagger')
    const operations: Operation[] = []

    for (const [specPath, pathItem] of Object.entries(swaggerSpec.paths ?? {})) {
        for (const key of Object.keys(pathItem as object)) {
            const method = key.toLowerCase()
            if (!OPENAPI_OPERATION_METHODS.has(method)) continue
            operations.push({ method, path: specPath })
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

    // 突き合わせの前に、そもそも OpenAPI で表現できない登録を弾く。
    // 無理に読み替えると、直しようのない「未ドキュメント」として報告してしまう。
    const unsupported = [
        { title: 'OpenAPI のパス表記へ変換できないルート', routes: findUnconvertiblePaths(expressRoutes) },
        { title: 'OpenAPI で表現できないメソッドのルート', routes: findUnsupportedMethods(expressRoutes) },
    ].filter((group) => group.routes.length > 0)

    if (unsupported.length > 0) {
        for (const group of unsupported) {
            printSection(group.title, group.routes.map(formatOperation))
        }
        console.error(
            '\n突き合わせを中止しました。ルート定義を見直すか、このスクリプトを対応させてください。',
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
        '\nルート定義（src/routes/*.ts）の Express への登録か registry.registerPath のどちらかを修正してください。',
    )
    process.exitCode = 1
}

main()
