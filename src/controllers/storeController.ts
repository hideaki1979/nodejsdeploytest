import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { StoreService } from "../services/storeServices";
import { FormattedToppingOptionNameStoreData, StoreToppingCallFilter } from "../types/store";

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
     * 店舗情報を更新する
     * 店舗データと店舗別トッピングコール情報を同時にトランザクションで処理する
     * @param req リクエストオブジェクト
     * @param res レスポンスオブジェクト
     */
    async updateStore(req: Request, res: Response): Promise<void> {
        // バリデーションエラーの確認
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.error("バリデーションエラー")
            res.status(400).json({
                status: 'error',
                errors: errors.array()
            })
        }
        try {

            const storeId = Number(req.params.id)
            const result = await this.storeService.updateStore(storeId, req.body)

            res.status(201).json({
                data: result,
                status: 'success',
                message: '店舗情報が正常に更新されました'
            })

        } catch (error) {
            console.error('店舗情報・店舗別トッピングコール情報更新エラー', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : '店舗情報'
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
            const result: FormattedToppingOptionNameStoreData = await this.storeService.getStoreById(numStoreId)
            // result.id = Number(result.id)
            // console.log("店舗情報取得サービスデータ：", JSON.stringify(result, null, 2))
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

    /**
* 店舗情報を全件取得する
* @param req リクエストオブジェクト
* @param res レスポンスオブジェクト
*/
    async getStoresAll(req: Request, res: Response): Promise<void> {
        try {
            // サービスクラスで全店舗情報取得を実施
            const results = await this.storeService.getStoresAll()
            // console.log("全店舗情報データ", results)
            res.status(200).json({
                status: 'success',
                message: "全店舗情報を正常に取得できました。",
                data: results
            })
        } catch (error) {
            console.error('全店舗情報取得エラー', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : '全店舗情報の取得中に予期せぬエラーが発生しました'
            })
        }
    }

    /**
    * コールタイミングに該当するコールトッピング情報を全件取得する
    * @param req リクエストオブジェクト
    * @param res レスポンスオブジェクト
    */
    async getStoreToppingCalls(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id)

            // パラメータのバリデーション
            if (!id || isNaN(id)) {
                res.status(400).json({
                    status: 'error',
                    message: '有効な店舗IDを指定してください'
                })
                return
            }

            // フィルター条件をオブジェクトとして構築
            const filters: StoreToppingCallFilter = {}

            // クエリパラメータから各フィルター条件を取得
            if (req.query.call_timing) {
                const callTiming = req.query.call_timing as StoreToppingCallFilter['callTiming']

                if (callTiming !== 'pre_call' && callTiming !== 'post_call' && callTiming !== 'all') {
                    res.status(400).json({
                        status: 'error',
                        message: 'コールタイミングは pre_call または post_call または all を指定してください'
                    })
                    return
                }

                filters.callTiming = callTiming
            }

            // トッピングIDのパラメータがある場合
            if (req.query.topping_id) {
                const toppingId = Number(req.query.topping_id)
                if (!isNaN(toppingId)) {
                    filters.toppingId = toppingId
                }
            }

            // コールオプションIDのパラメータがある場合
            if (req.query.call_option_id) {
                const optionId = Number(req.query.call_option_id)
                if (!isNaN(optionId)) {
                    filters.call_option_id = optionId
                }
            }

            // 麺種別IDのパラメータがある場合
            if (req.query.noodleTypeId) {
                const noodleTypeId = Number(req.query.noodleTypeId)
                if (!isNaN(noodleTypeId)) {
                    filters.noodleTypeId = noodleTypeId
                }
            }

            // サービスクラスでコールタイミング該当するコールトッピング情報を取得する
            const result = await this.storeService.getStoreToppingCalls(id, filters)
            // console.log("シミュレーション用店舗別トッピングコール情報データ：", JSON.stringify(result, null, 2))

            res.status(200).json({
                status: 'success',
                message: "コールタイミングに該当するコールトッピング情報を正常に取得できました。",
                data: result
            })
        } catch (error) {
            console.error('トッピングコール情報取得エラー', error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : 'トッピングコール情報の取得中に予期せぬエラーが発生しました'
            })
        }
    }

    /**
     * 閉店処理を実行する
     * @param req リクエストオブジェクト
     * @param res レスポンスオブジェクト
     * @remarks
     * 閉店処理は、店舗の情報を更新することで実現する。
     *店舗IDと店舗名を指定して、店舗情報を更新する。
     *成功すると、201 Createdを返す。
     *失敗すると、500 Internal Server Errorを返す。
     */
    async storeClose(req: Request, res: Response): Promise<void> {
        try {
            const storeId = Number(req.params.id)
            const storeName = req.body.storeName
            const result = this.storeService.storeClose(storeId, storeName)

            res.status(201).json({
                status: 'success',
                data: result,
                message: "閉店処理が正常に終了しました"
            })
        } catch (error) {
            console.error("閉店処理エラー", error)
            res.status(500).json({
                status: 'error',
                message: error instanceof Error ? error.message : '閉店処理中に予期せぬエラーが発生しました。'
            })
        }
    }
}