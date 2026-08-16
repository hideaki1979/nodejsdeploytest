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
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: { type: 'string', description: 'エラーメッセージ' },
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