/**
 * 認証が必要なエンドポイント用のヘッダ。
 *
 * トークンの中身は検証されない（tests/mocks/firebase.ts の verifyIdToken が
 * 常に TEST_USER_ID を返す）。spec の security 指定を満たすためだけに付ける。
 */
export const AUTH_HEADER = 'Bearer contract-test-token'

export { TEST_USER_ID } from '../mocks/firebase'
