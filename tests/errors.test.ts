import request from 'supertest'
import { expectApiResponse } from './helpers/assert'
import { AUTH_HEADER, TEST_USER_ID } from './helpers/auth'
import { createTestApp } from './helpers/testApp'
import { auth } from './mocks/firebase'

/**
 * エラーレスポンスの契約テスト。
 *
 * このAPIはエラーの返し方が2系統に分かれている。
 *   - authMiddleware        … { status, message }（AuthErrorResponse）
 *   - errorMiddleware 経由  … { success, error }（ErrorResponse）
 * spec 側もそのとおりに書いてあるかを、両方の経路で確認する。
 */

/** Firebase Admin SDK が投げるエラー（code を持つ Error） */
function firebaseError(code: string): Error {
    return Object.assign(new Error(`firebase: ${code}`), { code })
}

describe('Errors', () => {
    beforeEach(() => {
        // authMiddleware / errorMiddleware が原因調査用に console.error へ出すため、
        // 期待どおりのエラーで出る分はテスト出力から抑制する
        jest.spyOn(console, 'error').mockImplementation(() => undefined)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('トークン検証に失敗すると 401 が spec どおりに応答する', async () => {
        const { app } = createTestApp()
        auth.verifyIdToken.mockRejectedValueOnce(firebaseError('auth/id-token-expired'))

        const res = await request(app).get(`/users/${TEST_USER_ID}`).set('Authorization', AUTH_HEADER)

        expectApiResponse(res, { method: 'get', path: '/users/{uid}', status: 401 })
    })

    it('認証サービスに接続できないと 503 が spec どおりに応答する', async () => {
        const { app } = createTestApp()
        auth.verifyIdToken.mockRejectedValueOnce(firebaseError('app/network-error'))

        const res = await request(app).get(`/users/${TEST_USER_ID}`).set('Authorization', AUTH_HEADER)

        expectApiResponse(res, { method: 'get', path: '/users/{uid}', status: 503 })
    })

    // 403（ErrorResponse 形式）は tests/users.test.ts の権限チェックで検証している

    it('ユーザーが存在しないと 404 が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.user.findUnique.mockResolvedValue(null)

        const res = await request(app).get(`/users/${TEST_USER_ID}`).set('Authorization', AUTH_HEADER)

        expectApiResponse(res, { method: 'get', path: '/users/{uid}', status: 404 })
    })

    it('予期せぬ例外が起きると 500 が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.user.findUnique.mockRejectedValue(new Error('DB接続エラー'))

        const res = await request(app).get(`/users/${TEST_USER_ID}`).set('Authorization', AUTH_HEADER)

        expectApiResponse(res, { method: 'get', path: '/users/{uid}', status: 500 })
    })

    it('店舗が存在しないと 404 が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.findUnique.mockResolvedValue(null)

        const res = await request(app).get('/stores/999')

        expectApiResponse(res, { method: 'get', path: '/stores/{id}', status: 404 })
    })

    it('入力値に誤りがあると 400 が spec どおりに応答する', async () => {
        const { app } = createTestApp()

        // 型としては spec を満たすため OpenAPI バリデータは通過し、
        // 実装側の検証ミドルウェア（zodValidation）が 400 を返す経路になる。
        // 型で弾かれる値を送ると spec の ValidationError.details を検証できない。
        const res = await request(app)
            .post('/stores')
            .set('Authorization', AUTH_HEADER)
            .send({
                store_name: '   ',
                address: '東京都港区三田2-16-4',
                business_hours: '11:00-20:00',
                regular_holidays: '日曜',
                prior_meal_voucher: true,
                is_all_increased: false,
                is_lot: false,
            })

        expectApiResponse(res, { method: 'post', path: '/stores', status: 400 })
    })
})
