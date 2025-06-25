import admin from "firebase-admin"
import config from "./config"
import { AppError } from "../middlewares/errorMiddleware"

/**
 * Firebase Adminの初期化
 * 設定ファイルから読み込んだ情報を使用して初期化を行う
 */
let credential

try {
    // NODE_ENVに応じて認証情報の設定を分岐
    if (config.server.nodeEnv === 'production') {
        // 本番環境: 環境変数からパースしたJSONオブジェクトを使用
        const serviceAccount = JSON.parse(config.firebase.serviceAccount)
        credential = admin.credential.cert(serviceAccount)
        console.log("Firebase初期化（本番環境）完了")
    } else {
        // 開発環境: サービスアカウントキーのファイルパスを使用
        credential = admin.credential.cert(config.firebase.serviceAccount)
        console.log("Firebase初期化（開発環境）完了")
    }
} catch (error) {
    console.error("Firebase初期化エラー（環境変数解析）：", error)
    throw new AppError("Firebaseの環境変数解析時にエラーが発生しました。", 500)
}

// Firebaseアプリの初期化
if (!admin.apps.length) {
    admin.initializeApp({
        credential,
        storageBucket: config.firebase.storageBucket
    })
}

/**
 * Firebase Storageインスタンスの取得
 * アプリケーション全体で使用される共有インスタンス
 */
export const bucket = admin.storage().bucket()

// デフォルトでFirebase管理インスタンスをエクスポート
export default admin