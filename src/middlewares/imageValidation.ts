import { body } from "express-validator"

/**
 * 画像アップロードのバリデーションルール
 * リクエストの内容を検証し、適切なエラーメッセージを設定
 */
export const imageValidationRules = [
    body('store_id')
        .notEmpty().withMessage('店舗IDは必須です')
        .isInt().withMessage('店舗IDは整数で指定してください'),

    body('menu_type')
        .notEmpty().withMessage('メニュータイプは必須です')
        .isInt().withMessage('メニュータイプは整数で指定してください'),

    body('menu_name')
        .notEmpty().withMessage('メニュー名は必須です')
        .isString().withMessage('メニュー名は文字列で指定してください'),

    body('image_base64')
        .notEmpty().withMessage('画像データは必須です')
        .custom((value) => {
            // Base64形式のチェック
            const base64Regex = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/=])+$/;
            if (!base64Regex.test(value)) {
                throw new Error('無効な画像形式です。Base64エンコードされたJPEG、PNG、GIF、WEBPのみ対応しています');
            }
            return true;
        }),
    body('topping_selections')
        .optional()
        .isArray().withMessage('トッピング選択は配列形式で指定してください'),

    body('topping_selections.*.topping_id')
        .if(body('topping_selections').exists())
        .notEmpty().withMessage('トッピングIDは必須です')
        .isInt().withMessage('トッピングIDは整数で指定してください'),

    body('topping_selections.*.call_option_id')
        .if(body('topping_selections').exists())
        .notEmpty().withMessage('コールオプションIDは必須です')
        .isInt().withMessage('コールオプションIDは整数で指定してください')
]