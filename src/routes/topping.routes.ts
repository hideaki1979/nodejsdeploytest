import { Router } from "express"
import { ToppingController } from "../controllers/toppingController"
import { createHandler } from "../utils/routeHandler"

const toppingRouter = Router()

/**
 * トッピング情報取得エンドポイント
 * 全てのトッピング情報を取得する
 * @returns {Array<object>} トッピング情報の配列とステータス情報
 */
toppingRouter.get('/', createHandler(ToppingController, 'getToppingAll'))

/**
 * フォーマット済みトッピングコールオプション取得エンドポイント
 * フロントエンド表示用にフォーマットされたトッピングとコールオプションの関連情報を取得する
 * @returns {object} フォーマット済みのトッピングとコールオプションデータとステータス情報
 */
toppingRouter.get(`/calloptions/formatted`, createHandler(ToppingController, 'getFormattedToppingCollOption'))
/**
 * コールオプション取得エンドポイント
 * 全てのコールオプション情報を取得する
 * @returns {Array<object>} コールオプション情報の配列とステータス情報
 */
const callOptionRouter = Router()
callOptionRouter.get('/', createHandler(ToppingController, 'getCallOptionAll'))

export { toppingRouter, callOptionRouter }
