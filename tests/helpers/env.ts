/**
 * config/config.ts は import された時点で必須の環境変数を検証するため、
 * どのモジュールより先に仮の値を入れる（jest.config.ts の setupFiles で実行）。
 *
 * ここで入れる値はどこにも接続しない。DB は DI でモックへ差し替え、
 * Firebase は moduleNameMapper でモジュールごと差し替えるため、
 * 接続文字列も認証情報も実際には使われない。
 */
const ENV_FALLBACKS: Record<string, string> = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://contract-test:contract-test@127.0.0.1:5432/contract-test',
    FIREBASE_STORAGE_BUCKET: 'contract-test.appspot.com',
    GOOGLE_APPLICATION_CREDENTIALS: 'contract-test.json',
    GOOGLE_MAPS_API_KEY: 'contract-test',
    CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    PRISMA_TRANSACTION_MAX_WAIT: '10000',
    PRISMA_TRANSACTION_TIMEOUT: '60000',
}

for (const [key, value] of Object.entries(ENV_FALLBACKS)) {
    if (!process.env[key]) process.env[key] = value
}
