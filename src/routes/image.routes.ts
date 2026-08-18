import { Router } from "express"
import { ImageController } from "../controllers/imageController"
import { authenticateUser } from "../middlewares/authMiddleware"
import { validate } from "../middlewares/zodValidation"
import { createHandler } from "../utils/routeHandler"
import { registry } from "../openapi/registry"
import { z } from "../openapi/zod"
import { responseRef, successEnvelope } from "../schemas/common.schema"
import {
    imageDeleteResultSchema,
    imageEditDetailSchema,
    imageListItemSchema,
    imageListParamSchema,
    imageParamSchema,
    imageUpdateInputSchema,
    imageUpdateResultSchema,
    imageUploadInputSchema,
    imageWriteResultSchema,
} from "../schemas/image.schema"

const imageRouter = Router({ mergeParams: true })

registry.registerPath({
    method: 'post',
    path: '/stores/{storeId}/images',
    tags: ['Images'],
    summary: '店舗画像のアップロード',
    description: '指定された店舗に新しい画像をアップロードします。認証が必要です。',
    security: [{ bearerAuth: [] }],
    request: {
        params: imageListParamSchema,
        body: { required: true, content: { 'application/json': { schema: imageUploadInputSchema } } },
    },
    responses: {
        201: {
            description: '画像が正常にアップロードされました。',
            content: {
                'application/json': {
                    schema: successEnvelope('画像が正常にアップロードしました！', imageWriteResultSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        404: responseRef('StoreNotFound'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
imageRouter.post('/', authenticateUser, validate({ params: imageListParamSchema, body: imageUploadInputSchema }), createHandler(ImageController, 'uploadStoreImage'))

registry.registerPath({
    method: 'get',
    path: '/stores/{storeId}/images',
    tags: ['Images'],
    summary: '店舗画像一覧取得',
    description: '指定された店舗の全ての画像を取得します。認証は不要です。',
    security: [],
    request: { params: imageListParamSchema },
    responses: {
        200: {
            description: '正常に画像一覧を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope(
                        '店舗別画像情報を正常に取得できました。',
                        z.array(imageListItemSchema),
                    ),
                },
            },
        },
        400: responseRef('ValidationError'),
        404: responseRef('StoreNotFound'),
    },
})
imageRouter.get(`/`, validate({ params: imageListParamSchema }), createHandler(ImageController, 'getStoreImages'))

registry.registerPath({
    method: 'get',
    path: '/stores/{storeId}/images/{imageId}',
    tags: ['Images'],
    summary: '店舗画像の個別取得',
    description: '指定された店舗IDと画像IDに一致する画像情報を1件取得します。認証は不要です。',
    security: [],
    request: { params: imageParamSchema },
    responses: {
        200: {
            description: '正常に画像情報を取得しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('画像情報を正常取得しました', imageEditDetailSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        404: responseRef('ImageNotFound'),
    },
})
imageRouter.get(`/:imageId`, validate({ params: imageParamSchema }), createHandler(ImageController, 'getImageByImageId'))

registry.registerPath({
    method: 'put',
    path: '/stores/{storeId}/images/{imageId}',
    tags: ['Images'],
    summary: '画像情報の更新',
    description: '指定された画像情報を更新します。認証が必要です。',
    security: [{ bearerAuth: [] }],
    request: {
        params: imageParamSchema,
        body: { required: true, content: { 'application/json': { schema: imageUpdateInputSchema } } },
    },
    responses: {
        200: {
            description: '正常に画像情報を更新しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('画像情報が正常に更新されました', imageUpdateResultSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        403: responseRef('Forbidden'),
        404: responseRef('ImageNotFound'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
imageRouter.put(`/:imageId`, authenticateUser, validate({ params: imageParamSchema, body: imageUpdateInputSchema }), createHandler(ImageController, 'updateStoreImage'))

registry.registerPath({
    method: 'delete',
    path: '/stores/{storeId}/images/{imageId}',
    tags: ['Images'],
    summary: '店舗画像の削除',
    description: '指定された画像を削除します。認証が必要です。',
    security: [{ bearerAuth: [] }],
    request: { params: imageParamSchema },
    responses: {
        200: {
            description: '正常に画像を削除しました。',
            content: {
                'application/json': {
                    schema: successEnvelope('画像が正常に削除されました', imageDeleteResultSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        403: responseRef('Forbidden'),
        404: responseRef('ImageNotFound'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
imageRouter.delete(`/:imageId`, authenticateUser, validate({ params: imageParamSchema }), createHandler(ImageController, 'deleteStoreImage'))

export { imageRouter }
