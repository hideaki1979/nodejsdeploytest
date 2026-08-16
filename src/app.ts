import 'reflect-metadata'
// express-async-errors は Express 5 では不要（peer が express@^4 のため共存もできない）。
// Express 5 は async ハンドラ・ミドルウェアの reject を
// 標準でエラーハンドラへ転送する。
import express, { type ErrorRequestHandler, type RequestHandler } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { pinoHttp } from 'pino-http'
import router from './routes/routes'
import config from './config/config'
import { setupBigIntSerialization } from './utils/bigintExtension'
import { AppError, errorMiddleware } from './middlewares/errorMiddleware'
import { swaggerSpec } from './config/swagger'
import logger from './config/logger'

export interface CreateAppOptions {
    /**
     * ルーターの直前に差し込むミドルウェア。
     *
     * 契約テストが express-openapi-validator を挟むための口として用意している。
     * 本番コードから同ライブラリを import すると devDependency のままでは
     * `npm ci --omit=dev` のビルドが壊れるため、import はテスト側に閉じる。
     */
    preRouteMiddleware?: Array<RequestHandler | ErrorRequestHandler>
}

/**
 * Expressアプリケーションを組み立てて返す。
 *
 * サーバの起動（listen）と依存の登録は行わない。
 * それらは server.ts / di.container.ts の責務で、
 * テストが同じ組み立てを使いつつ依存だけ差し替えられるようにするための分離。
 */
export function createApp(options: CreateAppOptions = {}): express.Express {
    /**
     * BigInt型のJSONシリアライズをサポートするための拡張を設定
     * レスポンスの型（BigIntを文字列で返す）に直結するため、
     * 本番・テストのどちらの経路でも必ず適用されるようここで呼ぶ
     */
    setupBigIntSerialization()

    const app = express()

    // pino-http ミドルウェアを適用
    // 必ず他のルートやミドルウェアより先に適用してください。
    app.use(pinoHttp({ logger }))

    /**
     * Swagger UI のセットアップ
     * /api-docs エンドポイントで API 仕様書を閲覧できるようにする
     */
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

    /**
     * アプリケーションのセキュリティを強化するため、helmetミドルウェアを適用します。
     * これにより、Content-Security-Policy、X-Frame-OptionsなどのHTTPヘッダーが設定され、
     * クロスサイトスクリプティング(XSS)やクリックジャッキングなどの攻撃から保護します。
     */
    app.use(helmet())

    /**
     * アプリケーション全体で使用するミドルウェアを定義
     * @property {Function} express.json() - JSONリクエストボディをパースするミドルウェア
     * @property {Function} cors() - CORSを有効にし、許可オリジンからのリクエストのみを受け付けるミドルウェア
     *
     * 許可オリジンは CORS_ALLOWED_ORIGINS（カンマ区切り）で指定する。
     * 本番では未設定だと config 読み込み時点で起動に失敗する。
     * 開発で未設定の場合のみ null となり、従来どおり全オリジンを許可する。
     * 認証は Authorization ヘッダの Bearer トークン方式で Cookie を使わないため credentials は有効化しない。
     */
    if (config.cors.allowedOrigins) {
        app.use(cors({ origin: config.cors.allowedOrigins, credentials: false }))
    } else {
        logger.warn('CORS_ALLOWED_ORIGINS が未設定のため、全オリジンからのリクエストを許可しています（開発環境のみ許容）')
        app.use(cors())
    }
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // リクエストのパース後・ルーティング前に差し込む。
    // OpenAPI のリクエスト検証は body / query が揃っている必要があるため。
    if (options.preRouteMiddleware) {
        app.use(options.preRouteMiddleware)
    }

    /**
     * ルーターの適用
     * アプリケーションのルーティングを設定
     */
    app.use(router)

    // 404エラーハンドリング
    app.use((_req, _res, next) => {
        next(new AppError("Not Found", 404))
    })

    /**
     * エラーハンドリングミドルウェアの適用
     * ルーターの後に配置し、アプリケーション全体のエラーを補足
     */
    app.use(errorMiddleware)

    return app
}
