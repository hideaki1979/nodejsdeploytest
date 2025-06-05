import { body } from "express-validator";

export const userValidationRules = [
    body('uid')
        .notEmpty().withMessage('Firebase UIDは必須です')
        .isLength({ min: 28, max: 28 }).withMessage('Firebase UIDは28文字である必要があります')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Firebase UIDは英数字のみが許可されています')
        .trim(), // サニタイズ: 前後の空白削除
    body('displayName')
        .optional()
        .isLength({ max: 50 }).withMessage('表示名は50文字以内で入力してください')
        .trim() // サニタイズ: 前後の空白削除
        .escape(), // サニタイズ: HTMLエスケープ

    body('email')
        .optional()
        .isEmail().withMessage('有効なメールアドレスを入力してください')
        .normalizeEmail(), // サニタイズ: メール正規化

    body('authProvider')
        .optional()
        .isIn(['google', 'facebook', 'twitter', 'apple', 'email']).withMessage('サポートされていない認証プロバイダーです')
        .trim(), // サニタイズ: 前後の空白削除

    body('bio')
        .optional()
        .isLength({ max: 500 }).withMessage('プロフィールは500文字以内で入力してください')
        .trim() // サニタイズ: 前後の空白削除
        .escape() // サニタイズ: HTMLエスケープ
]