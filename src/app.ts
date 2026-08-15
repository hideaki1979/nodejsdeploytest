import dotenv from 'dotenv'
import path from 'path'

//.envファイルを読み込む
// この処理は他のどのimportよりも先に実行される必要がある
//
// quiet: true は必須。dotenv 17 から既定で
// 「◇ injected env (N) from .env // tip: ...」というバナーを標準出力に出すようになった。
// 本アプリは pino で構造化ログ(JSON)を出力するため、
// 非JSONの行が混ざるとログ収集側のパースが壊れる。
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true })

import 'reflect-metadata'
// express-async-errors は Express 5 では不要（peer が express@^4 のため共存もできない）。
// Express 5 は async ハンドラ・ミドルウェアの reject を
// 標準でエラーハンドラへ転送する。
import express from 'express'
import cors from 'cors'
import router from './routes/routes'
import config from './config/config'
import { setupBigIntSerialization } from './utils/bigintExtension'
import './config/firebase'
import { AppError, errorMiddleware } from './middlewares/errorMiddleware'
import { PrismaClient } from '@prisma/client'
import { container } from 'tsyringe'
import { GOOGLE_MAP_API_KEY, pinoLogger, PRISMA_CLIENT } from './di.token'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import logger from './config/logger'
import { pinoHttp } from 'pino-http'

/**
 * PrismaClientのインスタンスをDIコンテナに登録
 * アプリケーション全体で単一のインスタンスを共有する
 */
const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: config.prisma.transactionMaxWait,  // トランザクション開始の最大待機時間（10秒）
    timeout: config.prisma.transactionTimeout   // トランザクション全体の最大実行時間（60秒）

  }
})
container.registerInstance(PRISMA_CLIENT, prisma)

/**
 * Google Maps APIキーをDIコンテナに登録
 */
container.register(GOOGLE_MAP_API_KEY, { useValue: config.google.mapsApiKey })

/**
 * BigInt型のJSONシリアライズをサポートするための拡張を設定
 * アプリケーション起動時に一度だけ実行される
 */
setupBigIntSerialization()

/**
 * Expressアプリケーションのインスタンスを作成
 * HTTPサーバーの基盤となるアプリケーションオブジェクト
 */
const app = express()

// DIコンテナにロガーを登録
container.register(pinoLogger, { useValue: logger })

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

/**
 * サーバーの起動設定
 * 指定されたポートでHTTPサーバーを起動
 */
const PORT = config.server.port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})