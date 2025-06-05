import { Request, Response } from "express";
import { UserService } from "../services/userServices";

export class UserController {
    private userService: UserService

    constructor() {
        this.userService = new UserService()
    }

    async createUser(req: Request, res: Response) {
        try {
            // console.log('ユーザー情報：', JSON.stringify(req.body, null, 2))
            // Firebaseのuidの検証
            const firebaseUid = req.body.uid
            if (!firebaseUid) {
                res.status(401).json({
                    status: 'error',
                    message: '認証トークンIDが設定されてません'
                })
                return
            }
            const result = await this.userService.createUser(req.body)
            res.status(201).json({
                status: 'success',
                message: 'ユーザー情報が正常に登録されました',
                data: result
            })
        } catch (error) {
            console.error('ユーザー登録エラー：', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'ユーザー情報の登録中に予期せぬエラーが発生しました'
            })
        }
    }

    async getUserByUid(req: Request, res: Response) {
        // Firebaseのuidの検証
        const uid = req.params.uid
        console.log(uid)
        if (!uid) {
            res.status(401).json({
                status: 'error',
                message: '認証トークンIDが設定されてません'
            })
            return
        }

        const result = await this.userService.getIdToken(uid)
        res.status(200).json({
            status: 'success',
            message: 'ユーザー情報が正常に取得されました',
            data: result
        })
    }
}