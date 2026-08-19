import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi'
import { registry } from '../openapi/registry'

/**
 * OpenAPI spec を zod スキーマから生成する。
 *
 * 以前は swagger-jsdoc が @swagger JSDoc を走査していたが、
 * リクエストの検証（express-validator）と spec が別々に手書きされていたため、
 * 片方だけ直せば黙って乖離する構造だった（#72 で17件）。
 * 現在は zod スキーマを単一の正とし、検証と spec の両方をそこから導いている。
 *
 * 定義はモジュールの import 時にレジストリへ登録される副作用で集まる。
 * そのため生成の前に、登録側のモジュールを読み込んでおく必要がある。
 */
// 全エンドポイント共通のエラー表現（各リソースのスキーマより先に登録して並び順を安定させる）
import '../schemas/common.schema'
// 各オペレーションの定義。ルート定義から各リソースのスキーマも芋づるに読み込まれる
import '../routes/routes'

const generator = new OpenApiGeneratorV3(registry.definitions)

export const swaggerSpec = generator.generateDocument({
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
    // タグは各ルートではなくここで一括宣言する。
    // ファイルをまたぐと宣言順が読み込み順に左右され、Swagger UI 上の並びが安定しないため。
    tags: [
        { name: 'Stores', description: '店舗情報の登録・取得・更新・閉店' },
        { name: 'Map', description: '店舗の位置情報の取得' },
        { name: 'Images', description: '店舗メニュー画像の投稿・取得・更新・削除' },
        { name: 'Toppings', description: 'トッピングとコールオプションの取得' },
        { name: 'Users', description: 'ユーザー情報の登録・取得' },
        { name: 'System', description: '疎通確認用のエンドポイント' },
    ],
    security: [{ bearerAuth: [] }],
})
