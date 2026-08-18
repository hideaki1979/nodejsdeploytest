/**
 * OpenAPI spec の生成・突き合わせをコマンドラインから行うための下準備。
 *
 * spec は zod スキーマから生成するようになったため、生成には
 * src/routes/*.ts（と、そこから芋づるに読み込まれる controller / service）を
 * 実際に require する必要がある。その過程で
 *   - config.ts が必須の環境変数を検証する
 *   - config/firebase.ts が import しただけで認証情報を読みに行く
 * ため、読み込みの前にどちらも無害化しておく。
 *
 * ここで入れる値も差し込むモジュールも一切使われない（DBにもFirebaseにも接続しない）。
 */
// controller / service は tsyringe のデコレータを使うため、
// それらを読み込むより先にポリフィルが要る（src/app.ts と同じ理由）。
import 'reflect-metadata'
import path from 'node:path'

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

/** src 配下を require する前に必ず呼ぶ。複数回呼んでも副作用は増えない */
export function bootstrapSpecEnv(): void {
    applyEnvFallbacks()
    stubFirebaseModule()
}
