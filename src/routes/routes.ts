import { Router, Request, Response } from "express";
import prisma from "../prismaClient";
import { storeValidationRules } from "../middlewares/validation";
import { StoreController } from "../controllers/storeController";

/**
 * Express Routerのインスタンスを作成
 * アプリケーションのルーティングを管理する
 */
const router = Router();
const storeController = new StoreController()

/**
 * ルートエンドポイント
 * クライアントに基本的なウェルカムメッセージを返す
 * CI/CD動作確認用の表示も含む
 */
router.get('/', (req, res) => {
    res.send("Hello World!!! This is a autodeployshitekure!!! for CI/CD");
})

/**
 * ヘルスチェック用エンドポイント
 * APIの稼働状態を確認するために使用
 */
router.get('/health', (req, res) => {
    res.send("API is working fine");
})

/**
 * テストデータ追加エンドポイント
 * 指定されたテキストデータをデータベースに保存する
 * リクエストボディからデータを取得し、ない場合はデフォルト値を使用
 * @param {string} req.body.value - 保存するテキスト値
 * @returns {object} 作成結果とステータス情報
 */
router.post('/testinsert', async (req, res) => {
    const value = req.body.value || "TestTextData";
    try {
        // Prismaを使用してデータベースにテストデータを挿入
        const result = await prisma.test.create({
            data: {
                text: value
            }
        })
        res.status(200).json({ status: 'success', message: 'Insert Success!!!', data: result });
    } catch (error) {
        // エラー発生時はログを出力し、エラーレスポンスを返す
        console.error("Insert Error!!!", error);
        res.status(500).json({ status: 'error', message: (error as Error).message });
    }
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


export default router;