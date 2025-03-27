import admin from "firebase-admin"
import path from "path"

/**
 * Firebase Adminの初期化
 * 環境に応じて認証情報の取得方法を切り替える
 * 本番環境: 環境変数から認証情報を取得
 * 開発環境: ローカルのJSONファイルから認証情報を取得
 */
let credential: admin.credential.Credential

if (process.env.FIREBASE_CONFIG) {
    // 本番環境: 環境変数から認証情報を取得
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG)
        credential = admin.credential.cert(serviceAccount)
        console.log("Firebase初期化（環境変数解析・本番環境）完了")
    } catch (error) {
        console.error("Firebase初期化エラー（環境変数解析）：", error)
        throw new Error("Firebaseの環境変数解析時にエラーが発生しました。")
    }
} else {
    // 開発環境: ローカルのJSONファイルから認証情報を取得
    const GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, "../../jnaviproject-firebase-adminsdk-fbsvc-f96e2396e1.json")
    credential = admin.credential.cert(GOOGLE_APPLICATION_CREDENTIALS)
    console.log("Firebase初期化（環境変数解析・開発環境）完了")
}

// Firebaseアプリの初期化
if (!admin.apps.length) {
    admin.initializeApp({
        credential,
        storageBucket: "jnaviproject.firebasestorage.app"
    })
}

/**
 * Firebase Storageインスタンスの取得
 * アプリケーション全体で使用される共有インスタンス
 */
export const bucket = admin.storage().bucket()

// デフォルトでFirebase管理インスタンスをエクスポート
export default admin;