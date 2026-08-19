/**
 * 店舗・マップのスキーマ定義。
 *
 * リクエスト側は移行前の validation.ts と同じ検証・サニタイズになるよう組み立てる。
 */
import { registry } from '../openapi/registry'
import { z } from '../openapi/zod'
import { registerNotFoundResponse } from './common.schema'
import {
    booleanField,
    enumField,
    integerOnly,
    optionalArray,
    optionalText,
    queryEnum,
    queryInteger,
    requiredInteger,
    requiredText,
} from './primitives'

// =============================================================================
// リクエスト
// =============================================================================

export const storeToppingCallInputSchema = registry.register(
    'StoreToppingCallInput',
    z
        .object({
            topping_id: integerOnly('トッピングID', { description: 'トッピングID' }),
            call_option_id: integerOnly('コールオプションID', { description: 'コールオプションID' }),
            call_timing: enumField(
                ['pre_call', 'post_call'],
                'コールタイミングは pre_call または post_call で指定してください',
                { description: 'コールタイミング' },
            ),
            noodle_type_id: integerOnly('麺タイプID', { description: '麺種別ID' }),
        })
        .openapi({ description: '店舗登録・更新時に指定する店舗別トッピングコール' }),
)

export const storeInputSchema = registry.register(
    'StoreInput',
    z
        .object({
            store_name: requiredText('店舗名', 255, { description: '店舗名' }),
            branch_name: optionalText('支店名', 255, { description: '支店名' }),
            address: requiredText('住所', 255, {
                description: '住所（この値から緯度経度を自動計算する）',
            }),
            business_hours: requiredText('営業時間', 255, { description: '営業時間' }),
            regular_holidays: requiredText('定休日', 255, { description: '定休日' }),
            prior_meal_voucher: booleanField('事前食券購入の有無', {
                description: '事前食券購入の有無',
            }),
            is_all_increased: booleanField('全マシの有無', { description: '全マシの有無' }),
            is_lot: booleanField('ロット制の有無', { description: 'ロット制の有無' }),
            // topping_details / call_details / lot_detail は DB 側が Text 型で上限を持たないため、
            // 自由記述欄として妥当な 1000 文字をアプリ側の上限とする
            topping_details: optionalText('トッピング詳細', 1000, { description: 'トッピング詳細' }),
            call_details: optionalText('コール詳細', 1000, { description: 'コール詳細' }),
            lot_detail: optionalText('ロット制詳細', 1000, { description: 'ロット制詳細' }),
            topping_calls: optionalArray(
                storeToppingCallInputSchema,
                'トッピングコールは配列形式で指定してください',
                {
                    description: [
                        '店舗別トッピングコールの配列。\n',
                        '更新時は指定した内容で全件置き換える（既存分を削除してから再登録する）。',
                    ].join(''),
                },
            ),
        })
        .openapi({
            description: [
                '店舗登録・更新のリクエストボディ。\n',
                '緯度経度は address から自動計算するため、リクエストでは指定しない。\n',
                'id は登録時に採番され、is_close は閉店APIでのみ更新するため、いずれも入力項目ではない。',
            ].join(''),
        }),
)

/**
 * 店舗ID（パスパラメータ）。
 *
 * 検証が無いと Number('abc') → NaN のまま Prisma に渡り、
 * 「ユーザーの入力ミス」が 500（予期せぬエラー）として返ってしまうため、
 * ルート層で 400 に倒す。
 */
export const storeIdParamSchema = z.object({
    id: requiredInteger('店舗ID', { description: '店舗ID' }),
})

/**
 * 店舗閉店処理のリクエストボディ。
 * storeName はテンプレートリテラルで店舗名に直接埋め込まれるため、
 * 型・長さのチェックを必須とする（型チェックが漏れると
 * {} が「【閉店】[object Object]」として登録される）。
 */
export const storeCloseInputSchema = z.object({
    storeName: requiredText('店舗名', 255, { description: '閉店表示に使用する店舗名' }),
})

/**
 * 店舗のトッピングコール情報取得の絞り込み条件。
 *
 * ドキュメント用と検証用でスキーマを分けず、この1つを
 * ルート層の validate（400 の判定）とコントローラ（絞り込み条件の組み立て）の
 * 両方で使う。分けると「検証は直したがドキュメントを直し忘れた」が起こりうる。
 *
 * 未指定（`?key=` の空文字を含む）は絞り込み無し、値があれば検証して
 * 満たさなければ 400 に倒す。移行前は解釈できない絞り込み値を黙って捨てていたが、
 * 入力ミスが「絞り込み無しの 200」として返るのは誤りを隠す挙動のため改める。
 */
export const storeToppingCallsQuerySchema = z.object({
    call_timing: queryEnum(
        ['pre_call', 'post_call', 'all'],
        'コールタイミングは pre_call または post_call または all を指定してください',
        {
            description: [
                'コールタイミングでの絞り込み。\n',
                '`all` を指定した場合は絞り込みを行わない。\n',
                '未指定と空文字は絞り込み無しとして扱い、それ以外の値は 400 になる。',
            ].join(''),
        },
    ),
    topping_id: queryInteger('トッピングID', {
        description: 'トッピングIDでの絞り込み（整数以外を指定すると 400 になる）',
    }),
    call_option_id: queryInteger('コールオプションID', {
        description: 'コールオプションIDでの絞り込み（整数以外を指定すると 400 になる）',
    }),
    noodleTypeId: queryInteger('麺種別ID', {
        description: '麺種別IDでの絞り込み（整数以外を指定すると 400 になる）',
    }),
})

// =============================================================================
// レスポンス
// =============================================================================

const bigIntId = (description: string) => z.string().openapi({ description })

export const storeListItemSchema = registry.register(
    'StoreListItem',
    z
        .object({
            id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
            store_name: z.string().openapi({ description: '店舗名' }),
            branch_name: z.string().openapi({ description: '支店名' }).nullable(),
        })
        .openapi({
            description: '全店舗情報取得APIが返す店舗情報（select で3項目に限定している）',
        }),
)

export const formattedToppingOptionNamesSchema = registry.register(
    'FormattedToppingOptionNames',
    z.record(z.string(), z.array(z.string())).openapi({
        description:
            'トッピング名をキーに、選択できるコールオプション名の配列を持つオブジェクト',
        example: { ニンニク: ['マシ', 'マシマシ'] },
    }),
)

export const formattedToppingOptionIdsSchema = registry.register(
    'FormattedToppingOptionIds',
    z.record(z.string(), z.array(z.number().int())).openapi({
        description:
            'トッピングIDをキーに、選択できるコールオプションIDの配列を持つオブジェクト',
        example: { '1': [1, 2] },
    }),
)

export const storeDetailSchema = registry.register(
    'StoreDetail',
    z
        .object({
            id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
            store_name: z.string().openapi({ description: '店舗名' }),
            branch_name: z.string().openapi({ description: '支店名' }).nullable(),
            address: z.string().openapi({ description: '住所' }),
            business_hours: z.string().openapi({ description: '営業時間' }),
            regular_holidays: z.string().openapi({ description: '定休日' }),
            prior_meal_voucher: z.boolean().openapi({ description: '事前食券購入の有無' }),
            topping_details: z.string().openapi({ description: 'トッピング詳細' }).nullable(),
            call_details: z.string().openapi({ description: 'コール詳細' }).nullable(),
            is_all_increased: z.boolean().openapi({ description: '全マシの有無' }),
            is_lot: z.boolean().openapi({ description: 'ロット制の有無' }),
            lot_detail: z.string().openapi({ description: 'ロット制詳細' }).nullable(),
            preCallFormatted: formattedToppingOptionNamesSchema,
            postCallFormatted: formattedToppingOptionNamesSchema,
            preCallFormattedIds: formattedToppingOptionIdsSchema,
            postCallFormattedIds: formattedToppingOptionIdsSchema,
        })
        .openapi({
            description: [
                '店舗情報取得APIが返す店舗詳細。\n',
                '店舗別トッピングコールは、コールタイミングごとに整形した4つのフィールドで返る。\n',
                'is_close は select に含まれないため返却されない。',
            ].join(''),
        }),
)

export const mapSchema = registry.register(
    'Map',
    z
        .object({
            id: bigIntId('マップID（BigIntのため文字列で返却。店舗IDではない点に注意）'),
            latitude: z.string().openapi({
                description: '緯度（Prisma の Decimal のため文字列で返却）',
                example: '35.68123456',
            }),
            longitude: z.string().openapi({
                description: '経度（Prisma の Decimal のため文字列で返却）',
                example: '139.76712345',
            }),
            store: z
                .object({
                    id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
                    store_name: z.string().openapi({ description: '店舗名' }),
                    branch_name: z.string().openapi({ description: '支店名' }).nullable(),
                    address: z.string().openapi({ description: '住所' }),
                    is_close: z.boolean().openapi({ description: '閉店フラグ' }),
                })
                .openapi({ description: '紐づく店舗情報' }),
        })
        .openapi({
            description: [
                'マップ情報取得APIが返す位置情報。\n',
                '店舗情報はトップレベルではなく store にネストして返る。',
            ].join(''),
        }),
)

const storeWriteResultSchema = registry.register(
    'StoreWriteResult',
    z
        .object({
            id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
            store_name: z.string().openapi({ description: '店舗名' }),
            branch_name: z.string().openapi({ description: '支店名' }).nullable(),
            address: z.string().openapi({ description: '住所' }),
            is_close: z.boolean().openapi({ description: '閉店フラグ' }),
        })
        .openapi({
            description: '店舗登録・更新APIが返す店舗情報（返却フィールドを明示的に限定している）',
        }),
)

export const storeCloseResultSchema = registry.register(
    'StoreCloseResult',
    z
        .object({
            id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
            store_name: z.string().openapi({ description: '閉店表記を付与した店舗名' }),
            is_close: z.boolean().openapi({ description: '閉店フラグ' }),
        })
        .openapi({
            description: '閉店APIが返す店舗情報（返却フィールドを明示的に限定している）',
        }),
)

const mapWriteResultSchema = registry.register(
    'MapWriteResult',
    z
        .object({
            id: bigIntId('マップID（BigIntのため文字列で返却）'),
            store_id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
            latitude: z.string().openapi({ description: '緯度（Decimalのため文字列で返却）' }),
            longitude: z.string().openapi({ description: '経度（Decimalのため文字列で返却）' }),
        })
        .openapi({
            description: '店舗登録・更新APIが返すマップ情報（返却フィールドを明示的に限定している）',
        }),
)

const storeToppingCallWriteResultSchema = registry.register(
    'StoreToppingCallWriteResult',
    z
        .object({
            id: bigIntId('店舗別トッピングコールID（BigIntのため文字列で返却）'),
            store_id: bigIntId('店舗ID（BigIntのため文字列で返却）'),
            topping_id: bigIntId('トッピングID（BigIntのため文字列で返却）'),
            call_option_id: bigIntId('コールオプションID（BigIntのため文字列で返却）'),
            call_timing: z
                .enum(['pre_call', 'post_call'])
                .openapi({ description: 'コールタイミング' }),
            noodle_type_id: bigIntId('麺種別ID（BigIntのため文字列で返却）'),
        })
        .openapi({
            description:
                '店舗登録・更新APIが返す店舗別トッピングコール情報（返却フィールドを明示的に限定している）',
        }),
)

const storeToppingCallOptionSchema = registry.register(
    'StoreToppingCallOption',
    z
        .object({
            optionId: z
                .number()
                .int()
                .openapi({ description: 'コールオプションID（Number変換済みのため数値）' }),
            optionName: z.string().openapi({ description: 'コールオプション名' }),
            storeToppingCallId: z
                .number()
                .int()
                .optional()
                .openapi({ description: '店舗別トッピングコールID（Number変換済みのため数値）' }),
        })
        .openapi({ description: '1トッピングに対して選択できるコールオプション' }),
)

const storeToppingCallGroupSchema = registry.register(
    'StoreToppingCallGroup',
    z
        .object({
            toppingId: z.number().int().openapi({ description: 'トッピングID（Number変換済みのため数値）' }),
            toppingName: z.string().openapi({ description: 'トッピング名' }),
            options: z.array(storeToppingCallOptionSchema),
        })
        .openapi({ description: 'トッピング単位でグループ化したコールオプション' }),
)

export const storeToppingCallsResultSchema = registry.register(
    'StoreToppingCallsResult',
    z
        .object({
            id: z.number().int().openapi({ description: '店舗ID（Number変換済みのため数値）' }),
            store_name: z.string().openapi({ description: '店舗名' }),
            branch_name: z.string().openapi({ description: '支店名' }).nullable(),
            // `[トッピングID, トッピング情報]` の2要素タプル。
            // Map を Array.from() で変換したものをそのまま返しているため、
            // オブジェクトの配列ではなくタプルの配列になる。
            // OpenAPI 3.0 はタプルを表現できないため、要素の型はユニオンで示している。
            formattedToppingOptions: z
                .array(
                    z
                        .array(z.union([z.number().int(), storeToppingCallGroupSchema]))
                        .min(2)
                        .max(2),
                )
                .openapi({
                    description: [
                        '`[トッピングID, トッピング情報]` の2要素タプルの配列。\n',
                        'Map を Array.from() で変換したものをそのまま返しているため、\n',
                        'オブジェクトの配列ではなくタプルの配列になる点に注意。\n',
                        'OpenAPI 3.0 はタプルを表現できないため、要素の型はユニオンで示している。',
                    ].join(''),
                    example: [
                        [
                            1,
                            {
                                toppingId: 1,
                                toppingName: 'ニンニク',
                                options: [{ optionId: 1, optionName: 'マシ', storeToppingCallId: 10 }],
                            },
                        ],
                    ],
                }),
        })
        .openapi({ description: '店舗のトッピングコール情報取得APIが返す整形済みデータ' }),
)

export const storeWriteResponseDataSchema = registry.register(
    'StoreWriteResponseData',
    z
        .object({
            store: storeWriteResultSchema,
            map: mapWriteResultSchema,
            storeToppingCalls: z.array(storeToppingCallWriteResultSchema),
        })
        .openapi({ description: '店舗登録・更新APIの data 部' }),
)

registerNotFoundResponse('StoreNotFound', '指定された店舗が見つかりません。', '店舗が見つかりません')

// =============================================================================
// 型（スキーマから導出する）
// =============================================================================

export type StoreInput = z.infer<typeof storeInputSchema>
export type StoreToppingCallInput = z.infer<typeof storeToppingCallInputSchema>
export type StoreCloseInput = z.infer<typeof storeCloseInputSchema>
export type FormattedToppingOptionNames = z.infer<typeof formattedToppingOptionNamesSchema>
export type FormattedToppingOptionIds = z.infer<typeof formattedToppingOptionIdsSchema>
export type StoreToppingCallsResult = z.infer<typeof storeToppingCallsResultSchema>
