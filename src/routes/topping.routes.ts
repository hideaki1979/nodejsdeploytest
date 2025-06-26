import { Router } from "express"
import { ToppingController } from "../controllers/toppingController"
import { createHandler } from "../utils/routeHandler"

const toppingRouter = Router()

/**
 * @swagger
 * /toppings:
 *   get:
 *     tags:
 *       - Toppings
 *     summary: 全トッピング情報取得
 *     description: データベースに登録されている全てのトッピング情報を取得します。
 *     responses:
 *       '200':
 *         description: 正常に全トッピング情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Topping'
 */
toppingRouter.get('/', createHandler(ToppingController, 'getToppingAll'))

/**
 * @swagger
 * /toppings/call-options/formatted:
 *   get:
 *     tags:
 *       - Toppings
 *     summary: フォーマット済みトッピングコールオプション取得
 *     description: フロントエンド表示用に、カテゴリごとにグループ化され、各トッピングに関連するコールオプションが含まれた情報を取得します。
 *     responses:
 *       '200':
 *         description: 正常にフォーマット済みトッピングコールオプションを取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FormattedTopping'
 */
toppingRouter.get(`/calloptions/formatted`, createHandler(ToppingController, 'getFormattedToppingCollOption'))
/**
 * @swagger
 * /call-options:
 *   get:
 *     tags:
 *       - Toppings
 *     summary: 全コールオプション取得
 *     description: データベースに登録されている全てのコールオプション（マシマシ等）を取得します。
 *     responses:
 *       '200':
 *         description: 正常に全コールオプション情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CallOption'
 */
const callOptionRouter = Router()
callOptionRouter.get('/', createHandler(ToppingController, 'getCallOptionAll'))

export { toppingRouter, callOptionRouter }
