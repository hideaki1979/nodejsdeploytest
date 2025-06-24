import { Router } from "express"
import { storeValidationRules } from "../middlewares/validation"
import { StoreController } from "../controllers/storeController"
import { ToppingController } from "../controllers/toppingController"
import { imageGetValidationRules, imageUpdateValidationRules, imageUploadValidationRules } from "../middlewares/imageValidation"
import { ImageController } from "../controllers/imageController"
import { UserController } from "../controllers/userController"
import { authenticateUser } from "../middlewares/authMiddleware"
import { userValidationRules } from "../middlewares/userValidation"
import { container } from "tsyringe"

/**
 * Express Routerのインスタンスを作成
 * アプリケーションのルーティングを管理する
 */
const router = Router();
const storeController = container.resolve(StoreController)
const toppingController = container.resolve(ToppingController)
const imageController = container.resolve(ImageController)
const userController = container.resolve(UserController)

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
router.post('/stores', storeValidationRules, storeController.createStore.bind(storeController))

/**
 * 店舗情報取得エンドポイント
 * 指定されたIDの店舗情報を取得する
 * @param {string} req.params.id - 取得対象の店舗ID
 * @returns {object} 店舗情報とステータス情報
 */
router.get('/stores/:id', storeController.getStoreById.bind(storeController))

/**
 * 全店舗情報取得エンドポイント
 * データベースに登録されている全ての店舗情報を取得する
 * @returns {Array<object>} 店舗情報の配列とステータス情報
 */
router.get('/stores', storeController.getStoresAll.bind(storeController))

/**
 * 店舗情報更新エンドポイント
 * 指定されたIDの店舗情報を更新する
 * @param {string} req.params.id - 更新対象の店舗ID
 * @param {object} req.body - 更新するデータ
 * @returns {object} 更新結果とステータス情報
 */
router.put('/stores/:id', storeValidationRules, storeController.updateStore.bind(storeController))

/**
 * 店舗営業状態変更エンドポイント
 * 指定された店舗の営業状態を「閉店」に変更する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {object} 変更結果とステータス情報
 */
router.patch('/stores/:id/close', storeController.storeClose.bind(storeController))

/**
 * マップ情報取得エンドポイント
 * 全ての店舗の位置情報を取得する
 * @returns {Array<object>} 位置情報を含む店舗データの配列とステータス情報
 */
router.get('/maps', storeController.getMapAll.bind(storeController))

/**
 * トッピング情報取得エンドポイント
 * 全てのトッピング情報を取得する
 * @returns {Array<object>} トッピング情報の配列とステータス情報
 */
router.get('/toppings', toppingController.getToppingAll.bind(toppingController))

/**
 * コールオプション取得エンドポイント
 * 全てのコールオプション情報を取得する
 * @returns {Array<object>} コールオプション情報の配列とステータス情報
 */
router.get('/calloptions', toppingController.getCallOptionAll.bind(toppingController))

/**
 * 店舗別トッピングコール情報取得エンドポイント
 * 指定された店舗のトッピングコール情報を取得する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {Array<object>} トッピングコール情報の配列とステータス情報
 */
router.get('/stores/:id/toppingcalls', storeController.getStoreToppingCalls.bind(storeController))

/**
 * 店舗画像アップロードエンドポイント
 * 指定された店舗の画像をアップロードする
 * @param {string} req.params.id - 対象店舗ID
 * @param {File} req.file - アップロードする画像ファイル
 * @returns {object} アップロード結果とステータス情報
 */
router.post('/stores/:id/images', imageUploadValidationRules, imageController.uploadStoreImage.bind(imageController))

/**
 * 店舗画像一覧取得エンドポイント
 * 指定された店舗の全ての画像を取得する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {Array<object>} 画像情報の配列とステータス情報
 */
router.get(`/stores/:id/images`, imageGetValidationRules, imageController.getStoreImages.bind(imageController))

/**
 * 画像情報取得エンドポイント（店舗ID＋画像ID指定）
 * 指定された店舗IDと画像IDに一致する画像情報を1件取得する
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @returns {object} 画像情報とステータス情報（成功時）、またはエラー情報（失敗時）
 */
router.get(`/stores/:storeId/images/:imageId`, imageGetValidationRules, imageController.getImageByImageId.bind(imageController))

/**
 * 画像情報更新エンドポイント（店舗ID＋画像ID指定）
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @param {object} req.body - 更新する画像データ
 * @returns {object} 更新結果とステータス情報
 */
router.put(`/stores/:storeId/images/:imageId`, imageUpdateValidationRules, imageController.updateStoreImage.bind(imageController))

/**
 * 店舗画像削除エンドポイント（店舗ID＋画像ID指定）
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @returns {object} 削除結果とステータス情報
 */
router.delete(`/stores/:storeId/images/:imageId`, authenticateUser, imageGetValidationRules, imageController.deleteStoreImage.bind(imageController))

/**
 * フォーマット済みトッピングコールオプション取得エンドポイント
 * フロントエンド表示用にフォーマットされたトッピングとコールオプションの関連情報を取得する
 * @returns {object} フォーマット済みのトッピングとコールオプションデータとステータス情報
 */
router.get(`/toppings/calloptions`, toppingController.getFormattedToppingCollOption.bind(toppingController))

/**
 * ユーザー作成エンドポイント
 * 新しいユーザーを作成する
 * @param {object} req.body - ユーザー情報
 * @returns {object} 作成されたユーザー情報とステータス情報
 */
router.post(`/users`, authenticateUser, userValidationRules, userController.createUser.bind(userController))

/**
 * ユーザー情報取得エンドポイント
 * 指定されたUIDのユーザー情報を取得する
 * @param {string} req.params.uid - 取得対象のユーザーUID
 * @returns {object} ユーザー情報とステータス情報
 */
router.get('/users/:uid', authenticateUser, userController.getUserByUid.bind(userController))

export default router
