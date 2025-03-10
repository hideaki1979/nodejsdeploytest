import { body } from 'express-validator';

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

    // トッピング関連の配列のバリデーション
    body('topping_garlic')
        .isArray().withMessage('にんにくトッピングは配列で指定してください'),

    body('topping_oil')
        .isArray().withMessage('アブラトッピングは配列で指定してください'),

    body('topping_soy_sauce')
        .isArray().withMessage('醤油トッピングは配列で指定してください'),

    body('topping_vegetable')
        .isArray().withMessage('野菜トッピングは配列で指定してください'),

    body('noodle_fitness')
        .isArray().withMessage('麺の硬さは配列で指定してください')
]