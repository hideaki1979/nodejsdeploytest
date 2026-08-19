import { Request } from 'express'

/**
 * ログ出力用に、クエリ文字列を落としたリクエストパスを返す。
 *
 * クエリはクライアントが任意の内容を載せられるうえ（`?token=...` のような
 * 値が URL に入る事故は珍しくない）、本プロジェクトのログ出力箇所は
 * いずれも error レベルで LOG_LEVEL に関わらず常に残る。
 * config/logger.ts で認証ヘッダをマスクしているのと同じ理由で、パスだけを残す。
 *
 * req.path を使わないのは、サブルーターがプレフィックス付きでマウントされており
 * （routes.ts の router.use('/stores', ...) など）、ハンドラ内の req.path が
 * マウント位置からの相対パスになるため。originalUrl から切り出せば
 * 実際に受け取った完全なパスが残る。
 */
export const pathWithoutQuery = (req: Request): string => req.originalUrl.split('?')[0]
