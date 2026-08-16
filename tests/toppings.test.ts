import request from 'supertest'
import { expectApiResponse } from './helpers/assert'
import { createTestApp } from './helpers/testApp'

/**
 * Prisma が返す行を模したデータ。
 * 主キーは実際と同じ BigInt で渡し、レスポンスで文字列になること（#72 B-1）まで含めて検証する。
 */
const toppingRows = [
    {
        id: BigInt(1),
        topping_name: 'ニンニク',
        topping_category: 2,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
    },
]

const callOptionRows = [
    {
        id: BigInt(1),
        call_option_name: 'マシ',
        call_category: 2,
        created_at: new Date('2026-01-01T00:00:00.000Z'),
        updated_at: new Date('2026-01-01T00:00:00.000Z'),
    },
]

describe('Toppings', () => {
    it('GET /toppings が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.topping.findMany.mockResolvedValue(toppingRows)

        const res = await request(app).get('/toppings')

        expectApiResponse(res, { method: 'get', path: '/toppings', status: 200 })
        expect(res.body.data[0].id).toBe('1')
    })

    it('GET /calloptions が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.callOption.findMany.mockResolvedValue(callOptionRows)

        const res = await request(app).get('/calloptions')

        expectApiResponse(res, { method: 'get', path: '/calloptions', status: 200 })
        expect(res.body.data[0].id).toBe('1')
    })

    it('GET /toppings/calloptions/formatted が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.topping.findMany.mockResolvedValue(
            toppingRows.map(({ id, topping_category, topping_name }) => ({ id, topping_category, topping_name })),
        )
        prisma.callOption.findMany.mockResolvedValue(
            callOptionRows.map(({ id, call_category, call_option_name }) => ({ id, call_category, call_option_name })),
        )

        const res = await request(app).get('/toppings/calloptions/formatted')

        expectApiResponse(res, { method: 'get', path: '/toppings/calloptions/formatted', status: 200 })
        // data は配列ではなくトッピングIDをキーとするオブジェクト（#72 A-5）
        expect(Object.keys(res.body.data)).toEqual(['1'])
    })
})
