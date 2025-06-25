import { NextFunction, Request, Response, Router } from "express";
import { container } from "tsyringe";
import { StoreController } from "../controllers/storeController";
import { storeValidationRules } from "../middlewares/validation";

const storeRouter = Router()


/**
 * 店舗情報テーブル追加エンドポイント
 * 指定されたデータをデータベースに保存する
 * リクエストボディからデータを取得する。
 * @param {object} req.body - 保存するテキスト値
 * @returns {object} 作成結果とステータス情報
 */
storeRouter.post('/', storeValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).createStore(req, res).catch(next))

/**
 * 店舗情報取得エンドポイント
 * 指定されたIDの店舗情報を取得する
 * @param {string} req.params.id - 取得対象の店舗ID
 * @returns {object} 店舗情報とステータス情報
 */
storeRouter.get('/:id', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).getStoreById(req, res).catch(next))

/**
 * 全店舗情報取得エンドポイント
 * データベースに登録されている全ての店舗情報を取得する
 * @returns {Array<object>} 店舗情報の配列とステータス情報
 */
storeRouter.get('/', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).getStoresAll(req, res).catch(next)
)

/**
 * 店舗情報更新エンドポイント
 * 指定されたIDの店舗情報を更新する
 * @param {string} req.params.id - 更新対象の店舗ID
 * @param {object} req.body - 更新するデータ
 * @returns {object} 更新結果とステータス情報
 */
storeRouter.put('/:id', storeValidationRules, (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).updateStore(req, res).catch(next)
);

/**
 * 店舗営業状態変更エンドポイント
 * 指定された店舗の営業状態を「閉店」に変更する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {object} 変更結果とステータス情報
 */
storeRouter.patch('/:id/close', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).storeClose(req, res).catch(next)
);

/**
 * 店舗別トッピングコール情報取得エンドポイント
 * 指定された店舗のトッピングコール情報を取得する
 * @param {string} req.params.id - 対象店舗ID
 * @returns {Array<object>} トッピングコール情報の配列とステータス情報
 */
storeRouter.get('/:id/toppingcalls', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).getStoreToppingCalls(req, res).catch(next)
)

/**
 * マップ情報取得エンドポイント
 * 全ての店舗の位置情報を取得する
 * @returns {Array<object>} 位置情報を含む店舗データの配列とステータス情報
 */
const mapRouter = Router()
mapRouter.get('/', (req: Request, res: Response, next: NextFunction) =>
    container.resolve(StoreController).getMapAll(req, res).catch(next)
);

export { storeRouter, mapRouter }