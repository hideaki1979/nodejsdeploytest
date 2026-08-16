/**
 * config/config.ts は import された時点で必須の環境変数を検証するため、
 * どのモジュールより先に値を入れる（jest.config.ts の setupFiles で実行）。
 *
 * ここで入れる値はどこにも接続しない。DB は DI でモックへ差し替え、
 * Firebase は moduleNameMapper でモジュールごと差し替えるため、
 * 接続文字列も認証情報も実際には使われない。
 *
 * 未設定のときだけ入れるのではなく、常に上書きする。
 * シェルや .env に NODE_ENV=production や別の DATABASE_URL が入っていると、
 * config.ts の分岐（本番では CORS_ALLOWED_ORIGINS 必須など）が変わり、
 * 実行環境によってテスト結果が変わってしまうため。
 */
const TEST_ENV: Record<string, string> = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://contract-test:contract-test@127.0.0.1:5432/contract-test',
    FIREBASE_STORAGE_BUCKET: 'contract-test.appspot.com',
    GOOGLE_APPLICATION_CREDENTIALS: 'contract-test.json',
    GOOGLE_MAPS_API_KEY: 'contract-test',
    CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
    PRISMA_TRANSACTION_MAX_WAIT: '10000',
    PRISMA_TRANSACTION_TIMEOUT: '60000',
}

for (const [key, value] of Object.entries(TEST_ENV)) {
    process.env[key] = value
}
