/**
 * 全エンドポイントで共通のエラー表現と、成功レスポンスの封筒。
 *
 * 個別のリソースに紐づくもの（StoreNotFound 等）は各 *.schema.ts 側で定義する。
 */
import { registry } from '../openapi/registry'
import { z } from '../openapi/zod'

/** components/schemas への参照を組み立てる（名前の綴り違いを1箇所に閉じるため） */
export function schemaRef(name: string): { $ref: string } {
    return { $ref: `#/components/schemas/${name}` }
}

/** components/responses への参照を組み立てる */
export function responseRef(name: string): { $ref: string } {
    return { $ref: `#/components/responses/${name}` }
}

registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
})

export const errorResponseSchema = registry.register(
    'ErrorResponse',
    z
        .object({
            success: z.boolean().openapi({ example: false }),
            error: z.string().openapi({ description: 'エラーメッセージ' }),
        })
        .openapi({ description: 'errorMiddleware が返すエラーレスポンスの共通形式' }),
)

// authMiddleware が返す本文は { status, message } で共通だが、
// status の取りうる値は HTTP ステータスごとに固定されている。
// 1つのスキーマにまとめると 401 で AuthServiceUnavailable を、
// 503 で InvalidToken を許してしまい、契約テストが
// 実装と食い違う組み合わせを見逃すため、ステータスごとに分けて定義する。
registry.register(
    'AuthErrorResponse',
    z
        .object({
            status: z
                .enum([
                    'Unauthorized',
                    'TokenExpired',
                    'TokenRevoked',
                    'AccountDisabled',
                    'AccountNotFound',
                    'InvalidToken',
                ])
                .openapi({
                    description: [
                        '認証に失敗した理由。クライアントはこの値で再ログインを促すかを判断する。',
                        'AccountDisabled / AccountNotFound は再ログインしても解消しない。',
                    ].join(''),
                    example: 'InvalidToken',
                }),
            message: z.string().openapi({ description: 'エラーメッセージ' }),
        })
        .openapi({
            description: [
                'authMiddleware（authenticateUser）が 401 で返すエラーレスポンスの形式。',
                'errorMiddleware を経由せず自前で応答するため、',
                'ErrorResponse（success / error）とはキーが異なる点に注意。',
            ].join(''),
        }),
)

registry.register(
    'AuthUnavailableResponse',
    z
        .object({
            status: z.enum(['AuthServiceUnavailable']).openapi({
                description: [
                    'トークンではなく認証サービス側の問題であることを示す。',
                    'クライアントはこの値のときだけ再ログインではなく再試行へ倒す。',
                ].join(''),
                example: 'AuthServiceUnavailable',
            }),
            message: z.string().openapi({ description: 'エラーメッセージ' }),
        })
        .openapi({
            description: [
                'authMiddleware（authenticateUser）が 503 で返すエラーレスポンスの形式。',
                'AuthErrorResponse とキーは同じだが、status は AuthServiceUnavailable のみを取る。',
            ].join(''),
        }),
)

// リクエスト検証の失敗時に返す形は src/middlewares/zodValidation.ts が組み立てており、
// zod スキーマから導かれるものではないため、ここだけ生の OpenAPI で書く。
// value は「検証対象になった値そのもの」で型を限定できない。
// OpenAPI 3.0 で「なんでも良い」を表すには type を書かないしかなく、
// zod 由来のスキーマでは（z.any() でも）nullable: true が付いてしまい lint に通らない。
registry.registerComponent('schemas', 'ValidationErrorDetail', {
    type: 'object',
    description: 'リクエスト検証が返すフィールド単位のエラー',
    properties: {
        type: { type: 'string', enum: ['field'], example: 'field' },
        msg: { type: 'string', description: 'エラーメッセージ', example: '店舗名は必須です' },
        path: { type: 'string', description: '対象のフィールド名', example: 'store_name' },
        location: {
            type: 'string',
            enum: ['body', 'params'],
            description: '値の取得元',
            example: 'body',
        },
        value: { description: '検証対象となった値' },
    },
})

registry.registerComponent('responses', 'ValidationError', {
    description: 'リクエストの入力値に誤りがあります（zod スキーマによる検証エラー）。',
    content: {
        'application/json': {
            schema: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                        type: 'string',
                        example: 'バリデーションエラー発生：入力値に誤りがあります。',
                    },
                    details: {
                        type: 'array',
                        description: 'フィールドごとの詳細。同一フィールドについては先頭1件のみ返す。',
                        items: schemaRef('ValidationErrorDetail'),
                    },
                },
            },
        },
    },
})

registry.registerComponent('responses', 'BadRequest', {
    description: 'リクエストが無効です（コントローラ・サービス層での検証エラー）。',
    content: { 'application/json': { schema: schemaRef('ErrorResponse') } },
})

registry.registerComponent('responses', 'Unauthorized', {
    description: [
        '認証に失敗しました。\n\n',
        'トークンの検証で弾かれた場合は authMiddleware が AuthErrorResponse を返す',
        '（status で TokenExpired / TokenRevoked などの種別が分かる。',
        '認証サービス側の障害は 401 ではなく 503 で返るため、',
        'ここに AuthServiceUnavailable は現れない）。\n',
        '検証を通過した後にコントローラ側で認証情報を確認できなかった場合のみ、',
        'errorMiddleware 経由で ErrorResponse が返る。',
    ].join(''),
    content: {
        'application/json': {
            schema: { oneOf: [schemaRef('AuthErrorResponse'), schemaRef('ErrorResponse')] },
        },
    },
})

registry.registerComponent('responses', 'Forbidden', {
    description: 'この操作を行う権限がありません。',
    content: { 'application/json': { schema: schemaRef('ErrorResponse') } },
})

registry.registerComponent('responses', 'InternalServerError', {
    description: [
        'サーバー内部でエラーが発生しました。',
        '原因の詳細はレスポンスに含めずサーバーログにのみ出力する。',
    ].join(''),
    content: { 'application/json': { schema: schemaRef('ErrorResponse') } },
})

registry.registerComponent('responses', 'AuthServiceUnavailable', {
    description: [
        'Firebase Authentication に接続できませんでした。\n',
        'トークンが無効なわけではないため、クライアントは再ログインではなく',
        '時間をおいた再試行へ倒すこと。',
    ].join(''),
    content: { 'application/json': { schema: schemaRef('AuthUnavailableResponse') } },
})

/**
 * リソース単位の 404 レスポンスを登録する。
 * 形は共通（ErrorResponse）だが、error の例文だけがリソースごとに変わる。
 */
export function registerNotFoundResponse(name: string, description: string, example: string): void {
    registry.registerComponent('responses', name, {
        description,
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    required: ['success', 'error'],
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', example },
                    },
                },
            },
        },
    })
}

/**
 * 成功レスポンスの封筒（{ success, message, data }）。
 *
 * controller が返す形はここに集約する。message には実装が返す文言をそのまま例として載せ、
 * 契約テストが spec と実レスポンスを突き合わせられるようにする。
 */
export function successEnvelope<T extends z.ZodType>(message: string, data: T) {
    return z.object({
        success: z.boolean().openapi({ example: true }),
        message: z.string().openapi({ example: message }),
        data,
    })
}
