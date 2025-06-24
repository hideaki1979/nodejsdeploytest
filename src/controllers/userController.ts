import { Request, Response } from "express";
import { UserService } from "../services/userServices";
import { validationResult } from "express-validator";
import { injectable } from "tsyringe";
import { AppError } from "../middlewares/errorMiddleware";

@injectable()
export class UserController {

    constructor(private userService: UserService) { }

    async createUser(req: Request, res: Response) {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            // バリデーションエラーはAppErrorを使用して一貫した形式で返す
            throw new AppError('バリデーションエラー', 400)
        }
        const result = await this.userService.createUser(req.body)
        res.status(201).json({
            success: true,
            message: 'ユーザー情報が正常に登録されました',
            data: result
        })
    }

    async getUserByUid(req: Request, res: Response) {
        // Firebaseのuidの検証
        const uid = req.params.uid
        if (!uid) {
            throw new AppError('認証トークンIDが設定されてません', 401)
        }

        const result = await this.userService.getIdToken(uid)
        if (!result) {
            throw new AppError('該当するユーザーが存在しません。', 404)
        }

        res.status(200).json({
            success: true,
            message: 'ユーザー情報が正常に取得されました',
            data: result
        })
    }
}