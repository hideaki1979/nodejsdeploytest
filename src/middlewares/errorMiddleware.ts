import { Request, Response, NextFunction } from "express";

// 仮のカスタムエラークラス（後で拡張する可能性あり）
export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        Object.setPrototypeOf(this, AppError.prototype)
    }
}

/**
 * Expressアプリケーション全体のエラーを処理するミドルウェア
 * @param err - 発生したエラーオブジェクト
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 * @param next - 次のミドルウェア関数
 */
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    // デフォルトのエラー情報を設定
    let statusCode = 500
    let message = 'サーバー内部で予期せぬエラーが発生しました。'

    // カスタムエラー（AppError）の場合、その情報をレスポンスに使用
    if (err instanceof AppError) {
        statusCode = err.statusCode
        message = err.message
    } else {
        // 予期せぬエラーの詳細をサーバーコンソールに出力
        console.error('UNHANDLED ERROR:', err)
    }

    res.status(statusCode).json({
        success: false,
        error: message
    })
    next()
}