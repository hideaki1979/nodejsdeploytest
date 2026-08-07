import { body, param } from 'express-validator';

/**
 * 店舗情報のバリデーションルール
 * リクエストの内容を検証し、適切なエラーメッセージを設定
 */

export const storeValidationRules = [
    body('store_name')
        .notEmpty().withMessage('店舗名は必須です')
        .isLength({ max: 255 }).withMessage('店舗名は255文字以内で入力してください'),

    body('address')
        .notEmpty().withMessage('住所は必須です')
        .isLength({ max: 255 }).withMessage('住所は255文字以内で入力してください'),

    body('business_hours')
        .notEmpty().withMessage('営業時間は必須です')
        .isLength({ max: 255 }).withMessage('営業時間は255文字以内で入力してください'),

    body('regular_holidays')
        .notEmpty().withMessage('定休日は必須です')
        .isLength({ max: 255 }).withMessage('定休日は255文字以内で入力してください'),

    body('prior_meal_voucher')
        .isBoolean().withMessage('事前食券購入の有無は真偽値で指定してください'),

    body('is_all_increased')
        .isBoolean().withMessage('全マシの有無は真偽値で指定してください'),

    body('is_lot')
        .isBoolean().withMessage('ロット制の有無は真偽値で指定してください'),

    body('topping_calls')
        .optional()
        .isArray().withMessage('トッピングコールは配列形式で指定してください'),

    body('topping_calls.*.topping_id')
        .if(body('topping_calls').exists())
        .isInt().withMessage('トッピングIDは整数で指定してください'),

    body('topping_calls.*.call_option_id')
        .if(body('topping_calls').exists())
        .isInt().withMessage('コールオプションIDは整数で指定してください'),

    body('topping_calls.*.call_timing')
        .if(body('topping_calls').exists())
        .isIn(['pre_call', 'post_call']).withMessage('コールタイミングは pre_call または post_call で指定してください'),

    body('topping_calls.*.noodle_type_id')
        .if(body('topping_calls').exists())
        .isInt().withMessage('麺タイプIDは整数で指定してください')
]

/**
 * 店舗閉店処理のバリデーションルール
 * store_nameはテンプレートリテラルで店舗名に直接埋め込まれるため、
 * 型・長さのチェックを必須とする
 */
export const storeCloseValidationRules = [
    param('id')
        .notEmpty().withMessage('店舗IDは必須です')
        .isInt().withMessage('店舗IDは整数で指定してください'),

    body('storeName')
        .notEmpty().withMessage('店舗名は必須です')
        .isString().withMessage('店舗名は文字列で指定してください')
        .isLength({ max: 255 }).withMessage('店舗名は255文字以内で入力してください')
]