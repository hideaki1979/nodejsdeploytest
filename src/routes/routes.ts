import { Router, Request, Response } from "express"
import { storeValidationRules } from "../middlewares/validation"
import { StoreController } from "../controllers/storeController"
import { ToppingController } from "../controllers/toppingController"
import { imageValidationRules } from "../middlewares/imageValidation"
import { ImageController } from "../controllers/imageController"

/**
 * Express Routerのインスタンスを作成
 * アプリケーションのルーティングを管理する
 */
const router = Router();
const storeController = new StoreController()
const toppingController = new ToppingController()
const imageController = new ImageController()

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

/**
 * 店舗情報テーブル追加エンドポイント
 * 指定されたデータをデータベースに保存する
 * リクエストボディからデータを取得する。
 * @param {object} req.body - 保存するテキスト値
 * @returns {object} 作成結果とステータス情報
 */
router.post('/stores', storeValidationRules, (req: Request, res: Response) => {
    storeController.createStore(req, res)
})

router.get('/stores/:id', (req: Request, res: Response) => {
    storeController.getStoreById(req, res)
})

router.get('/maps', (req: Request, res: Response) => {
    storeController.getMapAll(req, res)
})

router.get('/toppings', (req: Request, res: Response) => {
    toppingController.getToppingAll(req, res)
})

router.get('/calloptions', (req: Request, res: Response) => {
    toppingController.getCallOptionAll(req, res)
})

router.get('/stores', (req: Request, res: Response) => {
    storeController.getStoresAll(req, res)
})

router.get('/stores/:id/toppingcalls', (req: Request, res: Response) => {
    storeController.getStoreToppingCalls(req, res)
})

router.post('/stores/:id/images', imageValidationRules, (req: Request, res: Response) => {
    imageController.uploadStoreImage(req, res)
})

export default router