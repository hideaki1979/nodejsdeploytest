/**
 * Express が実際にマウントしているルート一覧を、アプリを起動せずに収集する。
 *
 * Express 5 の Layer は path-to-regexp v8 ベースになり、Express 4 のように
 * `layer.regexp.source` からマウントパスを復元することができなくなった。
 * そこで内部構造には触れず、`express.Router` を差し替えて
 * 「どの Router に、どのパス・メソッドが登録されたか」を登録時に記録する。
 *
 * ルート定義ファイルは controller → service と芋づるに import されるため、
 * import 時に副作用を持つモジュール（Firebase 初期化）と
 * 必須の環境変数は、収集前にスタブ／既定値で埋めておく。
 */
// controller / service は tsyringe のデコレータを使うため、
// それらを import するより先にポリフィルを読み込む必要がある（src/app.ts と同じ理由）。
import 'reflect-metadata'
import express from 'express'
import path from 'node:path'

export interface ExpressRoute {
    /** 小文字のHTTPメソッド名（`all` で登録された場合は 'all'） */
    method: string
    /** Express 形式のフルパス。例: /stores/:id/toppingcalls */
    path: string
}

type UnknownFn = (...args: unknown[]) => unknown

interface RouterRecord {
    routes: ExpressRoute[]
    mounts: { path: string; child: object }[]
}

/**
 * Route.prototype 上のメソッドのうち、HTTPメソッドではないもの。
 * これ以外は全て HTTP メソッドとして扱う（router パッケージのメソッド一覧に追随するため）。
 */
const NON_HTTP_ROUTE_MEMBERS = new Set(['constructor', 'dispatch', '_handlesMethod', '_methods'])

/**
 * config.ts は import 時に必須の環境変数を検証するため、未設定なら仮の値で埋める。
 * ここで注入する値は一切使われない（DBにもFirebaseにも接続しない）。
 */
const ENV_FALLBACKS: Record<string, string> = {
    DATABASE_URL: 'postgresql://openapi-check:openapi-check@127.0.0.1:5432/openapi-check',
    FIREBASE_STORAGE_BUCKET: 'openapi-check.appspot.com',
    FIREBASE_CONFIG: '{}',
    GOOGLE_APPLICATION_CREDENTIALS: 'openapi-check.json',
    GOOGLE_MAPS_API_KEY: 'openapi-check',
    CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    PRISMA_TRANSACTION_MAX_WAIT: '10000',
    PRISMA_TRANSACTION_TIMEOUT: '60000',
}

function applyEnvFallbacks(): void {
    for (const [key, value] of Object.entries(ENV_FALLBACKS)) {
        if (!process.env[key]) process.env[key] = value
    }
}

/**
 * config/firebase.ts は import しただけで認証情報を読みに行くため、
 * require キャッシュへ空のモジュールを先に差し込んで実行を回避する。
 */
function stubFirebaseModule(): void {
    const firebasePath = require.resolve('../src/config/firebase')
    if (require.cache[firebasePath]) return

    require.cache[firebasePath] = {
        id: firebasePath,
        filename: firebasePath,
        path: path.dirname(firebasePath),
        loaded: true,
        children: [],
        paths: [],
        exports: { auth: {}, bucket: {} },
    } as unknown as NodeModule
}

/**
 * Route インスタンスのHTTPメソッドを差し替え、呼ばれたメソッド名を記録する。
 * Express 5 の `router.get(path, ...)` は内部で `router.route(path)[method](...)` を呼ぶため、
 * ここを押さえれば全HTTPメソッドを取りこぼさずに拾える。
 */
function instrumentRoute(route: object, routePath: string, record: RouterRecord): void {
    const prototype = Object.getPrototypeOf(route) as Record<string, unknown>
    const target = route as unknown as Record<string, UnknownFn>

    for (const name of Object.getOwnPropertyNames(prototype)) {
        if (NON_HTTP_ROUTE_MEMBERS.has(name)) continue
        const original = prototype[name]
        if (typeof original !== 'function') continue

        const bound = (original as UnknownFn).bind(route)
        target[name] = (...args: unknown[]) => {
            record.routes.push({ method: name, path: routePath })
            return bound(...args)
        }
    }
}

function toPathList(value: unknown): string[] {
    if (typeof value === 'string') return [value]
    if (Array.isArray(value) && value.every((v) => typeof v === 'string')) return value as string[]
    return []
}

function instrumentRouter(router: object, records: Map<object, RouterRecord>): void {
    const record: RouterRecord = { routes: [], mounts: [] }
    records.set(router, record)

    // Router は関数オブジェクトのため、インスタンスへの代入がプロトタイプのメソッドを隠す。
    const target = router as unknown as Record<string, UnknownFn>

    const originalRoute = target.route.bind(router)
    target.route = (...args: unknown[]) => {
        const created = originalRoute(...args)
        const [routePath] = args
        if (typeof routePath === 'string' && typeof created === 'object' && created !== null) {
            instrumentRoute(created, routePath, record)
        }
        return created
    }

    const originalUse = target.use.bind(router)
    target.use = (...args: unknown[]) => {
        const mountPaths = toPathList(args[0])
        const handlers = (mountPaths.length > 0 ? args.slice(1) : args).flat()

        for (const handler of handlers) {
            if (typeof handler !== 'function' || !records.has(handler)) continue
            for (const mountPath of mountPaths.length > 0 ? mountPaths : ['/']) {
                record.mounts.push({ path: mountPath, child: handler })
            }
        }
        return originalUse(...args)
    }
}

/** `/stores` と `/:id` を `/stores/:id` に、`/stores` と `/` を `/stores` に繋ぐ。 */
export function joinPaths(prefix: string, segment: string): string {
    const joined = `${prefix}/${segment}`.replace(/\/{2,}/g, '/')
    return joined.length > 1 && joined.endsWith('/') ? joined.slice(0, -1) : joined
}

function walk(router: object, prefix: string, records: Map<object, RouterRecord>, out: ExpressRoute[]): void {
    const record = records.get(router)
    if (!record) return

    for (const route of record.routes) {
        out.push({ method: route.method, path: joinPaths(prefix, route.path) })
    }
    for (const mount of record.mounts) {
        walk(mount.child, joinPaths(prefix, mount.path), records, out)
    }
}

/**
 * src/routes/routes.ts のルーターツリーを走査し、実際に登録されているルートを列挙する。
 */
export function collectExpressRoutes(): ExpressRoute[] {
    applyEnvFallbacks()
    stubFirebaseModule()

    const records = new Map<object, RouterRecord>()
    const originalRouterFactory = express.Router

    const patchedFactory = ((...args: unknown[]) => {
        const router = (originalRouterFactory as unknown as UnknownFn)(...args) as object
        instrumentRouter(router, records)
        return router
    }) as unknown as typeof express.Router

    express.Router = patchedFactory
    let rootRouter: object
    try {
        // ルート定義の読み込みは差し替え後でなければならないため、動的 require を使う。
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        rootRouter = require('../src/routes/routes').default as object
    } finally {
        express.Router = originalRouterFactory
    }

    const routes: ExpressRoute[] = []
    walk(rootRouter, '', records, routes)
    return routes
}
