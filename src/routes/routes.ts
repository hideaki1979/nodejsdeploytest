import { Router } from "express"
import { mapRouter, storeRouter } from "./store.routes";
import { imageRouter } from "./image.routes";
import { callOptionRouter, toppingRouter } from "./topping.routes";
import { userRouter } from "./user.routes";

/**
 * Express Routerのインスタンスを作成
 * アプリケーションのルーティングを管理する
 */
const router = Router();

/**
 * ルートエンドポイント
 * クライアントに基本的なウェルカムメッセージを返す
 * CI/CD動作確認用の表示も含む
 */

/**
 * @swagger
 * /:
 *   get:
 *     tags:
 *       - System
 *     summary: ルートエンドポイント
 *     description: デプロイの疎通確認用にウェルカムメッセージを返します。認証は不要です。
 *     security: []
 *     responses:
 *       '200':
 *         description: 正常に応答しました。
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: Hello World!!! This is a autodeployshitekure!!! for CI/CD
 */
router.get('/', (req, res) => {
    res.send("Hello World!!! This is a autodeployshitekure!!! for CI/CD")
})

/**
 * ヘルスチェック用エンドポイント
 * APIの稼働状態を確認するために使用
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - System
 *     summary: ヘルスチェック
 *     description: APIの稼働状態を確認します。認証は不要です。
 *     security: []
 *     responses:
 *       '200':
 *         description: APIは正常に稼働しています。
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: API is working fine
 */
router.get('/health', (req, res) => {
    res.send("API is working fine")
})

// 分割したルーターをマウント
router.use("/stores", storeRouter)
router.use("/stores/:storeId/images", imageRouter)
router.use("/maps", mapRouter)
router.use("/toppings", toppingRouter)
router.use("/calloptions", callOptionRouter)
router.use("/users", userRouter)

export default router
