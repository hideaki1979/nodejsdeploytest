import { Credential, cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { getStorage } from "firebase-admin/storage"
import config from "./config"
import { AppError } from "../middlewares/errorMiddleware"

/**
 * Firebase Adminの初期化
 * 設定ファイルから読み込んだ情報を使用して初期化を行う
 *
 * firebase-admin v14でレガシー名前空間（admin.credential / admin.apps /
 * admin.auth() / admin.storage()）が削除されたため、モジュラーAPIを使用する
 */
let credential: Credential

try {
    // NODE_ENVに応じて認証情報の設定を分岐
    if (config.server.nodeEnv === 'production') {
        // 本番環境: 環境変数からパースしたJSONオブジェクトを使用
        const serviceAccount = JSON.parse(config.firebase.serviceAccount)
        credential = cert(serviceAccount)
        console.log("Firebase初期化（本番環境）完了")
    } else {
        // 開発環境: サービスアカウントキーのファイルパスを使用
        credential = cert(config.firebase.serviceAccount)
        console.log("Firebase初期化（開発環境）完了")
    }
} catch (error) {
    console.error("Firebase初期化エラー（環境変数解析）：", error)
    throw new AppError("Firebaseの環境変数解析時にエラーが発生しました。", 500)
}

// Firebaseアプリの初期化
if (!getApps().length) {
    initializeApp({
        credential,
        storageBucket: config.firebase.storageBucket
    })
}

/**
 * Firebase Authインスタンスの取得
 * アプリケーション全体で使用される共有インスタンス
 */
export const auth = getAuth()

/**
 * Firebase Storageインスタンスの取得
 * アプリケーション全体で使用される共有インスタンス
 */
export const bucket = getStorage().bucket()