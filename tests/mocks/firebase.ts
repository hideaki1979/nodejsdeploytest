/**
 * src/config/firebase.ts の差し替え（jest.config.ts の moduleNameMapper 経由）。
 *
 * 本物は import された時点でサービスアカウントを読み、Firebase Admin を初期化する。
 * 契約テストは HTTP レスポンスの形だけを見るため、実際の認証・ストレージは不要。
 */

/** authMiddleware が検証済みトークンとして受け取る値 */
export const TEST_USER_ID = 'test-user-uid'

export const auth = {
    verifyIdToken: jest.fn(async () => ({
        uid: TEST_USER_ID,
        // utils/auth.ts が参照するカスタムクレーム
        admin: false,
    })),
}

/** imageService が Storage 上のファイルに対して呼ぶ操作の一式 */
export const bucket = {
    name: 'test-bucket',
    file: jest.fn(() => ({
        save: jest.fn(async () => undefined),
        makePublic: jest.fn(async () => undefined),
        exists: jest.fn(async () => [true]),
        delete: jest.fn(async () => undefined),
    })),
}
