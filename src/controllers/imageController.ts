import { Request, Response } from "express";
import { ImageService } from "../services/imageService";
import { validationResult } from "express-validator";
import { StoreImageUploadData } from "../types/image";

export class ImageController {
    private imageService: ImageService

    /**
     * コントローラーの初期化
     * 依存するサービスをコンストラクタインジェクションで注入
     */
    constructor() {
        this.imageService = new ImageService()
    }

    /**
     * 店舗の画像をアップロードして保存する
     * @param req リクエストオブジェクト
     * @param res レスポンスオブジェクト
     */
    async uploadStoreImage(req: Request, res: Response): Promise<void> {
        try {
            // バリデーションエラーの確認
            const errors = validationResult(req)

            // バリデーションエラーがある場合はエラーレスポンスを返す
            if (!errors.isEmpty) {
                res.status(400).json({
                    status: 'error',
                    message: 'バリデーションエラー',
                    errors: errors.array()
                })
                return
            }

            const imageData: StoreImageUploadData = req.body

            // サービスを呼び出して画像アップロードを実行
            const result = await this.imageService.createImage(imageData)

            // 正常終了レスポンスをリターン
            res.status(200).json({
                status: 'success',
                message: "画像が正常にアップロードしました！",
                data: {
                    imageId: result.image.id.toString(),
                    imageUrl: result.image.image_url
                }
            })
        } catch (error) {
            // エラーをログに記録し、エラーレスポンスを返す
            console.error('画像アップロード処理エラー:', error)

            res.status(500).json({
                status: 'error',
                message: error instanceof Error
                    ? error.message
                    : '画像のアップロード中に予期せぬエラーが発生しました'
            })
        }
    }
}