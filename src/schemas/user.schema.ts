/**
 * ユーザーのスキーマ定義。
 *
 * リクエスト側は移行前の userValidation.ts と同じ検証・サニタイズになるよう組み立てる。
 * 表示名とプロフィールは「文字数チェック → trim → HTMLエスケープ」の順で、
 * 文字数は trim 前の値に対して数える（移行前の isLength().trim().escape() と同じ）。
 */
import validator from 'validator'
import { registry } from '../openapi/registry'
import { z } from '../openapi/zod'
import { registerNotFoundResponse } from './common.schema'
import { dateTimeString } from './topping.schema'
import { enumField, type FieldDoc } from './primitives'

/** 表示名・プロフィール用。文字数チェックは trim 前、保存値は trim + HTMLエスケープ後 */
function escapedText(label: string, maxLength: number, doc: FieldDoc) {
    return z
        .string({ error: `${label}は文字列で指定してください` })
        .refine((value) => validator.isLength(value, { max: maxLength }), {
            error: `${label}は${maxLength}文字以内で入力してください`,
        })
        .transform((value) => validator.escape(value.trim()))
        .openapi({ maxLength, ...doc })
        .optional()
}

export const userSchema = registry.register(
    'User',
    z
        .object({
            id: z.string().openapi({
                description:
                    'ユーザーID（Firebase Authentication の UID。リクエストの uid ではなく id で返る）',
                example: 'yA1bC2dE3fG4hI5jK6lM7nO8pQ9r',
            }),
            display_name: z
                .string()
                .openapi({
                    description: '表示名（リクエストの displayName に対応）',
                    example: 'Taro Yamada',
                })
                .nullable(),
            email: z
                .string()
                .openapi({ format: 'email', description: 'メールアドレス', example: 'user@example.com' })
                .nullable(),
            bio: z
                .string()
                .openapi({ description: 'プロフィール', example: 'プロフィール情報です' })
                .nullable(),
            provider: z
                .string()
                .openapi({
                    description: '認証プロバイダー（リクエストの authProvider に対応）',
                    example: 'google',
                })
                .nullable(),
            created_at: dateTimeString('作成日時').openapi({ example: '2025-01-01T00:00:00.000Z' }),
            updated_at: dateTimeString('更新日時').openapi({ example: '2025-01-01T00:00:00.000Z' }),
        })
        .openapi({
            description: [
                'ユーザー情報のレスポンス。\n',
                'userService は Prisma の行をそのまま返すため、フィールド名は\n',
                'リクエスト（UserInput）のキャメルケースではなく DB カラム名（スネークケース）になる。',
            ].join(''),
        }),
)

export const userInputSchema = registry.register(
    'UserInput',
    z
        .object({
            email: z
                .string({ error: '有効なメールアドレスを入力してください' })
                .refine((value) => validator.isEmail(value), {
                    error: '有効なメールアドレスを入力してください',
                })
                // normalizeEmail は不正なアドレスに対して false を返すことがある。
                // その場合は元の値を残す（直前の isEmail を通っているため実際には起きない）。
                .transform((value) => {
                    const normalized = validator.normalizeEmail(value)
                    return normalized === false ? value : normalized
                })
                .openapi({
                    format: 'email',
                    description: 'メールアドレス（正規化して保存される）',
                    example: 'user@example.com',
                })
                .optional(),
            displayName: escapedText('表示名', 50, {
                description: '表示名（前後の空白除去とHTMLエスケープを行って保存される）',
                example: 'Taro Yamada',
            }),
            // 移行前の isIn() は前後に空白があると弾いていたため、trim は行わない
            authProvider: enumField(
                ['google', 'facebook', 'twitter', 'github', 'email'],
                'サポートされていない認証プロバイダーです',
                {
                    description: '認証プロバイダー（列挙値以外を指定すると 400 になる）',
                    example: 'google',
                },
            ).optional(),
            bio: escapedText('プロフィール', 500, {
                description: [
                    'プロフィール（前後の空白除去とHTMLエスケープを行って保存される）。\n',
                    'ユーザー情報の更新APIが無いため、設定できるのは新規登録時のみ。',
                ].join(''),
                example: 'プロフィール情報です',
            }),
        })
        .openapi({
            description: [
                'ユーザー登録のリクエストボディ。\n',
                '全項目が任意で、未指定の項目は null として登録される。\n',
                'uid は他ユーザーのUIDでのレコード作成を防ぐためリクエストボディからは受け取らず、\n',
                '検証済みトークンのUIDをサーバー側で設定する。',
            ].join(''),
        }),
)

/** GET /users/{uid} のパスパラメータ（ドキュメント用。UIDは文字列のため検証は行わない） */
export const userUidParamSchema = z.object({
    uid: z.string().openapi({ description: 'ユーザーID' }),
})

registerNotFoundResponse(
    'UserNotFound',
    '指定されたユーザーが見つかりません。',
    '該当するユーザーが存在しません',
)

export type UserInput = z.infer<typeof userInputSchema>
