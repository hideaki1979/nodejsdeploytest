import request from 'supertest'
import { expectApiResponse } from './helpers/assert'
import { createTestApp } from './helpers/testApp'

describe('System', () => {
    it('GET / が spec どおりに応答する', async () => {
        const { app } = createTestApp()

        const res = await request(app).get('/')

        expectApiResponse(res, { method: 'get', path: '/', status: 200 })
    })

    it('GET /health が spec どおりに応答する', async () => {
        const { app } = createTestApp()

        const res = await request(app).get('/health')

        expectApiResponse(res, { method: 'get', path: '/health', status: 200 })
    })
})
