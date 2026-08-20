import { Request, Response } from "express";
import { StoreService } from "../services/storeService";
import { FormattedToppingOptionNameStoreData, StoreToppingCallFilter } from "../types/store";
import { StoreToppingCallsQuery } from "../schemas/store.schema";
import { getValidatedQuery } from "../middlewares/zodValidation";
import { autoInjectable, inject } from "tsyringe";
import { pinoLogger } from "../di.token";
import { Logger } from "pino";

/**
 * 店舗情報に関するリクエストを処理するコントローラー
 * フロントエンドからのリクエストを受け取り、適切なサービスに処理を委譲する
 */
@autoInjectable()
export class StoreController {
    /**
   * コントローラーの初期化
   * 依存するサービスをコンストラクタインジェクションで注入
   */
    constructor(
        private storeService: StoreService,
        @inject(pinoLogger) private logger: Logger
    ) { }

    /**
   * 店舗情報を登録する
   * 店舗データとマップデータを同時にトランザクションで処理する
   * @param req リクエストオブジェクト
   * @param res レスポンスオブジェクト
   */
    async createStore(req: Request, res: Response): Promise<void> {
        // サービスクラスで店舗情報登録を実施
        const result = await this.storeService.createStore(req.body)

        res.status(201).json({
            success: true,
            message: "店舗情報が正常に登録されました。",
            data: result
        })
    }

    /**
     * 店舗情報を更新する
     * 店舗データと店舗別トッピングコール情報を同時にトランザクションで処理する
     * @param req リクエストオブジェクト
     * @param res レスポンスオブジェクト
     */
    async updateStore(req: Request, res: Response): Promise<void> {

        const storeId = Number(req.params.id)
        const result = await this.storeService.updateStore(storeId, req.body)

        // 既存店舗の更新でありリソースの新規作成ではないため 200 を返す
        res.status(200).json({
            data: result,
            success: true,
            message: '店舗情報が正常に更新されました'
        })
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
        // サービスクラスで店舗情報1件取得（ID）を実施
        const result: FormattedToppingOptionNameStoreData = await this.storeService.getStoreById(numStoreId)
        // result.id = Number(result.id)
        // console.log("店舗情報取得サービスデータ：", JSON.stringify(result, null, 2))
        res.status(200).json({
            success: true,
            message: "店舗情報を正常に取得できました。",
            data: result
        })
    }

    /**
  * 店舗情報を全件取得する
  * @param req リクエストオブジェクト
  * @param res レスポンスオブジェクト
  */
    async getMapAll(req: Request, res: Response): Promise<void> {
        // サービスクラスでMAP情報全件取得を実施
        const results = await this.storeService.getMapAll()
        // console.log("MAP情報取得データ：", results)
        res.status(200).json({
            success: true,
            message: "店舗情報を正常に取得できました。",
            data: results
        })
    }

    /**
    * 店舗情報を全件取得する
    * @param req リクエストオブジェクト
    * @param res レスポンスオブジェクト
    */
    async getStoresAll(req: Request, res: Response): Promise<void> {
        // サービスクラスで全店舗情報取得を実施
        const results = await this.storeService.getStoresAll()
        // console.log("全店舗情報データ", results)
        res.status(200).json({
            success: true,
            message: "全店舗情報を正常に取得できました。",
            data: results
        })
    }

    /**
    * コールタイミングに該当するコールトッピング情報を全件取得する
    * @param req リクエストオブジェクト
    * @param res レスポンスオブジェクト
    */
    async getStoreToppingCalls(req: Request, res: Response): Promise<void> {
        // 整数であることはルート層の validate({ params: storeIdParamSchema }) が保証する。
        // ここで再度判定すると、spec が有効とする 0 を弾く・小数や 2^53 超を通すといった
        // 乖離が生まれる（存在しない店舗はサービス層が 404 に倒す）
        const id = Number(req.params.id)

        // クエリの解釈もルート層の validate が済ませている。
        // 値違反は validate が details つきの 400 で返すため、ここへ届く時点で検証済み。
        // Express 5 の req.query は書き戻せないので、検証済みの値は res.locals 経由で受け取る
        // （ここで読み直すとパースが2箇所に増え、解釈が validate と食い違いうる）
        const query = getValidatedQuery<StoreToppingCallsQuery>(res)

        // フィルター条件をオブジェクトとして構築（未指定の項目は undefined）
        const filters: StoreToppingCallFilter = {
            callTiming: query.call_timing,
            toppingId: query.topping_id,
            call_option_id: query.call_option_id,
            noodleTypeId: query.noodleTypeId,
        }

        // サービスクラスでコールタイミング該当するコールトッピング情報を取得する
        const result = await this.storeService.getStoreToppingCalls(id, filters)

        res.status(200).json({
            success: true,
            message: "コールタイミングに該当するコールトッピング情報を正常に取得できました。",
            data: result
        })
    }

    /**
     * 閉店処理を実行する
     * @param req リクエストオブジェクト
     * @param res レスポンスオブジェクト
     * @remarks
     * 閉店処理は、店舗の情報を更新することで実現する。
     *店舗IDと店舗名を指定して、店舗情報を更新する。
     *成功すると、200 OKを返す。
     *失敗すると、500 Internal Server Errorを返す。
     */
    async storeClose(req: Request, res: Response): Promise<void> {
        const storeId = Number(req.params.id)
        const storeName = req.body.storeName
        const result = await this.storeService.storeClose(storeId, storeName)

        // 既存店舗の状態更新でありリソースの新規作成ではないため 200 を返す
        res.status(200).json({
            success: true,
            data: result,
            message: "閉店処理が正常に終了しました"
        })
    }
}