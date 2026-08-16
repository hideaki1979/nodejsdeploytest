// .env の読み込み。config/config.ts が import 時に環境変数を検証するため、
// 他のどの import よりも先に置くこと（詳細は loadEnv.ts のコメントを参照）。
import './loadEnv'

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
