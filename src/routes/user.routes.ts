import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateUser } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/zodValidation";
import { createHandler } from "../utils/routeHandler";
import { registry } from "../openapi/registry";
import { responseRef, successEnvelope } from "../schemas/common.schema";
import { userInputSchema, userSchema, userUidParamSchema } from "../schemas/user.schema";

const userRouter = Router()

registry.registerPath({
    method: 'post',
    path: '/users',
    tags: ['Users'],
    summary: '新規ユーザーの作成',
    security: [{ bearerAuth: [] }],
    request: {
        body: { required: true, content: { 'application/json': { schema: userInputSchema } } },
    },
    responses: {
        201: {
            description: 'ユーザーが正常に作成されました',
            content: {
                'application/json': {
                    schema: successEnvelope('ユーザー情報が正常に登録されました', userSchema),
                },
            },
        },
        400: responseRef('ValidationError'),
        401: responseRef('Unauthorized'),
        500: responseRef('InternalServerError'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
userRouter.post(`/`, authenticateUser, validate({ body: userInputSchema }), createHandler(UserController, 'createUser'))

registry.registerPath({
    method: 'get',
    path: '/users/{uid}',
    tags: ['Users'],
    summary: 'ユーザー情報の取得',
    description:
        '指定されたUIDのユーザー情報を取得します。本人、または管理者ロールを持つユーザーのみ参照できます。',
    security: [{ bearerAuth: [] }],
    request: { params: userUidParamSchema },
    responses: {
        200: {
            description: 'ユーザー情報',
            content: {
                'application/json': {
                    schema: successEnvelope('ユーザー情報が正常に取得されました', userSchema),
                },
            },
        },
        401: responseRef('Unauthorized'),
        403: responseRef('Forbidden'),
        404: responseRef('UserNotFound'),
        500: responseRef('InternalServerError'),
        503: responseRef('AuthServiceUnavailable'),
    },
})
userRouter.get('/:uid', authenticateUser, createHandler(UserController, 'getUserByUid'))

export { userRouter }
