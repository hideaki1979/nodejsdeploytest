import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.3',
        info: {
            title: 'J-Navi Backend(Node.js(Express))',
            version: process.env.npm_package_version || '1.0.0',
            description: 'A simple CRUD API application made with Express and documented with Swagger',
            license: {
                name: 'MIT',
                url: 'https://spdx.org/licenses/MIT.html',
            },
            contact: {
                name: 'Kagami',
                url: 'https://github.com/hideaki1979/nodejsdeploytest',
                email: 'syumeikyo@outlook.jp',
            },
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        // タグは各ルートのJSDocではなくここで一括宣言する。
        // ファイルをまたぐと宣言順が読み込み順に左右され、Swagger UI 上の並びが安定しないため。
        tags: [
            { name: 'Stores', description: '店舗情報の登録・取得・更新・閉店' },
            { name: 'Map', description: '店舗の位置情報の取得' },
            { name: 'Images', description: '店舗メニュー画像の投稿・取得・更新・削除' },
            { name: 'Toppings', description: 'トッピングとコールオプションの取得' },
            { name: 'Users', description: 'ユーザー情報の登録・取得' },
            { name: 'System', description: '疎通確認用のエンドポイント' },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            // 全エンドポイント共通のエラー表現はここに集約する。
            // 個別のリソースに紐づくもの（StoreNotFound 等）は各 types/*.ts 側で定義している。
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    description: 'errorMiddleware が返すエラーレスポンスの共通形式',
                    required: ['success', 'error'],
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', description: 'エラーメッセージ' },
                    },
                },
                // authMiddleware が返す本文は { status, message } で共通だが、
                // status の取りうる値は HTTP ステータスごとに固定されている。
                // 1つのスキーマにまとめると 401 で AuthServiceUnavailable を、
                // 503 で InvalidToken を許してしまい、契約テストが
                // 実装と食い違う組み合わせを見逃すため、ステータスごとに分けて定義する。
                AuthErrorResponse: {
                    type: 'object',
                    description: [
                        'authMiddleware（authenticateUser）が 401 で返すエラーレスポンスの形式。',
                        'errorMiddleware を経由せず自前で応答するため、',
                        'ErrorResponse（success / error）とはキーが異なる点に注意。',
                    ].join(''),
                    required: ['status', 'message'],
                    properties: {
                        status: {
                            type: 'string',
                            description: [
                                '認証に失敗した理由。クライアントはこの値で再ログインを促すかを判断する。',
                                'AccountDisabled / AccountNotFound は再ログインしても解消しない。',
                            ].join(''),
                            enum: [
                                'Unauthorized',
                                'TokenExpired',
                                'TokenRevoked',
                                'AccountDisabled',
                                'AccountNotFound',
                                'InvalidToken',
                            ],
                            example: 'InvalidToken',
                        },
                        message: { type: 'string', description: 'エラーメッセージ' },
                    },
                },
                AuthUnavailableResponse: {
                    type: 'object',
                    description: [
                        'authMiddleware（authenticateUser）が 503 で返すエラーレスポンスの形式。',
                        'AuthErrorResponse とキーは同じだが、status は AuthServiceUnavailable のみを取る。',
                    ].join(''),
                    required: ['status', 'message'],
                    properties: {
                        status: {
                            type: 'string',
                            description: [
                                'トークンではなく認証サービス側の問題であることを示す。',
                                'クライアントはこの値のときだけ再ログインではなく再試行へ倒す。',
                            ].join(''),
                            enum: ['AuthServiceUnavailable'],
                            example: 'AuthServiceUnavailable',
                        },
                        message: { type: 'string', description: 'エラーメッセージ' },
                    },
                },
                ValidationErrorDetail: {
                    type: 'object',
                    description: 'express-validator が返すフィールド単位のエラー',
                    properties: {
                        type: { type: 'string', example: 'field' },
                        msg: { type: 'string', description: 'エラーメッセージ', example: '店舗名は必須です' },
                        path: { type: 'string', description: '対象のフィールド名', example: 'store_name' },
                        location: { type: 'string', description: '値の取得元', example: 'body' },
                        value: { description: '検証対象となった値' },
                    },
                },
            },
            responses: {
                ValidationError: {
                    description: 'リクエストの入力値に誤りがあります（express-validator による検証エラー）。',
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
                                        items: { $ref: '#/components/schemas/ValidationErrorDetail' },
                                    },
                                },
                            },
                        },
                    },
                },
                BadRequest: {
                    description: 'リクエストが無効です（コントローラ・サービス層での検証エラー）。',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                Unauthorized: {
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
                            schema: {
                                oneOf: [
                                    { $ref: '#/components/schemas/AuthErrorResponse' },
                                    { $ref: '#/components/schemas/ErrorResponse' },
                                ],
                            },
                        },
                    },
                },
                Forbidden: {
                    description: 'この操作を行う権限がありません。',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                InternalServerError: {
                    description: [
                        'サーバー内部でエラーが発生しました。',
                        '原因の詳細はレスポンスに含めずサーバーログにのみ出力する。',
                    ].join(''),
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/ErrorResponse' },
                        },
                    },
                },
                AuthServiceUnavailable: {
                    description: [
                        'Firebase Authentication に接続できませんでした。\n',
                        'トークンが無効なわけではないため、クライアントは再ログインではなく',
                        '時間をおいた再試行へ倒すこと。',
                    ].join(''),
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/AuthUnavailableResponse' },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/routes/*.ts', './src/types/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options); 