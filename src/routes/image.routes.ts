import { NextFunction, Request, Response, Router } from "express"
import { container } from "tsyringe"
import { ImageController } from "../controllers/imageController"
import { imageGetValidationRules, imageUpdateValidationRules, imageUploadValidationRules } from "../middlewares/imageValidation"
import { authenticateUser } from "../middlewares/authMiddleware"

const imageRouter = Router({ mergeParams: true })

/**
 * 店舗画像アップロードエンドポイント
 * 指定された店舗の画像をアップロードする
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {File} req.file - アップロードする画像ファイル
 * @returns {object} アップロード結果とステータス情報
 */
imageRouter.post('/', imageUploadValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ImageController).uploadStoreImage(req, res).catch(next)
)
/**
 * 店舗画像一覧取得エンドポイント
 * 指定された店舗の全ての画像を取得する
 * @param {string} req.params.storeId - 対象店舗ID
 * @returns {Array<object>} 画像情報の配列とステータス情報
 */
imageRouter.get(`/`, imageGetValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ImageController).getStoreImages(req, res).catch(next)
)
/**
 * 画像情報取得エンドポイント（店舗ID＋画像ID指定）
 * 指定された店舗IDと画像IDに一致する画像情報を1件取得する
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @returns {object} 画像情報とステータス情報（成功時）、またはエラー情報（失敗時）
 */
imageRouter.get(`/:imageId`, imageGetValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ImageController).getImageByImageId(req, res).catch(next)
)
/**
 * 画像情報更新エンドポイント（店舗ID＋画像ID指定）
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @param {object} req.body - 更新する画像データ
 * @returns {object} 更新結果とステータス情報
 */
imageRouter.put(`/:imageId`, imageUpdateValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ImageController).updateStoreImage(req, res).catch(next)
)
/**
 * 店舗画像削除エンドポイント（店舗ID＋画像ID指定）
 * @param {string} req.params.storeId - 対象店舗ID
 * @param {string} req.params.imageId - 対象画像ID
 * @returns {object} 削除結果とステータス情報
 */
imageRouter.delete(`/:imageId`, authenticateUser, imageGetValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(ImageController).deleteStoreImage(req, res).catch(next)
)
export { imageRouter }