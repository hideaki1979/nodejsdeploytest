import request from 'supertest'
import { expectApiResponse, expectStatus } from './helpers/assert'
import { AUTH_HEADER, TEST_USER_ID } from './helpers/auth'
import { createTestApp } from './helpers/testApp'

/** Prisma の user 行を模したデータ（レスポンスはこの行をそのまま返す） */
const userRow = {
    id: TEST_USER_ID,
    display_name: 'テストユーザー',
    email: 'test@example.com',
    bio: null,
    provider: 'google',
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
}

describe('Users', () => {
    it('POST /users が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.user.create.mockResolvedValue(userRow)

        const res = await request(app)
            .post('/users')
            .set('Authorization', AUTH_HEADER)
            .send({
                email: 'test@example.com',
                displayName: 'テストユーザー',
                authProvider: 'google',
                bio: '二郎系が好きです',
            })

        expectApiResponse(res, { method: 'post', path: '/users', status: 201 })
    })

    it('POST /users は uid をリクエストボディではなく検証済みトークンから採る', async () => {
        const { app, prisma } = createTestApp()
        prisma.user.create.mockResolvedValue(userRow)

        await request(app)
            .post('/users')
            .set('Authorization', AUTH_HEADER)
            .send({
                email: 'test@example.com',
                displayName: 'テストユーザー',
                authProvider: 'google',
                // 他人になりすまそうとするリクエスト。無視されなければならない
                uid: 'spoofed-user-uid',
            })

        // なりすまし防止のため、登録される id はトークン由来でなければならない
        expect(prisma.user.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ id: TEST_USER_ID }) }),
        )
    })

    it('GET /users/{uid} が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.user.findUnique.mockResolvedValue(userRow)

        const res = await request(app).get(`/users/${TEST_USER_ID}`).set('Authorization', AUTH_HEADER)

        expectApiResponse(res, { method: 'get', path: '/users/{uid}', status: 200 })
    })

    it('GET /users/{uid} は他人のUIDを参照できない', async () => {
        const { app, prisma } = createTestApp()
        prisma.user.findUnique.mockResolvedValue(userRow)

        const res = await request(app).get('/users/another-user-uid').set('Authorization', AUTH_HEADER)

        expectStatus(res, 403)
    })
})
