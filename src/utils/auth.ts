import { Request } from "express"
import { AppError } from "../middlewares/errorMiddleware"

/**
 * 認証済みユーザーのFirebase UIDを取得する
 * リクエストボディのIDではなく、必ず検証済みトークンのUIDを信頼の起点とする
 * @param req リクエストオブジェクト
 * @returns Firebase UID
 * @throws AppError 認証情報が存在しない場合
 */
export const getAuthenticatedUserid = (req: Request): string => {
    // 認証チェック
    if (!req.user) {
        throw new AppError('この操作を行うには認証が必要です', 401)
    }

    // 認証チェック - ユーザーIDの存在確認
    if (!req.user.uid) {
        throw new AppError('この操作を行うには有効な認証情報が必要です', 401)
    }

    return req.user.uid
}

/**
 * 認証済みユーザーが管理者ロールを持つかを判定する
 * 管理者権限はFirebase Authenticationのカスタムクレーム（admin: true）で付与する
 * 付与例: admin.auth().setCustomUserClaims(uid, { admin: true })
 * @param req リクエストオブジェクト
 * @returns 管理者の場合true
 */
export const isAdminUser = (req: Request): boolean => req.user?.admin === true
