import { NextFunction, Request, Response } from "express";
import admin from "../config/firebase"

// リクエストにユーザー情報を追加するための拡張
declare module 'express' {
    interface Request {
        user?: admin.auth.DecodedIdToken;
    }
}

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'Unauthorized',
                message: '認証トークンがありません'
            })
            return
        }

        // 'Bearer 'の後の部分（トークン）を取得
        const idToken = authHeader.split('Bearer ')[1]

        // Firebase Admin SDKでトークンを検証
        const decodedToken = await admin.auth().verifyIdToken(idToken)

        // 検証済みユーザー情報をリクエストオブジェクトに追加
        req.user = decodedToken

        // 次のミドルウェアやルートハンドラーに処理を渡す
        next();
    } catch (error) {
        console.error('認証エラー：', error)

        // エラーの種類に応じたレスポンスを返す
        if (typeof error === 'object' && error !== null && 'code' in error) {
            if (error.code === 'auth/id-token-expired') {
                res.status(401).json({
                    status: 'TokenExpired',
                    message: '認証トークンの有効期限が切れています。再ログインしてください'
                })
                return
            }
        }

        // 既にレスポンスを返しているためnext(error)は呼ばない
        // （呼ぶとエラーハンドラが二重にレスポンスを送信し ERR_HTTP_HEADERS_SENT が発生する）
        res.status(401).json({
            status: 'InvalidToken',
            message: `無効な認証トークンです`
        })
    }
}