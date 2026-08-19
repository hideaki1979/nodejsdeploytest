import { Router } from "express";
import { StoreController } from "../controllers/storeController";
import { createHandler } from "../utils/routeHandler";
import { validate } from "../middlewares/zodValidation";
import { authenticateUser } from "../middlewares/authMiddleware";
import { registry } from "../openapi/registry";
import { responseRef, successEnvelope } from "../schemas/common.schema";
import {
    mapSchema,
    storeCloseInputSchema,
    storeCloseResultSchema,
    storeDetailSchema,
    storeIdParamSchema,
    storeInputSchema,
    storeListItemSchema,
    storeToppingCallsQuerySchema,
    storeToppingCallsResultSchema,
    storeWriteResponseDataSchema,
} from "../schemas/store.schema";
import { z } from "../openapi/zod";

const storeRouter = Router()

registry.registerPath({
    method: 'post',
    path: '/stores',
    tags: ['Stores'],
    summary: '新規店舗登録',
    description: '新しい店舗情報を登録します。住所から緯度経度を自動計算して保存します。認証が必要です。',
    security: [{ bearerAuth: [] }],
    request: {
        body: { required: true, content: { 'application/json': { schema: storeInputSchema } } },
    },
    responses: {
        201: {
            description: '店舗が正常に作成されました。',
            content: {
                'application/json': {
                    schema: successEnvelope('店舗情報が正常に登録されました。', storeWriteResponseDataSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        500: responseRef('InternalServerError'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
storeRouter.post('/', authenticateUser, validate({ body: storeInputSchema }), createHandler(StoreController, "createStore"))

registry.registerPath({
    method: 'get',
    path: '/stores/{id}',
    tags: ['Stores'],
    summary: '店舗情報取得',
    description: '指定されたIDの店舗情報を取得します。認証は不要です。',
    security: [],
    request: { params: storeIdParamSchema },
    responses: {
        200: {
            description: '正常に店舗情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('店舗情報を正常に取得できました。', storeDetailSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        404: responseRef('StoreNotFound'),
    },
})
storeRouter.get('/:id', validate({ params: storeIdParamSchema }), createHandler(StoreController, 'getStoreById'))

registry.registerPath({
    method: 'get',
    path: '/stores',
    tags: ['Stores'],
    summary: '全店舗情報取得',
    description: [
        'データベースに登録されている全ての店舗情報を取得します。\n',
        '店舗選択リスト用のエンドポイントのため、返却されるのは\n',
        'id / store_name / branch_name の3項目のみです。認証は不要です。',
    ].join(''),
    security: [],
    responses: {
        200: {
            description: '正常に全店舗情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('全店舗情報を正常に取得できました。', z.array(storeListItemSchema)),
                },
            },
        },
    },
})
storeRouter.get('/', createHandler(StoreController, 'getStoresAll'))

registry.registerPath({
    method: 'put',
    path: '/stores/{id}',
    tags: ['Stores'],
    summary: '店舗情報更新',
    description: '指定されたIDの店舗情報を更新します。認証が必要です。',
    security: [{ bearerAuth: [] }],
    request: {
        params: storeIdParamSchema,
        body: { required: true, content: { 'application/json': { schema: storeInputSchema } } },
    },
    responses: {
        200: {
            description: '正常に店舗情報を更新しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('店舗情報が正常に更新されました', storeWriteResponseDataSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        404: responseRef('StoreNotFound'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
storeRouter.put('/:id', authenticateUser, validate({ params: storeIdParamSchema, body: storeInputSchema }), createHandler(StoreController, 'updateStore'))

registry.registerPath({
    method: 'patch',
    path: '/stores/{id}/close',
    tags: ['Stores'],
    summary: '店舗を閉店済みにする',
    description: '指定された店舗の営業状態を「閉店」に変更します。認証が必要です。',
    security: [{ bearerAuth: [] }],
    request: {
        params: storeIdParamSchema,
        body: { required: true, content: { 'application/json': { schema: storeCloseInputSchema } } },
    },
    responses: {
        200: {
            description: '正常に店舗を閉店済みにしました。',
            content: {
                'application/json': {
                    schema: successEnvelope('閉店処理が正常に終了しました', storeCloseResultSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        404: responseRef('StoreNotFound'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
storeRouter.patch('/:id/close', authenticateUser, validate({ params: storeIdParamSchema, body: storeCloseInputSchema }), createHandler(StoreController, 'storeClose'))

registry.registerPath({
    method: 'get',
    path: '/stores/{id}/toppingcalls',
    tags: ['Stores'],
    summary: '店舗のトッピングコール情報取得',
    description: [
        '指定された店舗のトッピングコール情報を、トッピング単位でグループ化して取得します。\n',
        'クエリパラメータを指定すると、対象の店舗別トッピングコールを絞り込めます。認証は不要です。',
    ].join(''),
    security: [],
    // パスパラメータもクエリも同じスキーマで validate が検証する。
    // 絞り込み条件を満たさない値は 400 に倒す（移行前は黙って無視していた）。
    request: { params: storeIdParamSchema, query: storeToppingCallsQuerySchema },
    responses: {
        200: {
            description: '正常にトッピングコール情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope(
                        'コールタイミングに該当するコールトッピング情報を正常に取得できました。',
                        storeToppingCallsResultSchema,
                    ),
                },
            },
        },
        // 400 は validate の1経路のみ（パスパラメータ・クエリとも details つきで返す）
        400: responseRef('ValidationError'),
        404: responseRef('StoreNotFound'),
    },
})
storeRouter.get('/:id/toppingcalls', validate({ params: storeIdParamSchema, query: storeToppingCallsQuerySchema }), createHandler(StoreController, 'getStoreToppingCalls'))

registry.registerPath({
    method: 'get',
    path: '/maps',
    tags: ['Map'],
    summary: '全店舗のマップ情報取得',
    description: '全ての店舗の位置情報（緯度経度）を取得します。認証は不要です。',
    security: [],
    responses: {
        200: {
            description: '正常にマップ情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('店舗情報を正常に取得できました。', z.array(mapSchema)),
                },
            },
        },
    },
})
const mapRouter = Router()
mapRouter.get('/', createHandler(StoreController, 'getMapAll'))

export { storeRouter, mapRouter }
