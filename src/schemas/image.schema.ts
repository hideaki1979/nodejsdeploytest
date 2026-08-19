/**
 * 店舗画像のスキーマ定義。
 *
 * リクエスト側は移行前の imageValidation.ts と同じ検証になるよう組み立てる。
 * 投稿者ID（user_id）はなりすまし防止のためリクエストからは受け取らない。
 */
import { registry } from '../openapi/registry'
import { z } from '../openapi/zod'
import { registerNotFoundResponse } from './common.schema'
import { requiredInteger, requiredPlainText, optionalArray, toValidatorString } from './primitives'

/** data URL 形式のBase64画像データ（移行前の imageValidation.ts の custom と同じ正規表現） */
const IMAGE_DATA_URL_PATTERN = /^data:image\/(jpeg|png|gif|webp);base64,([A-Za-z0-9+/=])+$/

const INVALID_IMAGE_MESSAGE =
    '無効な画像形式です。Base64エンコードされたJPEG、PNG、GIF、WEBPのみ対応しています'

const IMAGE_BASE64_EXAMPLE =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='

// =============================================================================
// リクエスト
// =============================================================================

export const imageToppingSelectionSchema = registry.register(
    'ImageToppingSelection',
    z
        .object({
            topping_id: requiredInteger('トッピングID', { description: 'トッピングID' }),
            call_option_id: requiredInteger('コールオプションID', {
                description: 'コールオプションID',
            }),
            // 検証が無いと BigInt(undefined) が TypeError となり、入力ミスが 500 として返る。
            // さらに Storage へのアップロードはこの変換より前に完了しているため、
            // アップロード → 補償処理による削除、という無駄な往復まで発生する
            store_topping_call_id: requiredInteger('店舗別トッピングコールID', {
                description: '店舗別トッピングコールID',
            }),
        })
        .openapi({ description: '画像に紐づけるトッピングコールの選択内容' }),
)

/**
 * アップロードと更新で共通の項目。
 *
 * 店舗IDはパスパラメータ（/stores/{storeId}/images）を唯一の正とするため、
 * ボディでは受け取らない。ボディにも持たせるとURLと保存先が食い違いうる
 */
const commonImageFields = {
    menu_type: requiredInteger('メニュータイプ', { description: 'メニュータイプ' }),
    menu_name: requiredPlainText('メニュー名', { description: 'メニュー名' }),
}

const toppingSelectionsField = (description: string) =>
    optionalArray(imageToppingSelectionSchema, 'トッピング選択は配列形式で指定してください', {
        description,
    })

export const imageUploadInputSchema = registry.register(
    'ImageUploadInput',
    z
        .object({
            ...commonImageFields,
            // 移行前は notEmpty() → custom(正規表現) の順で、
            // 空のときだけ「必須です」、それ以外は形式エラーになっていた
            image_base64: z
                .string({
                    error: (issue) =>
                        toValidatorString(issue.input) === ''
                            ? '画像データは必須です'
                            : INVALID_IMAGE_MESSAGE,
                })
                .superRefine((value, ctx) => {
                    if (value === '') {
                        ctx.addIssue({ code: 'custom', message: '画像データは必須です' })
                        return
                    }
                    if (!IMAGE_DATA_URL_PATTERN.test(value)) {
                        ctx.addIssue({ code: 'custom', message: INVALID_IMAGE_MESSAGE })
                    }
                })
                .openapi({
                    description: [
                        'data URL形式のBase64画像データ。\n',
                        '`data:image/(jpeg|png|gif|webp);base64,` で始まる必要がある。',
                    ].join(''),
                    example: IMAGE_BASE64_EXAMPLE,
                }),
            topping_selections: toppingSelectionsField(
                '画像に紐づけるトッピングコールの配列（任意）',
            ),
        })
        .openapi({
            description: [
                '店舗画像アップロードのリクエストボディ。\n',
                '投稿者ID（user_id）はなりすまし防止のためリクエストからは受け取らず、\n',
                '検証済みトークンのUIDをサーバー側で設定する。',
            ].join(''),
        }),
)

export const imageUpdateInputSchema = registry.register(
    'ImageUpdateInput',
    z
        .object({
            ...commonImageFields,
            // 更新時は optional() のみで notEmpty() が無かったため、
            // 空文字や型違いは「必須です」ではなく形式エラーになる
            image_base64: z
                .string({ error: INVALID_IMAGE_MESSAGE })
                .refine((value) => IMAGE_DATA_URL_PATTERN.test(value), {
                    error: INVALID_IMAGE_MESSAGE,
                })
                .openapi({
                    description: [
                        'data URL形式のBase64画像データ（任意）。\n',
                        '未指定の場合は既存の画像URLを維持し、メニュー情報とトッピング選択のみ更新する。',
                    ].join(''),
                    example: IMAGE_BASE64_EXAMPLE,
                })
                .optional(),
            topping_selections: toppingSelectionsField(
                '画像に紐づけるトッピングコールの配列（任意。指定すると既存の紐づけを置き換える）',
            ),
        })
        .openapi({
            description: [
                '店舗画像更新のリクエストボディ。\n',
                'image_base64 のみ任意で、指定した場合だけ画像ファイルを差し替える。\n',
                'それ以外の必須項目はアップロード時と同じ。',
            ].join(''),
        }),
)

/** 店舗画像一覧のパスパラメータ */
export const imageListParamSchema = z.object({
    storeId: requiredInteger('店舗ID', { description: '店舗ID' }),
})

/** 店舗画像の個別操作のパスパラメータ */
export const imageParamSchema = z.object({
    storeId: requiredInteger('店舗ID', { description: '店舗ID' }),
    imageId: requiredInteger('画像ID', { description: '画像ID' }),
})

// =============================================================================
// レスポンス
// =============================================================================

const bigIntId = (description: string) => z.string().openapi({ description })

export const imageListItemSchema = registry.register(
    'ImageListItem',
    z
        .object({
            id: bigIntId('画像ID（BigIntのため文字列で返却）'),
            store_id: bigIntId('関連する店舗のID（BigIntのため文字列で返却）'),
            user_id: z.string().openapi({ description: '投稿したユーザーのID' }),
            menu_type: z.number().int().openapi({ description: 'メニュータイプ' }),
            menu_name: z.string().openapi({ description: 'メニュー名' }),
            image_url: z.string().openapi({ description: '画像のURL' }),
            topping_calls: z
                .array(
                    z.object({
                        topping_id: bigIntId('トッピングID（BigIntのため文字列で返却）'),
                        topping_name: z.string().openapi({ description: 'トッピング名' }),
                        call_option_id: bigIntId('コールオプションID（BigIntのため文字列で返却）'),
                        call_option_name: z.string().openapi({ description: 'コールオプション名' }),
                    }),
                )
                .optional()
                .openapi({
                    description: '紐づくトッピングコール。1件も無い場合はフィールドごと返却されない。',
                }),
        })
        .openapi({
            description: [
                '店舗画像一覧取得APIが返す画像情報（一覧表示用）。\n',
                '個別取得APIの ImageEditDetail とはトッピング項目が異なり、\n',
                'こちらは画面表示用に表示名つきの topping_calls を返す。',
            ].join(''),
        }),
)

export const imageEditDetailSchema = registry.register(
    'ImageEditDetail',
    z
        .object({
            id: bigIntId('画像ID（BigIntのため文字列で返却）'),
            store_id: bigIntId('関連する店舗のID（BigIntのため文字列で返却）'),
            user_id: z.string().openapi({ description: '投稿したユーザーのID' }),
            menu_type: z.number().int().openapi({ description: 'メニュータイプ' }),
            menu_name: z.string().openapi({ description: 'メニュー名' }),
            image_url: z.string().openapi({ description: '画像のURL' }),
            topping_selections: z
                .array(
                    z.object({
                        topping_id: bigIntId('トッピングID（BigIntのため文字列で返却）'),
                        call_option_id: bigIntId('コールオプションID（BigIntのため文字列で返却）'),
                        store_topping_call_id: bigIntId(
                            '店舗別トッピングコールID（BigIntのため文字列で返却）',
                        ),
                    }),
                )
                .openapi({ description: '紐づくトッピングコール。1件も無い場合は空配列を返す。' }),
        })
        .openapi({
            description: [
                '店舗画像の個別取得APIが返す画像情報（更新画面用）。\n',
                '一覧取得APIの ImageListItem とはトッピング項目が異なり、\n',
                'こちらは更新リクエストにそのまま渡せる\n',
                'topping_selections（store_topping_call_id つき）を返す。',
            ].join(''),
        }),
)

export const imageWriteResultSchema = registry.register(
    'ImageWriteResult',
    z
        .object({
            imageId: bigIntId('画像ID（BigIntのため文字列で返却）'),
            imageUrl: z.string().openapi({ description: 'アップロードした画像の公開URL' }),
        })
        .openapi({ description: '画像アップロードAPIの data 部' }),
)

export const imageUpdateResultSchema = registry.register(
    'ImageUpdateResult',
    z
        .object({
            imageId: bigIntId('画像ID（BigIntのため文字列で返却）'),
            imageUrl: z.string().openapi({
                description: '画像の公開URL（image_base64 未指定時は更新前のURLをそのまま返す）',
            }),
            imageUpdated: z.boolean().openapi({
                description:
                    '画像ファイル自体を差し替えたかどうか（image_base64 を指定した場合に true）',
            }),
        })
        .openapi({ description: '画像更新APIの data 部' }),
)

export const imageDeleteResultSchema = registry.register(
    'ImageDeleteResult',
    z
        .object({
            imageId: bigIntId('削除した画像ID（BigIntのため文字列で返却）'),
            deleted: z.boolean().openapi({ description: '削除に成功したかどうか', example: true }),
        })
        .openapi({ description: '画像削除APIの data 部' }),
)

registerNotFoundResponse('ImageNotFound', '指定された画像が見つかりません。', '画像が見つかりません')

// =============================================================================
// 型（スキーマから導出する）
// =============================================================================

export type ImageUploadInput = z.infer<typeof imageUploadInputSchema>
export type ImageUpdateInput = z.infer<typeof imageUpdateInputSchema>
export type ImageListItem = z.infer<typeof imageListItemSchema>
export type ImageEditDetail = z.infer<typeof imageEditDetailSchema>
