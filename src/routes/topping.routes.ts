import { Router } from "express"
import { container } from "tsyringe"
import { ToppingController } from "../controllers/toppingController"

const toppingRouter = Router()
const toppingController = container.resolve(ToppingController)

/**
 * トッピング情報取得エンドポイント
 * 全てのトッピング情報を取得する
 * @returns {Array<object>} トッピング情報の配列とステータス情報
 */
toppingRouter.get('/', toppingController.getToppingAll.bind(toppingController))

/**
 * フォーマット済みトッピングコールオプション取得エンドポイント
 * フロントエンド表示用にフォーマットされたトッピングとコールオプションの関連情報を取得する
 * @returns {object} フォーマット済みのトッピングとコールオプションデータとステータス情報
 */
toppingRouter.get(`/calloptions/formatted`, toppingController.getFormattedToppingCollOption.bind(toppingController))

/**
 * コールオプション取得エンドポイント
 * 全てのコールオプション情報を取得する
 * @returns {Array<object>} コールオプション情報の配列とステータス情報
 */
const callOptionRouter = Router()
callOptionRouter.get('/', toppingController.getCallOptionAll.bind(toppingController))

export { toppingRouter, callOptionRouter }
