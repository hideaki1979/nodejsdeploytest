import { body, param } from "express-validator"

/**
 * 画像関連の共通バリデーションルール
 * アップロードと更新で共通して使用する基本的な検証項目
 */
const commonImageValidationRules = [
    body('store_id')
        .notEmpty().withMessage('店舗IDは必須です')
        .isInt().withMessage('店舗IDは整数で指定してください'),

    // user_idはリクエストボディからは受け取らない（なりすまし防止）
    // 投稿者IDは検証済みトークンのUIDをサーバー側で設定する

    body('menu_type')
        .notEmpty().withMessage('メニュータイプは必須です')
        .isInt().withMessage('メニュータイプは整数で指定してください'),

    body('menu_name')
        .notEmpty().withMessage('メニュー名は必須です')
        .isString().withMessage('メニュー名は文字列で指定してください'),

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
        .isInt().withMessage('コールオプションIDは整数で指定してください'),

    // 検証が無いと BigInt(undefined) が TypeError となり、入力ミスが 500 として返る。
    // さらに Storage へのアップロードはこの変換より前に完了しているため、
    // アップロード → 補償処理による削除、という無駄な往復まで発生する。
    // 他の2項目と同様にここで 400 に倒す
    body('topping_selections.*.store_topping_call_id')
        .if(body('topping_selections').exists())
        .notEmpty().withMessage('店舗別トッピングコールIDは必須です')
        .isInt().withMessage('店舗別トッピングコールIDは整数で指定してください')

]


/**
 * 画像アップロードのバリデーションルール
 * リクエストの内容を検証し、適切なエラーメッセージを設定
 */
export const imageUploadValidationRules = [
    ...commonImageValidationRules,
    body('image_base64')
        .notEmpty().withMessage('画像データは必須です')
        .custom((value) => {
            // Base64形式のチェック
            const base64Regex = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/=])+$/;
            if (!base64Regex.test(value)) {
                throw new Error('無効な画像形式です。Base64エンコードされたJPEG、PNG、GIF、WEBPのみ対応しています');
            }
            return true;
        })
]

/**
 * 画像更新のバリデーションルール
 * 更新時は画像データはオプショナル（画像を変更しない場合もあるため）
 */
export const imageUpdateValidationRules = [
    ...commonImageValidationRules,
    body('image_base64')
        .optional()
        .custom((value) => {
            // Base64形式のチェック
            const base64Regex = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/=])+$/;
            if (!base64Regex.test(value)) {
                throw new Error('無効な画像形式です。Base64エンコードされたJPEG、PNG、GIF、WEBPのみ対応しています');
            }
            return true;
        })
]


/**
 * 画像情報取得用のバリデーションルール
 * リクエストの内容を検証し、適切なエラーメッセージを設定
 */
export const imageGetValidationRules = [
    param('storeId')
        .notEmpty().withMessage('店舗IDは必須です')
        .isInt().withMessage('店舗IDは整数で指定してください'),
    param('imageId')
        .notEmpty().withMessage('画像IDは必須です')
        .isInt().withMessage('画像IDは整数で指定してください')
]

/**
 * 画像リスト取得用のバリデーションルール
 * リクエストの内容を検証し、適切なエラーメッセージを設定
 */
export const imageListGetValidationRules = [
    param('storeId')
        .notEmpty().withMessage('店舗IDは必須です')
        .isInt().withMessage('店舗IDは整数で指定してください')
]