import { Request } from "express"

export const getAuthenticatedUserid = (req: Request): string => {
    // 認証チェック
    if (!req.user) {
        throw new Error('画像削除するには認証が必要です。')
    }

    // 認証チェック - ユーザーIDの存在確認
    if (!req.user.uid) {
        throw new Error('画像削除するには有効な認証情報が必要です')
    }

    return req.user.uid
}