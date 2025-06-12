import { Router, Request, Response } from "express"
import { storeValidationRules } from "../middlewares/validation"
import { StoreController } from "../controllers/storeController"
import { ToppingController } from "../controllers/toppingController"
import { imageGetValidationRules, imageUploadValidationRules } from "../middlewares/imageValidation"
import { ImageController } from "../controllers/imageController"
import { UserController } from "../controllers/userController"
import { authenticateUser } from "../middlewares/authMiddleware"
import { userValidationRules } from "../middlewares/userValidation"

/**
 * Express Routerのインスタンスを作成
 * アプリケーションのルーティングを管理する
 */
const router = Router();
const storeController = new StoreController()
const toppingController = new ToppingController()
const imageController = new ImageController()
const userController = new UserController()

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

/**
 * 店舗情報取得エンドポイント
 * 指定されたIDの店舗情報を取得する
 * @param {string} req.params.id - 取得対象の店舗ID
 * @returns {object} 店舗情報とステータス情報
 */
router.get('/stores/:id', (req: Request, res: Response) => {
    storeController.getStoreById(req, res)
})

/**
 * 全店舗情報取得エンドポイント
 * データベースに登録されている全ての店舗情報を取得する
 * @returns {Array<object>} 店舗情報の配列とステータス情報
 */
router.get('/stores', (req: Request, res: Response) => {
    storeController.getStoresAll(req, res)
})

/**
 * 店舗情報更新エンドポイント
 * 指定されたIDの店舗情報を更新する
 * @param {string} req.params.id - 更新対象の店舗ID
 * @param {object} req.body - 更新するデータ
 * @returns {object} 更新結果とステータス情報
 */
router.put('/stores/:id', storeValidationRules, (req: Request, res: Response) => {
    storeController.updateStore(req, res)
})

/**
 * 店舗営業状態変更エンドポイント
 * 指定された店舗の営業状態を「閉店」に変更する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {object} 変更結果とステータス情報
 */
router.patch('/stores/:id/close', (req: Request, res: Response) => {
    storeController.storeClose(req, res)
})

/**
 * マップ情報取得エンドポイント
 * 全ての店舗の位置情報を取得する
 * @returns {Array<object>} 位置情報を含む店舗データの配列とステータス情報
 */
router.get('/maps', (req: Request, res: Response) => {
    storeController.getMapAll(req, res)
})

/**
 * トッピング情報取得エンドポイント
 * 全てのトッピング情報を取得する
 * @returns {Array<object>} トッピング情報の配列とステータス情報
 */
router.get('/toppings', (req: Request, res: Response) => {
    toppingController.getToppingAll(req, res)
})

/**
 * コールオプション取得エンドポイント
 * 全てのコールオプション情報を取得する
 * @returns {Array<object>} コールオプション情報の配列とステータス情報
 */
router.get('/calloptions', (req: Request, res: Response) => {
    toppingController.getCallOptionAll(req, res)
})

/**
 * 店舗別トッピングコール情報取得エンドポイント
 * 指定された店舗のトッピングコール情報を取得する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {Array<object>} トッピングコール情報の配列とステータス情報
 */
router.get('/stores/:id/toppingcalls', (req: Request, res: Response) => {
    storeController.getStoreToppingCalls(req, res)
})

/**
 * 店舗画像アップロードエンドポイント
 * 指定された店舗の画像をアップロードする
 * @param {string} req.params.id - 対象店舗ID
 * @param {File} req.file - アップロードする画像ファイル
 * @returns {object} アップロード結果とステータス情報
 */
router.post('/stores/:id/images', imageUploadValidationRules, (req: Request, res: Response) => {
    imageController.uploadStoreImage(req, res)
})

/**
 * 店舗画像一覧取得エンドポイント
 * 指定された店舗の全ての画像を取得する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {Array<object>} 画像情報の配列とステータス情報
 */
router.get(`/stores/:id/images`, imageGetValidationRules, (req: Request, res: Response) => {
    imageController.getStoreImages(req, res)
})

/**
 * 画像情報取得エンドポイント（店舗ID＋画像ID指定）
 * 指定された店舗IDと画像IDに一致する画像情報を1件取得する
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @returns {object} 画像情報とステータス情報（成功時）、またはエラー情報（失敗時）
 */
router.get(`/stores/:storeId/images/:imageId`, (req: Request, res: Response) => {
    imageController.getImageByImageId(req, res)
})

/**
 * フォーマット済みトッピングコールオプション取得エンドポイント
 * フロントエンド表示用にフォーマットされたトッピングとコールオプションの関連情報を取得する
 * @returns {object} フォーマット済みのトッピングとコールオプションデータとステータス情報
 */
router.get(`/toppings/calloptions`, (req: Request, res: Response) => {
    toppingController.getFormattedToppingCollOption(req, res)
})

router.post(`/users`, authenticateUser, userValidationRules, (req: Request, res: Response) => {
    userController.createUser(req, res)
})

router.get('/users/:uid', authenticateUser, (req: Request, res: Response) => {
    userController.getUserByUid(req, res)
})

export default router