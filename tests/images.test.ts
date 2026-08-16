import request from 'supertest'
import { expectApiResponse } from './helpers/assert'
import { AUTH_HEADER, TEST_USER_ID } from './helpers/auth'
import { createTestApp } from './helpers/testApp'
import { imageRow } from './fixtures/prismaRows'

/** 1x1 の PNG。imageValidation.ts が data URL 形式であることを検証する */
const IMAGE_BASE64 =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

/** 画像に紐づくトッピングコール（一覧取得が include で引く形） */
const imageToppingCallRow = {
    image_id: imageRow.id,
    topping_id: BigInt(1),
    store_topping_call_id: BigInt(10),
    store_topping_call: {
        call_option_id: BigInt(1),
        topping: { topping_name: 'ニンニク' },
        call_option: { call_option_name: 'マシ' },
    },
}

describe('Images', () => {
    it('GET /stores/{storeId}/images が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.image.findMany.mockResolvedValue([imageRow])
        prisma.imageStoreToppingCall.findMany.mockResolvedValue([imageToppingCallRow])

        const res = await request(app).get('/stores/1/images')

        expectApiResponse(res, { method: 'get', path: '/stores/{storeId}/images', status: 200 })
    })

    it('GET /stores/{storeId}/images/{imageId} が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.image.findFirst.mockResolvedValue({
            ...imageRow,
            image_topping_calls: [imageToppingCallRow],
        })

        const res = await request(app).get('/stores/1/images/100')

        expectApiResponse(res, {
            method: 'get',
            path: '/stores/{storeId}/images/{imageId}',
            status: 200,
        })
    })

    it('一覧取得と個別取得でIDの型が揃っている', async () => {
        const { app, prisma } = createTestApp()
        prisma.image.findMany.mockResolvedValue([imageRow])
        prisma.imageStoreToppingCall.findMany.mockResolvedValue([imageToppingCallRow])
        prisma.image.findFirst.mockResolvedValue({
            ...imageRow,
            image_topping_calls: [imageToppingCallRow],
        })

        const list = await request(app).get('/stores/1/images')
        const detail = await request(app).get('/stores/1/images/100')

        // 同じ画像IDが経路によって型を変えないこと（#72 B-6 / #79）
        expect(typeof list.body.data[0].id).toBe('string')
        expect(typeof detail.body.data.id).toBe(typeof list.body.data[0].id)
        expect(detail.body.data.id).toBe(list.body.data[0].id)
    })

    it('POST /stores/{storeId}/images が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.image.create.mockResolvedValue(imageRow)
        prisma.imageStoreToppingCall.create.mockResolvedValue(imageToppingCallRow)
        prisma.storeToppingCall.findMany.mockResolvedValue([{ id: BigInt(10), store_id: BigInt(1) }])

        const res = await request(app)
            .post('/stores/1/images')
            .set('Authorization', AUTH_HEADER)
            .send({
                store_id: 1,
                menu_type: 1,
                menu_name: '小ラーメン',
                image_base64: IMAGE_BASE64,
                topping_selections: [{ topping_id: 1, call_option_id: 1, store_topping_call_id: 10 }],
            })

        expectApiResponse(res, { method: 'post', path: '/stores/{storeId}/images', status: 201 })
    })

    it('PUT /stores/{storeId}/images/{imageId} が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.image.findFirst.mockResolvedValue({ ...imageRow, user_id: TEST_USER_ID })
        prisma.image.update.mockResolvedValue(imageRow)
        prisma.imageStoreToppingCall.deleteMany.mockResolvedValue({ count: 1 })
        prisma.imageStoreToppingCall.create.mockResolvedValue(imageToppingCallRow)
        prisma.storeToppingCall.findMany.mockResolvedValue([{ id: BigInt(10), store_id: BigInt(1) }])

        const res = await request(app)
            .put('/stores/1/images/100')
            .set('Authorization', AUTH_HEADER)
            .send({
                store_id: 1,
                menu_type: 1,
                menu_name: '大ラーメン',
                topping_selections: [{ topping_id: 1, call_option_id: 1, store_topping_call_id: 10 }],
            })

        expectApiResponse(res, {
            method: 'put',
            path: '/stores/{storeId}/images/{imageId}',
            status: 200,
        })
    })

    it('DELETE /stores/{storeId}/images/{imageId} が spec どおりに応答する', async () => {
        const { app, prisma } = createTestApp()
        prisma.image.findFirst.mockResolvedValue({ ...imageRow, user_id: TEST_USER_ID })
        prisma.imageStoreToppingCall.deleteMany.mockResolvedValue({ count: 1 })
        prisma.image.delete.mockResolvedValue(imageRow)

        const res = await request(app)
            .delete('/stores/1/images/100')
            .set('Authorization', AUTH_HEADER)

        expectApiResponse(res, {
            method: 'delete',
            path: '/stores/{storeId}/images/{imageId}',
            status: 200,
        })
    })
})
