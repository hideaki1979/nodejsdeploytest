import { NextFunction, Request, Response, Router } from "express"
import { container } from "tsyringe"
import { ToppingController } from "../controllers/toppingController"

const toppingRouter = Router()

/**
 * トッピング情報取得エンドポイント
 * 全てのトッピング情報を取得する
 * @returns {Array<object>} トッピング情報の配列とステータス情報
 */
toppingRouter.get('/', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ToppingController).getToppingAll(req, res).catch(next)
)

/**
 * フォーマット済みトッピングコールオプション取得エンドポイント
 * フロントエンド表示用にフォーマットされたトッピングとコールオプションの関連情報を取得する
 * @returns {object} フォーマット済みのトッピングとコールオプションデータとステータス情報
 */
toppingRouter.get(`/calloptions/formatted`, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ToppingController).getFormattedToppingCollOption(req, res).catch(next)
)
/**
 * コールオプション取得エンドポイント
 * 全てのコールオプション情報を取得する
 * @returns {Array<object>} コールオプション情報の配列とステータス情報
 */
const callOptionRouter = Router()
callOptionRouter.get('/', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ToppingController).getCallOptionAll(req, res).catch(next)
)
export { toppingRouter, callOptionRouter }
