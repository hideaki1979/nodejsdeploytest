/**
 * トッピング・コールオプションのスキーマ定義。
 *
 * いずれも取得系のみのリソースのため、レスポンスの形だけを持つ。
 */
import { registry } from '../openapi/registry'
import { z } from '../openapi/zod'

/** Prisma の DateTime が JSON 化された値（ISO8601 文字列） */
export function dateTimeString(description: string) {
    return z.string().openapi({ format: 'date-time', description })
}

export const toppingSchema = registry.register(
    'Topping',
    z
        .object({
            id: z.string().openapi({ description: 'トッピングID（BigIntのため文字列で返却）' }),
            topping_name: z.string().openapi({ description: 'トッピング名' }),
            topping_category: z.number().int().openapi({ description: 'カテゴリID' }),
            created_at: dateTimeString('作成日時'),
            updated_at: dateTimeString('更新日時'),
        })
        .openapi({
            description: '全トッピング情報取得APIが返すトッピング（Prismaの行をそのまま返している）',
        }),
)

export const callOptionSchema = registry.register(
    'CallOption',
    z
        .object({
            id: z.string().openapi({ description: 'コールオプションID（BigIntのため文字列で返却）' }),
            call_option_name: z.string().openapi({ description: 'コール名' }),
            call_category: z.number().int().openapi({ description: 'コールカテゴリ' }),
            created_at: dateTimeString('作成日時'),
            updated_at: dateTimeString('更新日時'),
        })
        .openapi({
            description:
                '全コールオプション取得APIが返すコールオプション（Prismaの行をそのまま返している）',
        }),
)

/** toppingService が整形して返すトッピング（IDは Number 変換済み） */
export const toppingDataSchema = z.object({
    id: z.number().int().openapi({ description: 'トッピングID' }),
    topping_category: z.number().int().openapi({ description: 'トッピングカテゴリ' }),
    topping_name: z.string().openapi({ description: 'トッピング名' }),
})

/** toppingService が整形して返すコールオプション（IDは Number 変換済み） */
export const callOptionDataSchema = z.object({
    id: z.number().int().openapi({ description: 'コールオプションID' }),
    call_category: z.number().int().openapi({ description: 'コールカテゴリ' }),
    call_option_name: z.string().openapi({ description: 'コールオプション名' }),
})

export const resultToppingCallSchema = registry.register(
    'ResultToppingCall',
    z
        .object({
            topping: toppingDataSchema.openapi({
                description: 'トッピング情報（IDは Number 変換済みのため数値で返る）',
            }),
            call_options: z.array(callOptionDataSchema).openapi({
                description: 'トッピングカテゴリとコールカテゴリが一致するコールオプションの配列',
            }),
        })
        .openapi({
            description: '1トッピングと、そのトッピングカテゴリに一致するコールオプションの組',
        }),
)

export const formattedToppingCallOptionMapSchema = registry.register(
    'FormattedToppingCallOptionMap',
    z.record(z.string(), resultToppingCallSchema).openapi({
        description: [
            'トッピングIDを文字列にしたものをキーとするオブジェクト。配列ではない点に注意。\n',
            'キーの一覧は登録済みトッピングによって変動するため additionalProperties で表現している。',
        ].join(''),
        example: {
            '1': {
                topping: { id: 1, topping_category: 1, topping_name: 'ニンニク' },
                call_options: [
                    { id: 1, call_category: 1, call_option_name: 'マシ' },
                    { id: 2, call_category: 1, call_option_name: 'マシマシ' },
                ],
            },
        },
    }),
)

export type ToppingData = z.infer<typeof toppingDataSchema>
export type CallOptionData = z.infer<typeof callOptionDataSchema>
export type ResultToppingCall = z.infer<typeof resultToppingCallSchema>
