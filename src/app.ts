import 'reflect-metadata'
import 'express-async-errors'
import express from 'express'
import middlewares from './middlewares/middlewares'
import router from './routes/routes'
import config from './config/config'
import { setupBigIntSerialization } from './utils/bigintExtension'
import './config/firebase'
import { errorMiddleware } from './middlewares/errorMiddleware'

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

// リクエストサイズの制限を設定
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * ミドルウェアの適用
 * リクエスト処理のためのミドルウェア関数を登録
 */
app.use(...middlewares)

/**
 * ルーターの適用
 * アプリケーションのルーティングを設定
 */
app.use(router)


/**
 * エラーハンドリングミドルウェアの適用
 * ルーターの後に配置し、アプリケーション全体のエラーを補足
 */
app.use(errorMiddleware)

/**
 * サーバーの起動設定
 * 指定されたポートでHTTPサーバーを起動
 */
const PORT = config.port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})