import { NextFunction, Request, Response } from "express";
import { DecodedIdToken } from "firebase-admin/auth"
import { auth } from "../config/firebase"

// リクエストにユーザー情報を追加するための拡張
declare module 'express' {
    interface Request {
        user?: DecodedIdToken;
    }
}

/**
 * Firebase Admin SDK が投げるエラーからエラーコードを取り出す。
 * catch した値は unknown のため、code を持つオブジェクトであることを確認してから読む。
 */
const getFirebaseErrorCode = (error: unknown): string | undefined => {
    if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        typeof error.code === 'string'
    ) {
        return error.code
    }
    return undefined
}

/**
 * 公開鍵の取得失敗かどうかを判定する。
 *
 * firebase-admin は署名検証中の例外を mapJwtErrorToAuthError で
 * すべて auth/argument-error に潰す（KEY_FETCH_ERROR 専用の分岐が無い）ため、
 * 改竄トークンと鍵取得失敗をエラーコードでは区別できない。
 * 唯一の手掛かりがメッセージなので、SDKが鍵取得経路でのみ生成する
 * 接頭辞に限定して判定する。
 * SDK側の文言が変われば判定が外れて従来どおり401に落ちるだけで、
 * 無効なトークンを誤って通すことはない。
 */
const isPublicKeyFetchFailure = (error: unknown): boolean =>
    error instanceof Error &&
    // 証明書エンドポイントがエラー応答を返した場合（UrlKeyFetcher）
    (error.message.startsWith('Error fetching public keys for Google certs:') ||
        // DNS断・接続失敗などHTTP層の失敗（HttpClient）
        error.message.startsWith('Error while making request:'))

export const authenticateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                status: 'Unauthorized',
                message: '認証トークンがありません'
            })
            return
        }

        // 'Bearer 'の後の部分（トークン）を取得
        const idToken = authHeader.split('Bearer ')[1]

        // Firebase Admin SDKでトークンを検証する。
        //
        // 第2引数 checkRevoked を省略すると署名と有効期限しか見ないため、
        // ログアウト時の revokeRefreshTokens で失効させたトークンが
        // Firebaseのデフォルト有効期限いっぱい（最大1時間）そのまま通ってしまう。
        // フロント側のセッションクッキーは verifySessionCookie(cookie, true) で
        // 失効を見ているが、書き込み系はIDトークンをそのまま転送してくるため、
        // 書き込みに対する失効を担保できるのはこの検証だけ。
        //
        // true にすると失効に加えてアカウントの無効化・削除も反映される。
        // 代償としてリクエスト毎にFirebaseへの照会が1回増えるが、
        // このミドルウェアが適用されるのは書き込み系と GET /users/:uid のみで、
        // 公開読み取り（店舗一覧・マップ・トッピング）は通らないため影響は限定的。
        const decodedToken = await auth.verifyIdToken(idToken, true)

        // 検証済みユーザー情報をリクエストオブジェクトに追加
        req.user = decodedToken

        // 次のミドルウェアやルートハンドラーに処理を渡す
        next();
    } catch (error) {
        console.error('認証エラー：', error)

        const code = getFirebaseErrorCode(error)

        // エラーの種類に応じたレスポンスを返す
        if (code === 'auth/id-token-expired') {
            res.status(401).json({
                status: 'TokenExpired',
                message: '認証トークンの有効期限が切れています。再ログインしてください'
            })
            return
        }

        // ログアウトやパスワード変更で revokeRefreshTokens が実行された場合。
        // 再ログインで解消する点は期限切れと同じなので、同等の扱いにする。
        if (code === 'auth/id-token-revoked') {
            res.status(401).json({
                status: 'TokenRevoked',
                message: '認証セッションが無効化されています。再ログインしてください'
            })
            return
        }

        // アカウントが無効化・削除された場合。checkRevoked=true にしたことで
        // 検出できるようになった。再ログインしても解消しないため文言を分ける。
        if (code === 'auth/user-disabled') {
            res.status(401).json({
                status: 'AccountDisabled',
                message: 'このアカウントは無効化されています'
            })
            return
        }

        if (code === 'auth/user-not-found') {
            res.status(401).json({
                status: 'AccountNotFound',
                message: 'アカウントが存在しません'
            })
            return
        }

        // 失効チェックはFirebaseへの照会を伴うため、Firebase側の障害や
        // ネットワーク断でもこのcatchに到達するようになった。
        // トークンが無効なわけではないので401ではなく503を返し、
        // クライアントが誤って再ログインへ倒さないようにする。
        if (
            code === 'app/network-error' ||
            code === 'app/network-timeout' ||
            code === 'auth/internal-error' ||
            // 公開鍵の取得失敗も auth/argument-error に潰されて届くため個別に判定する
            (code === 'auth/argument-error' && isPublicKeyFetchFailure(error))
        ) {
            res.status(503).json({
                status: 'AuthServiceUnavailable',
                message: '認証サービスに接続できません。時間をおいて再度お試しください'
            })
            return
        }

        // 既にレスポンスを返しているためnext(error)は呼ばない
        // （呼ぶとエラーハンドラが二重にレスポンスを送信し ERR_HTTP_HEADERS_SENT が発生する）
        res.status(401).json({
            status: 'InvalidToken',
            message: `無効な認証トークンです`
        })
    }
}