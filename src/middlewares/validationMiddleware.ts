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
        // ログは原因調査のため全件残す（onlyFirstError を付けない）
        logger.error({ errors: errors.array(), path: req.originalUrl }, 'バリデーションエラーが発生しました。')
        res.status(400).json({
            success: false,
            error: 'バリデーションエラー発生：入力値に誤りがあります。',
            // レスポンスはフィールドごとに先頭1件へ絞る。
            // 必須テキスト項目は notEmpty → isString → trim → notEmpty の順で検証しており
            // （検証順序の意図は validation.ts 冒頭コメントを参照）、bail() を挟んでいないため
            // 1フィールドに同一メッセージが複数返る（例: "" に対し「必須です」が2件）。
            // 合否は変わらず details の件数だけが減るため、既存クライアントへの影響はない。
            details: errors.array({ onlyFirstError: true })
        })
        return
    }
    next()
}