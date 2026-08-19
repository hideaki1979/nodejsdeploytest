import request from 'supertest'
import { expectApiResponse, expectStatus } from './helpers/assert'
import { AUTH_HEADER } from './helpers/auth'
import { createTestApp } from './helpers/testApp'
import {
    mapRow,
    mapWriteRow,
    storeDetailRow,
    storeListRow,
    storeToppingCallWriteRow,
    storeWriteRow,
} from './fixtures/prismaRows'

/** POST / PUT /stores のリクエストボディ（validation.ts の必須項目を満たす） */
const storeInput = {
    store_name: 'ラーメン二郎',
    branch_name: '三田本店',
    address: '東京都港区三田2-16-4',
    business_hours: '11:00-20:00',
    regular_holidays: '日曜',
    prior_meal_voucher: true,
    is_all_increased: false,
    is_lot: false,
    topping_details: 'ニンニク増し可',
    call_details: '着丼前にコール',
    topping_calls: [
        { topping_id: 1, call_option_id: 1, call_timing: 'pre_call', noodle_type_id: 1 },
    ],
}

describe('Stores', () => {
    it('GET /stores が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.findMany.mockResolvedValue([storeListRow])

        const res = await request(app).get('/stores')

        expectApiResponse(res, { method: 'get', path: '/stores', status: 200 })
    })

    it('GET /stores/{id} が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.findUnique.mockResolvedValue(storeDetailRow)

        const res = await request(app).get('/stores/1')

        expectApiResponse(res, { method: 'get', path: '/stores/{id}', status: 200 })
    })

    it('GET /stores/{id}/toppingcalls が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.findUnique.mockResolvedValue(storeDetailRow)

        const res = await request(app).get('/stores/1/toppingcalls')

        expectApiResponse(res, { method: 'get', path: '/stores/{id}/toppingcalls', status: 200 })
    })

    it('GET /stores/{id}/toppingcalls は spec に定義されたクエリパラメータを受け付ける', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.findUnique.mockResolvedValue(storeDetailRow)

        const res = await request(app)
            .get('/stores/1/toppingcalls')
            .query({ call_timing: 'pre_call', topping_id: 1, call_option_id: 1, noodleTypeId: 1 })

        expectApiResponse(res, { method: 'get', path: '/stores/{id}/toppingcalls', status: 200 })
    })

    // このルートだけ validate({ params }) が漏れており、店舗IDの検証を
    // コントローラの Number() 変換に頼っていた。2^53 を超える値は
    // 黙って別のIDへ丸まり、存在する別店舗を引けてしまう
    it('GET /stores/{id}/toppingcalls は数値化すると別IDへ化ける店舗IDを弾く', async () => {
        const { app, prisma } = createTestApp()

        const res = await request(app).get('/stores/9007199254740993/toppingcalls')

        expectApiResponse(res, { method: 'get', path: '/stores/{id}/toppingcalls', status: 400 })
        expect(prisma.store.findUnique).not.toHaveBeenCalled()
    })

    // #92: 絞り込み値の誤りもパスパラメータと同じく validate が 400 で返す。
    // 整数ではあるため spec の型検証は通り、範囲の判定はスキーマ側が担う
    it('GET /stores/{id}/toppingcalls は数値化すると別IDへ化ける絞り込みIDを弾く', async () => {
        const { app, prisma } = createTestApp()

        const res = await request(app)
            .get('/stores/1/toppingcalls')
            .query({ topping_id: '9007199254740993' })

        expectApiResponse(res, { method: 'get', path: '/stores/{id}/toppingcalls', status: 400 })
        expect(res.body.details[0]).toMatchObject({
            location: 'query',
            path: 'topping_id',
            msg: 'トッピングIDは扱える整数の範囲を超えています',
        })
        expect(prisma.store.findUnique).not.toHaveBeenCalled()
    })

    it('GET /maps が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.map.findMany.mockResolvedValue([mapRow])

        const res = await request(app).get('/maps')

        expectApiResponse(res, { method: 'get', path: '/maps', status: 200 })
    })

    it('POST /stores が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.create.mockResolvedValue(storeWriteRow)
        prisma.map.create.mockResolvedValue(mapWriteRow)
        prisma.storeToppingCall.create.mockResolvedValue(storeToppingCallWriteRow)

        const res = await request(app).post('/stores').set('Authorization', AUTH_HEADER).send(storeInput)

        expectApiResponse(res, { method: 'post', path: '/stores', status: 201 })
    })

    it('PUT /stores/{id} が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.update.mockResolvedValue(storeWriteRow)
        prisma.map.update.mockResolvedValue(mapWriteRow)
        prisma.map.findUnique.mockResolvedValue(mapWriteRow)
        prisma.storeToppingCall.deleteMany.mockResolvedValue({ count: 1 })
        prisma.storeToppingCall.create.mockResolvedValue(storeToppingCallWriteRow)

        const res = await request(app).put('/stores/1').set('Authorization', AUTH_HEADER).send(storeInput)

        expectApiResponse(res, { method: 'put', path: '/stores/{id}', status: 200 })
    })

    it('PATCH /stores/{id}/close が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.update.mockResolvedValue({ ...storeWriteRow, store_name: '【閉店】ラーメン二郎', is_close: true })

        const res = await request(app)
            .patch('/stores/1/close')
            .set('Authorization', AUTH_HEADER)
            .send({ storeName: 'ラーメン二郎' })

        expectApiResponse(res, { method: 'patch', path: '/stores/{id}/close', status: 200 })
    })

    it('POST /stores は spec が必須としている項目だけでも登録できる', async () => {
        const { app, prisma } = createTestApp()
        prisma.store.create.mockResolvedValue(storeWriteRow)
        prisma.map.create.mockResolvedValue(mapWriteRow)

        // spec の StoreInput.required だけを送る。
        // 実装がこれ以上を必須にしていれば 400 になり、spec の記載不足（#72 B-5）に気づける。
        const res = await request(app)
            .post('/stores')
            .set('Authorization', AUTH_HEADER)
            .send({
                store_name: 'ラーメン二郎',
                address: '東京都港区三田2-16-4',
                business_hours: '11:00-20:00',
                regular_holidays: '日曜',
                prior_meal_voucher: true,
                is_all_increased: false,
                is_lot: false,
            })

        expectStatus(res, 201)
    })
})
