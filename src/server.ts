import dotenv from 'dotenv'
import path from 'path'

//.envファイルを読み込む
// この処理は他のどのimportよりも先に実行される必要がある
// （config/config.ts は import された時点で環境変数を検証するため）
//
// quiet: true は必須。dotenv 17 から既定で
// 「◇ injected env (N) from .env // tip: ...」というバナーを標準出力に出すようになった。
// 本アプリは pino で構造化ログ(JSON)を出力するため、
// 非JSONの行が混ざるとログ収集側のパースが壊れる。
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true })

import 'reflect-metadata'
// Firebase の初期化を起動時点で走らせ、認証情報の不備をリクエスト到達前に落とす
import './config/firebase'
import { registerProductionDependencies } from './di.container'
import { createApp } from './app'
import config from './config/config'

/**
 * アプリケーションのエントリーポイント。
 *
 * 依存の登録 → アプリの組み立て → 待ち受け、の順に実行する。
 * 組み立て（app.ts）と依存の登録（di.container.ts）を分けているのは、
 * 契約テストが同じ app を使いつつ PrismaClient だけモックへ差し替えるため。
 */
registerProductionDependencies()

const app = createApp()

/**
 * サーバーの起動設定
 * 指定されたポートでHTTPサーバーを起動
 */
const PORT = config.server.port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
