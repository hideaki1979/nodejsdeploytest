import { Request, Response } from "express";
import { UserService } from "../services/userServices";
import { AppError } from "../middlewares/errorMiddleware";
import { autoInjectable, inject } from "tsyringe";
import { pinoLogger } from "../di.token";
import { Logger } from "pino";

@autoInjectable()
export class UserController {

    constructor(
        private userService: UserService,
        @inject(pinoLogger) private logger: Logger
    ) { }

    async createUser(req: Request, res: Response) {
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
            this.logger?.error({
                error: new Error('認証トークンID未設定エラー'),
                endpoint: req.originalUrl
            }, '認証トークンIDが設定されてません')
            throw new AppError('認証トークンIDが設定されてません', 401)
        }

        const result = await this.userService.getIdToken(uid)
        if (!result) {
            this.logger?.error({
                error: new Error('ユーザー未存在エラー'),
                uid: uid
            }, '該当するユーザーが存在しません')
            throw new AppError('該当するユーザーが存在しません', 404)
        }

        res.status(200).json({
            success: true,
            message: 'ユーザー情報が正常に取得されました',
            data: result
        })
    }
}