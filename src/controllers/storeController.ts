import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { StoreService } from "../services/storeServices";

/**
 * 店舗情報に関するリクエストを処理するコントローラー
 * フロントエンドからのリクエストを受け取り、適切なサービスに処理を委譲する
 */
export class StoreController {
    private storeService: StoreService;

    /**
   * コントローラーの初期化
   * 依存するサービスをコンストラクタインジェクションで注入
   */
    constructor() {
        this.storeService = new StoreService()
    }

    /**
   * 店舗情報を登録する
   * 店舗データとマップデータを同時にトランザクションで処理する
   * @param req リクエストオブジェクト
   * @param res レスポンスオブジェクト
   */
    async createStore(req: Request, res: Response): Promise<void> {
        try {
            console.log(req.body)
            // バリデーションエラーの確認
            const errors = validationResult(req)
            // バリデーションエラーの場合はエラーで返す
            if (!errors.isEmpty()) {
                res.status(400).json({
                    errors: errors.array()
                })
                return
            }
            // サービスクラスで店舗情報登録を実施
            const result = await this.storeService.createStore(req.body)

            res.status(201).json({
                status: 'success',
                message: "店舗情報が正常に登録されました。",
                data: result
            })
        } catch (error) {
            console.error('店舗情報登録エラー', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : '店舗情報の登録中に予期せぬエラーが発生しました'
            })
        }
    }

    /**
   * 店舗情報を取得する
   * @param req リクエストオブジェクト
   * @param res レスポンスオブジェクト
   */
    async getStoreById(req: Request, res: Response): Promise<void> {
        const storeId = req.params.id
        // 文字列から数値型変換
        const numStoreId = Number(storeId)
        try {
            // サービスクラスで店舗情報1件取得（ID）を実施
            const result = await this.storeService.getStoreById(numStoreId)
            // console.log("店舗情報取得サービスデータ：", result)
            res.status(200).json({
                status: 'success',
                message: "店舗情報を正常に取得できました。",
                data: result
            })
        } catch (error) {
            console.error('店舗情報取得エラー', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : '店舗情報の取得中に予期せぬエラーが発生しました'

            })
        }
    }

    /**
  * 店舗情報を全件取得する
  * @param req リクエストオブジェクト
  * @param res レスポンスオブジェクト
  */
    async getMapAll(req: Request, res: Response): Promise<void> {
        try {
            // サービスクラスでMAP情報全件取得を実施
            const results = await this.storeService.getMapAll()
            // console.log("MAP情報取得データ：", results)
            res.status(200).json({
                status: 'success',
                message: "店舗情報を正常に取得できました。",
                data: results
            })
        } catch (error) {
            console.error('店舗情報取得エラー', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : '店舗情報の取得中に予期せぬエラーが発生しました'
            })
        }

    }
}