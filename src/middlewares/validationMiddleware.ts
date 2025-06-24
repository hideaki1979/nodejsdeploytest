import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

/**
 * express-validatorによるバリデーション結果をチェックするミドルウェア
 * バリデーションエラーがある場合、400エラーレスポンスを返し、処理を中断する。
 * エラーがない場合、次のミドルウェアまたはルートハンドラに処理を渡す。
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 * @param next - 次のミドルウェア関数
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: '入力値に誤りがあります。',
            details: errors.array()
        })
    }
    next()
}