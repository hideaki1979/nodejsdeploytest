import { NextFunction, Request, Response, Router } from "express";
import { UserController } from "../controllers/userController";
import { container } from "tsyringe";
import { authenticateUser } from "../middlewares/authMiddleware";
import { userValidationRules } from "../middlewares/userValidation";

const userRouter = Router()

/**
 * ユーザー作成エンドポイント
 * 新しいユーザーを作成する
 * @param {object} req.body - ユーザー情報
 * @returns {object} 作成されたユーザー情報とステータス情報
 */
userRouter.post(`/`, authenticateUser, userValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(UserController).createUser(req, res).catch(next)
)
/**
 * ユーザー情報取得エンドポイント
 * 指定されたUIDのユーザー情報を取得する
 * @param {string} req.params.uid - 取得対象のユーザーUID
 * @returns {object} ユーザー情報とステータス情報
 */
userRouter.get('/:uid', authenticateUser, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(UserController).getUserByUid(req, res).catch(next)
)
export { userRouter }
