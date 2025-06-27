import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { Logger } from "pino";
import { container } from "tsyringe";
import { pinoLogger } from "../di.token";

/**
 * express-validatorによるバリデーション結果をチェックするミドルウェア
 * バリデーションエラーがある場合、400エラーレスポンスを返し、処理を中断する。
 * エラーがない場合、次のミドルウェアまたはルートハンドラに処理を渡す。
 * @param req - Expressリクエストオブジェクト
 * @param res - Expressレスポンスオブジェクト
 * @param next - 次のミドルウェア関数
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const logger = container.resolve<Logger>(pinoLogger)
        logger.error({ errors: errors.array(), path: req.originalUrl }, 'バリデーションエラーが発生しました。')
        res.status(400).json({
            success: false,
            error: 'バリデーションエラー発生：入力値に誤りがあります。',
            details: errors.array()
        })
        return
    }
    next()
}