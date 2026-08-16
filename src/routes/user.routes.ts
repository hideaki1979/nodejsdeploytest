import { Router } from "express";
import { UserController } from "../controllers/userController";
import { authenticateUser } from "../middlewares/authMiddleware";
import { userValidationRules } from "../middlewares/userValidation";
import { handleValidationErrors } from "../middlewares/validationMiddleware";
import { createHandler } from "../utils/routeHandler";

const userRouter = Router()

/**
 * @swagger
 * /users:
 *   post:
 *     summary: 新規ユーザーの作成
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       '201':
 *         description: ユーザーが正常に作成されました
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: ユーザー情報が正常に登録されました
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *       '503':
 *         $ref: '#/components/responses/AuthServiceUnavailable'
 */
userRouter.post(`/`, authenticateUser, userValidationRules, handleValidationErrors, createHandler(UserController, 'createUser')
)

/**
 * @swagger
 * /users/{uid}:
 *   get:
 *     summary: ユーザー情報の取得
 *     description: 指定されたUIDのユーザー情報を取得します。本人、または管理者ロールを持つユーザーのみ参照できます。
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         required: true
 *         description: ユーザーID
 *     responses:
 *       '200':
 *         description: ユーザー情報
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: ユーザー情報が正常に取得されました
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         description: 他ユーザーの情報を参照する権限がありません
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         $ref: '#/components/responses/UserNotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *       '503':
 *         $ref: '#/components/responses/AuthServiceUnavailable'
 */
userRouter.get('/:uid', authenticateUser, createHandler(UserController, 'getUserByUid'))
export { userRouter }
