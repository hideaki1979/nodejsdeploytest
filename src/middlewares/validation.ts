import { body, param } from 'express-validator';

/**
 * 店舗情報のバリデーションルール
 * リクエストの内容を検証し、適切なエラーメッセージを設定
 */

// 必須テキスト項目は「型 → 前後の空白除去 → 空判定 → 文字数」の順で検証する。
// trim() は値を文字列へ強制変換するサニタイザのため、必ず isString() の後に置くこと
// （先頭に置くと数値・オブジェクトが文字列化されて型チェックをすり抜ける）。
export const storeValidationRules = [
    body('store_name')
        .notEmpty().withMessage('店舗名は必須です')
        .isString().withMessage('店舗名は文字列で指定してください')
        .trim()
        .notEmpty().withMessage('店舗名は必須です')
        .isLength({ max: 255 }).withMessage('店舗名は255文字以内で入力してください'),

    // 任意項目は optional({ values: 'null' }) で未指定・null を素通しする。
    // 空文字は「入力なし」としてそのまま許容するため notEmpty() は付けない
    body('branch_name')
        .optional({ values: 'null' })
        .isString().withMessage('支店名は文字列で指定してください')
        .trim()
        .isLength({ max: 255 }).withMessage('支店名は255文字以内で入力してください'),

    body('address')
        .notEmpty().withMessage('住所は必須です')
        .isString().withMessage('住所は文字列で指定してください')
        .trim()
        .notEmpty().withMessage('住所は必須です')
        .isLength({ max: 255 }).withMessage('住所は255文字以内で入力してください'),

    body('business_hours')
        .notEmpty().withMessage('営業時間は必須です')
        .isString().withMessage('営業時間は文字列で指定してください')
        .trim()
        .notEmpty().withMessage('営業時間は必須です')
        .isLength({ max: 255 }).withMessage('営業時間は255文字以内で入力してください'),

    body('regular_holidays')
        .notEmpty().withMessage('定休日は必須です')
        .isString().withMessage('定休日は文字列で指定してください')
        .trim()
        .notEmpty().withMessage('定休日は必須です')
        .isLength({ max: 255 }).withMessage('定休日は255文字以内で入力してください'),

    body('prior_meal_voucher')
        .isBoolean().withMessage('事前食券購入の有無は真偽値で指定してください'),

    // topping_details / call_details / lot_detail は DB 側が Text 型で上限を持たないため、
    // 自由記述欄として妥当な 1000 文字をアプリ側の上限とする
    body('topping_details')
        .optional({ values: 'null' })
        .isString().withMessage('トッピング詳細は文字列で指定してください')
        .trim()
        .isLength({ max: 1000 }).withMessage('トッピング詳細は1000文字以内で入力してください'),

    body('call_details')
        .optional({ values: 'null' })
        .isString().withMessage('コール詳細は文字列で指定してください')
        .trim()
        .isLength({ max: 1000 }).withMessage('コール詳細は1000文字以内で入力してください'),

    body('is_all_increased')
        .isBoolean().withMessage('全マシの有無は真偽値で指定してください'),

    body('is_lot')
        .isBoolean().withMessage('ロット制の有無は真偽値で指定してください'),

    body('lot_detail')
        .optional({ values: 'null' })
        .isString().withMessage('ロット制詳細は文字列で指定してください')
        .trim()
        .isLength({ max: 1000 }).withMessage('ロット制詳細は1000文字以内で入力してください'),

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
 * 店舗ID（パスパラメータ）のバリデーションルール
 * 検証が無いと Number('abc') → NaN のまま Prisma に渡り、
 * 「ユーザーの入力ミス」が 500（予期せぬエラー）として返ってしまうため、
 * ルート層で 400 に倒す
 */
export const storeIdParamValidationRules = [
    param('id')
        .notEmpty().withMessage('店舗IDは必須です')
        .isInt().withMessage('店舗IDは整数で指定してください')
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

    // 検証順序の意図は storeValidationRules の冒頭コメントを参照。
    // ここは値が「【閉店】${storeName}」に埋め込まれるため、
    // 型チェックが漏れると {} が「【閉店】[object Object]」として登録される
    body('storeName')
        .notEmpty().withMessage('店舗名は必須です')
        .isString().withMessage('店舗名は文字列で指定してください')
        .trim()
        .notEmpty().withMessage('店舗名は必須です')
        .isLength({ max: 255 }).withMessage('店舗名は255文字以内で入力してください')
]