import { Router } from "express"
import { ToppingController } from "../controllers/toppingController"
import { createHandler } from "../utils/routeHandler"
import { registry } from "../openapi/registry"
import { z } from "../openapi/zod"
import { successEnvelope } from "../schemas/common.schema"
import {
    callOptionSchema,
    formattedToppingCallOptionMapSchema,
    toppingSchema,
} from "../schemas/topping.schema"

const toppingRouter = Router()

registry.registerPath({
    method: 'get',
    path: '/toppings',
    tags: ['Toppings'],
    summary: '全トッピング情報取得',
    description: 'データベースに登録されている全てのトッピング情報を取得します。認証は不要です。',
    security: [],
    responses: {
        200: {
            description: '正常に全トッピング情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('トッピング情報を正常に取得できました', z.array(toppingSchema)),
                },
            },
        },
    },
})
toppingRouter.get('/', createHandler(ToppingController, 'getToppingAll'))

registry.registerPath({
    method: 'get',
    path: '/toppings/calloptions/formatted',
    tags: ['Toppings'],
    summary: 'フォーマット済みトッピングコールオプション取得',
    description: [
        'フロントエンド表示用に、各トッピングとそのトッピングカテゴリに一致するコールオプションを取得します。\n',
        'data は配列ではなく、トッピングIDをキーとしたオブジェクトで返ります。認証は不要です。',
    ].join(''),
    security: [],
    responses: {
        200: {
            description: '正常にフォーマット済みトッピングコールオプションを取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope(
                        'トッピング・コールオプション情報を正常に取得できました',
                        formattedToppingCallOptionMapSchema,
                    ),
                },
            },
        },
    },
})
toppingRouter.get(`/calloptions/formatted`, createHandler(ToppingController, 'getFormattedToppingCollOption'))

registry.registerPath({
    method: 'get',
    path: '/calloptions',
    tags: ['Toppings'],
    summary: '全コールオプション取得',
    description:
        'データベースに登録されている全てのコールオプション（マシマシ等）を取得します。認証は不要です。',
    security: [],
    responses: {
        200: {
            description: '正常に全コールオプション情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope(
                        'コールオプション情報を正常に取得できました',
                        z.array(callOptionSchema),
                    ),
                },
            },
        },
    },
})
const callOptionRouter = Router()
callOptionRouter.get('/', createHandler(ToppingController, 'getCallOptionAll'))

export { toppingRouter, callOptionRouter }
