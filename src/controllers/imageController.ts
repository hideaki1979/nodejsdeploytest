import { Request, Response } from "express";
import { ImageService } from "../services/imageService";
import { StoreImageUploadData } from "../types/image";
import { getAuthenticatedUserid, isAdminUser } from "../utils/auth";
import { autoInjectable } from "tsyringe";

@autoInjectable()
export class ImageController {

    /**
     * コントローラーの初期化
     * 依存するサービスをコンストラクタインジェクションで注入
     */
    constructor(
        private imageService: ImageService,
    ) { }

    /**
     * 店舗の画像をアップロードして保存する
     * @param req リクエストオブジェクト
     * @param res レスポンスオブジェクト
     */
    async uploadStoreImage(req: Request, res: Response): Promise<void> {

        // 投稿者IDはリクエストボディではなく検証済みトークンから取得する（なりすまし防止）
        const userId = getAuthenticatedUserid(req)

        const imageData: StoreImageUploadData = req.body

        // サービスを呼び出して画像アップロードを実行
        const result = await this.imageService.createImage(imageData, userId)

        // 正常終了レスポンスをリターン
        res.status(201).json({
            success: true,
            message: "画像が正常にアップロードしました！",
            data: {
                imageId: result.image.id.toString(),
                imageUrl: result.image.image_url
            }
        })
    }

    async getStoreImages(req: Request, res: Response): Promise<void> {
        const storeId = Number(req.params.storeId)
        // サービスクラスから店舗単位の画像情報を取得する。
        const result = await this.imageService.getImageByStoreId(storeId)
        // console.log("店舗画像リスト：", JSON.stringify(result, null, 2))

        // 正常終了レスポンスをリターン
        res.status(200).json({
            success: true,
            message: "店舗別画像情報を正常に取得できました。",
            data: result
        })
    }

    async getImageByImageId(req: Request, res: Response): Promise<void> {
        // パラメータから店舗IDと画像IDを取得
        const storeId = req.params.storeId
        const imageId = req.params.imageId

        // サービスクラスから画像IDを条件に画像情報・画像トッピング情報を取得する。
        const result = await this.imageService.getImageByImageId(storeId, imageId)
        // 正常終了でリターン
        res.status(200).json({
            success: true,
            message: '画像情報を正常取得しました',
            data: result
        })
    }

    async updateStoreImage(req: Request, res: Response) {

        // 操作者の認証情報を取得（投稿者本人か管理者かの判定に使用する）
        const userId = getAuthenticatedUserid(req)
        const isAdmin = isAdminUser(req)

        // パラメータから店舗IDと画像IDを取得
        const storeId = req.params.storeId
        const imageId = req.params.imageId

        // リクエストボディから画像更新データを取得する
        const updateData: StoreImageUploadData = req.body

        // サービスクラスから画像IDを条件に画像情報・画像トッピング情報を取得する。
        const result = await this.imageService.updateStoreImageService(storeId, imageId, updateData, userId, isAdmin)

        res.status(200).json({
            success: true,
            message: '画像情報が正常に更新されました',
            data: {
                imageId: result.image.id.toString(),
                imageUrl: result.image.image_url,
                imageUpdated: result.imageUpdated
            }
        })
    }

    async deleteStoreImage(req: Request, res: Response) {

        // 操作者の認証情報を取得（投稿者本人か管理者かの判定に使用する）
        const userId = getAuthenticatedUserid(req)
        const isAdmin = isAdminUser(req)

        // パラメータから店舗IDと画像IDを取得
        const storeId = req.params.storeId
        const imageId = req.params.imageId

        // サービスクラスから画像削除処理を実行する
        const result = await this.imageService.deleteStoreImageService(storeId, imageId, userId, isAdmin)

        res.status(200).json({
            success: true,
            message: '画像が正常に削除されました',
            data: {
                imageId: result.image.id.toString(),
                deleted: result.deleted
            }
        })
    }
}