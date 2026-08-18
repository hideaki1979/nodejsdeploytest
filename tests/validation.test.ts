import express, { type Express } from 'express'
import request from 'supertest'
import { container } from 'tsyringe'
import { pinoLogger } from '../src/di.token'
import { validate, type ValidationSchemas } from '../src/middlewares/zodValidation'
import { imageUpdateInputSchema, imageUploadInputSchema } from '../src/schemas/image.schema'
import { storeIdParamSchema, storeInputSchema } from '../src/schemas/store.schema'
import { userInputSchema } from '../src/schemas/user.schema'
import logger from './mocks/logger'

/**
 * リクエスト検証の振る舞いを直接確かめる。
 *
 * 契約テスト（tests/*.test.ts の expectApiResponse を使うもの）は
 * express-openapi-validator を先に通すため、型で弾かれる入力が
 * zod のスキーマまで届かない。移行で検証が緩くなっていないか・
 * エラーメッセージが変わっていないかは、そこでは確認できない。
 *
 * ここでは検証ミドルウェアだけを載せた最小のアプリで、
 * 受理・却下の境界と、req.body へ書き戻されるサニタイズ結果を見る。
 * 期待値は移行前の express-validator のチェーンから導いたもの。
 */

/** 検証ミドルウェアと、通過した req.body をそのまま返すだけのハンドラ */
function createValidationApp(schemas: ValidationSchemas, path = '/'): Express {
    container.reset()
    container.register(pinoLogger, { useValue: logger })

    const app = express()
    app.use(express.json())
    app.post(path, validate(schemas), (req, res) => {
        res.status(200).json({ body: req.body, params: req.params })
    })
    return app
}

/** 400 のときに返る details を、path → msg の対応表にする */
function messagesOf(body: unknown): Record<string, string> {
    const details = (body as { details?: { path: string; msg: string }[] }).details ?? []
    return Object.fromEntries(details.map((detail) => [detail.path, detail.msg]))
}

/** validation.ts の必須項目をすべて満たす最小の店舗入力 */
const validStoreInput = {
    store_name: 'ラーメン二郎',
    address: '東京都港区三田2-16-4',
    business_hours: '11:00-20:00',
    regular_holidays: '日曜',
    prior_meal_voucher: true,
    is_all_increased: false,
    is_lot: false,
}

describe('リクエスト検証', () => {
    describe('エラーレスポンスの形', () => {
        it('移行前と同じ { success, error, details } を返す', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({})

            expect(res.status).toBe(400)
            expect(res.body).toMatchObject({
                success: false,
                error: 'バリデーションエラー発生：入力値に誤りがあります。',
            })
            expect(res.body.details[0]).toMatchObject({
                type: 'field',
                location: 'body',
                path: 'store_name',
                msg: '店舗名は必須です',
            })
        })

        it('同一フィールドの2件目以降は返さない', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({ ...validStoreInput, store_name: '' })

            const paths = res.body.details.map((detail: { path: string }) => detail.path)
            expect(paths).toEqual([...new Set(paths)])
        })

        it('配列の要素は express-validator と同じ path 表記で返す', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app)
                .post('/')
                .send({
                    ...validStoreInput,
                    topping_calls: [
                        { topping_id: 'x', call_option_id: 1, call_timing: 'pre_call', noodle_type_id: 1 },
                    ],
                })

            expect(messagesOf(res.body)).toEqual({
                'topping_calls[0].topping_id': 'トッピングIDは整数で指定してください',
            })
        })

        it('ログには生の入力値を残さない（レスポンスの details には残す）', async () => {
            const app = createValidationApp({ body: userInputSchema })
            const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => undefined)

            try {
                const res = await request(app).post('/').send({ email: 'not-an-email' })

                expect(res.body.details[0]).toMatchObject({
                    path: 'email',
                    value: 'not-an-email',
                })

                const [logged] = errorSpy.mock.calls[0] as [{ errors: Record<string, unknown>[] }]
                expect(logged.errors[0]).toMatchObject({ path: 'email', location: 'body' })
                expect(logged.errors[0]).not.toHaveProperty('value')
            } finally {
                errorSpy.mockRestore()
            }
        })
    })

    describe('必須テキスト項目（店舗名）', () => {
        it.each([
            ['未指定', undefined, '店舗名は必須です'],
            ['null', null, '店舗名は必須です'],
            ['空文字', '', '店舗名は必須です'],
            ['空白のみ', '   ', '店舗名は必須です'],
            ['数値', 123, '店舗名は文字列で指定してください'],
            ['真偽値', true, '店舗名は文字列で指定してください'],
            ['オブジェクト', {}, '店舗名は文字列で指定してください'],
        ])('%s は %p を弾く', async (_name, value, message) => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({ ...validStoreInput, store_name: value })

            expect(res.status).toBe(400)
            expect(messagesOf(res.body).store_name).toBe(message)
        })

        it('255文字を超えると弾く', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app)
                .post('/')
                .send({ ...validStoreInput, store_name: 'あ'.repeat(256) })

            expect(messagesOf(res.body).store_name).toBe('店舗名は255文字以内で入力してください')
        })

        it('前後の空白を落として req.body へ書き戻す', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app)
                .post('/')
                .send({ ...validStoreInput, store_name: '  ラーメン二郎  ' })

            expect(res.status).toBe(200)
            expect(res.body.body.store_name).toBe('ラーメン二郎')
        })
    })

    describe('任意テキスト項目（支店名）', () => {
        it('未指定・null は素通しする', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({ ...validStoreInput, branch_name: null })

            expect(res.status).toBe(200)
            expect(res.body.body.branch_name).toBeNull()
        })

        it('空文字は「入力なし」としてそのまま許容する', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({ ...validStoreInput, branch_name: '  ' })

            expect(res.status).toBe(200)
            expect(res.body.body.branch_name).toBe('')
        })

        it('文字列以外は弾く', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({ ...validStoreInput, branch_name: 5 })

            expect(messagesOf(res.body).branch_name).toBe('支店名は文字列で指定してください')
        })
    })

    describe('整数・真偽値項目', () => {
        // 移行前の isInt() / isBoolean() は文字列表現も通していた。
        // 受理範囲は変えず、Prisma へ渡す前に数値・真偽値へ寄せる
        it('整数として読める文字列を受け付け、数値へ変換する', async () => {
            const app = createValidationApp({ body: imageUploadInputSchema })

            const res = await request(app)
                .post('/')
                .send({
                    store_id: '1',
                    menu_type: '2',
                    menu_name: '小ラーメン',
                    image_base64: 'data:image/png;base64,iVBORw0KGgo=',
                })

            expect(res.status).toBe(200)
            expect(res.body.body.store_id).toBe(1)
            expect(res.body.body.menu_type).toBe(2)
        })

        it.each([
            ['小数', 1.5],
            ['整数でない文字列', 'abc'],
            ['真偽値', true],
            // 文字列化すると整数に読める値。number でも string でもないため union の時点で
            // 落ちるが、メッセージまで整数エラーへ倒せているかを見る（zod の既定文言は英語）
            ['整数に読める要素1件の配列', [5]],
            ['要素が複数の配列', [1, 2]],
            ['オブジェクト', { value: 5 }],
        ])('%s は弾く', async (_name, value) => {
            const app = createValidationApp({ body: storeIdParamSchema })

            const res = await request(app).post('/').send({ id: value })

            expect(messagesOf(res.body).id).toBe('店舗IDは整数で指定してください')
        })

        it('真偽値として読める文字列を受け付け、真偽値へ変換する', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app)
                .post('/')
                .send({ ...validStoreInput, prior_meal_voucher: 'true', is_lot: '0' })

            expect(res.status).toBe(200)
            expect(res.body.body.prior_meal_voucher).toBe(true)
            expect(res.body.body.is_lot).toBe(false)
        })

        it('真偽値として読めない値は弾く', async () => {
            const app = createValidationApp({ body: storeInputSchema })

            const res = await request(app).post('/').send({ ...validStoreInput, is_lot: 'yes' })

            expect(messagesOf(res.body).is_lot).toBe('ロット制の有無は真偽値で指定してください')
        })
    })

    describe('パスパラメータ', () => {
        it('整数でない店舗IDを 400 に倒す', async () => {
            const app = createValidationApp({ params: storeIdParamSchema }, '/stores/:id')

            const res = await request(app).post('/stores/abc')

            expect(res.status).toBe(400)
            expect(res.body.details[0]).toMatchObject({
                location: 'params',
                path: 'id',
                msg: '店舗IDは整数で指定してください',
            })
        })

        it('検証を通った値はそのまま（文字列のまま）ハンドラへ渡す', async () => {
            const app = createValidationApp({ params: storeIdParamSchema }, '/stores/:id')

            const res = await request(app).post('/stores/12')

            expect(res.status).toBe(200)
            expect(res.body.params.id).toBe('12')
        })
    })

    describe('画像データ', () => {
        it('アップロード時、未指定は「必須です」になる', async () => {
            const app = createValidationApp({ body: imageUploadInputSchema })

            const res = await request(app)
                .post('/')
                .send({ store_id: 1, menu_type: 1, menu_name: '小ラーメン' })

            expect(messagesOf(res.body).image_base64).toBe('画像データは必須です')
        })

        it('アップロード時、data URL 形式でなければ形式エラーになる', async () => {
            const app = createValidationApp({ body: imageUploadInputSchema })

            const res = await request(app)
                .post('/')
                .send({ store_id: 1, menu_type: 1, menu_name: '小ラーメン', image_base64: 'not-an-image' })

            expect(messagesOf(res.body).image_base64).toBe(
                '無効な画像形式です。Base64エンコードされたJPEG、PNG、GIF、WEBPのみ対応しています',
            )
        })

        it('更新時は未指定を許容する', async () => {
            const app = createValidationApp({ body: imageUpdateInputSchema })

            const res = await request(app)
                .post('/')
                .send({ store_id: 1, menu_type: 1, menu_name: '大ラーメン' })

            expect(res.status).toBe(200)
            expect(res.body.body.image_base64).toBeUndefined()
        })

        it('data URL の MIME タイプは許可した4種のみ受け付ける', async () => {
            const app = createValidationApp({ body: imageUploadInputSchema })

            const res = await request(app).post('/').send({
                store_id: 1,
                menu_type: 1,
                menu_name: '小ラーメン',
                image_base64: 'data:image/svg+xml;base64,PHN2Zy8+',
            })

            expect(res.status).toBe(400)
        })
    })

    describe('ユーザー登録', () => {
        it('表示名とプロフィールを trim して HTML エスケープする', async () => {
            const app = createValidationApp({ body: userInputSchema })

            const res = await request(app)
                .post('/')
                .send({ displayName: '  <b>Taro</b>  ', bio: ' 二郎系が好きです ' })

            expect(res.status).toBe(200)
            expect(res.body.body.displayName).toBe('&lt;b&gt;Taro&lt;&#x2F;b&gt;')
            expect(res.body.body.bio).toBe('二郎系が好きです')
        })

        // 移行前は isLength() が trim より前に走っていたため、
        // 前後の空白も文字数に数えられていた
        it('文字数は trim 前の値で数える', async () => {
            const app = createValidationApp({ body: userInputSchema })

            const res = await request(app).post('/').send({ displayName: `${'あ'.repeat(50)} ` })

            expect(messagesOf(res.body).displayName).toBe('表示名は50文字以内で入力してください')
        })

        it('メールアドレスを正規化して書き戻す', async () => {
            const app = createValidationApp({ body: userInputSchema })

            const res = await request(app).post('/').send({ email: 'Taro.Yamada+jiro@GMail.com' })

            expect(res.status).toBe(200)
            expect(res.body.body.email).toBe('taroyamada@gmail.com')
        })

        it('不正なメールアドレスを弾く', async () => {
            const app = createValidationApp({ body: userInputSchema })

            const res = await request(app).post('/').send({ email: 'not-an-email' })

            expect(messagesOf(res.body).email).toBe('有効なメールアドレスを入力してください')
        })

        it('サポート外の認証プロバイダーを弾く', async () => {
            const app = createValidationApp({ body: userInputSchema })

            const res = await request(app).post('/').send({ authProvider: 'line' })

            expect(messagesOf(res.body).authProvider).toBe('サポートされていない認証プロバイダーです')
        })

        it('全項目が未指定でも通る', async () => {
            const app = createValidationApp({ body: userInputSchema })

            const res = await request(app).post('/').send({})

            expect(res.status).toBe(200)
            expect(res.body.body).toEqual({})
        })
    })

    // 移行前の express-validator から意図して変えた点。
    // いずれも「今まで通っていた不正な入力を弾く」方向で、
    // OpenAPI spec が以前から宣言していた型と実装を一致させるための変更。
    describe('移行時に意図して厳しくした入力', () => {
        it('表示名・プロフィールに文字列以外を渡すと弾く', async () => {
            const app = createValidationApp({ body: userInputSchema })

            // 移行前は文字列化されて '123' / 'true' として登録されていた
            const res = await request(app).post('/').send({ displayName: 123, bio: true })

            expect(res.status).toBe(400)
            expect(messagesOf(res.body)).toEqual({
                displayName: '表示名は文字列で指定してください',
                bio: 'プロフィールは文字列で指定してください',
            })
        })

        it('数値化すると精度が落ちる整数を弾く', async () => {
            const app = createValidationApp({ body: imageUploadInputSchema })

            // 移行前は文字列のまま Prisma へ渡っていたため BigInt として正しく扱えたが、
            // 数値へ寄せる以上 2^53 を超える値は別のIDへ化ける。黙って丸めずエラーにする
            const res = await request(app)
                .post('/')
                .send({
                    store_id: '9007199254740993',
                    menu_type: 1,
                    menu_name: '小ラーメン',
                    image_base64: 'data:image/png;base64,iVBORw0KGgo=',
                })

            expect(res.status).toBe(400)
            expect(messagesOf(res.body).store_id).toBe('店舗IDは扱える整数の範囲を超えています')
        })

        it('整数項目に配列を渡すと弾く', async () => {
            const app = createValidationApp({ body: imageUploadInputSchema })

            // 移行前は配列を要素ごとに検証していたため、空配列は
            // 「検証すべき要素が無い」として isInt() を通り抜けていた
            const res = await request(app)
                .post('/')
                .send({
                    store_id: [],
                    menu_type: 1,
                    menu_name: '小ラーメン',
                    image_base64: 'data:image/png;base64,iVBORw0KGgo=',
                })

            expect(res.status).toBe(400)
            expect(messagesOf(res.body).store_id).toBe('店舗IDは必須です')
        })
    })

    it('スキーマに無いキーは req.body から取り除く', async () => {
        const app = createValidationApp({ body: userInputSchema })

        const res = await request(app).post('/').send({ displayName: 'Taro', uid: 'spoofed-user-uid' })

        expect(res.status).toBe(200)
        expect(res.body.body).toEqual({ displayName: 'Taro' })
    })
})
