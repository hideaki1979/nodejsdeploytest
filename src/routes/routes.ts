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
router.get('/', (req, res) => {
    res.send("Hello World!!! This is a autodeployshitekure!!! for CI/CD")
})

/**
 * ヘルスチェック用エンドポイント
 * APIの稼働状態を確認するために使用
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
