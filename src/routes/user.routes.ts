import { Router } from "express";
import { UserController } from "../controllers/userController";
import { container } from "tsyringe";
import { authenticateUser } from "../middlewares/authMiddleware";
import { userValidationRules } from "../middlewares/userValidation";

const userRouter = Router()
const userController = container.resolve(UserController)

/**
 * ユーザー作成エンドポイント
 * 新しいユーザーを作成する
 * @param {object} req.body - ユーザー情報
 * @returns {object} 作成されたユーザー情報とステータス情報
 */
userRouter.post(`/users`, authenticateUser, userValidationRules, userController.createUser.bind(userController))

/**
 * ユーザー情報取得エンドポイント
 * 指定されたUIDのユーザー情報を取得する
 * @param {string} req.params.uid - 取得対象のユーザーUID
 * @returns {object} ユーザー情報とステータス情報
 */
userRouter.get('/users/:uid', authenticateUser, userController.getUserByUid.bind(userController))

export { userRouter }
