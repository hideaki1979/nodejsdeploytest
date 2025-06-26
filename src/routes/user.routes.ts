import { NextFunction, Request, Response, Router } from "express";
import { UserController } from "../controllers/userController";
import { container } from "tsyringe";
import { authenticateUser } from "../middlewares/authMiddleware";
import { userValidationRules } from "../middlewares/userValidation";

const userRouter = Router()

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: ユーザー情報の登録・取得
 */

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
 *               $ref: '#/components/schemas/User'
 *       '400':
 *         description: 不正な入力です
 *       '401':
 *         description: 認証エラー
 *       '500':
 *         description: サーバーエラー
 */
userRouter.post(`/`, authenticateUser, userValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(UserController).createUser(req, res).catch(next)
)

/**
 * @swagger
 * /users/{uid}:
 *   get:
 *     summary: ユーザー情報の取得
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
 *               $ref: '#/components/schemas/User'
 *       '401':
 *         description: 認証エラー
 *       '404':
 *         description: ユーザーが見つかりません
 *       '500':
 *         description: サーバーエラー
 */
userRouter.get('/:uid', authenticateUser, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(UserController).getUserByUid(req, res).catch(next)
)
export { userRouter }
