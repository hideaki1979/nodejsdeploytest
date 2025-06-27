import { Router } from "express";
import { StoreController } from "../controllers/storeController";
import { storeValidationRules } from "../middlewares/validation";
import { createHandler } from "../utils/routeHandler";
import { handleValidationErrors } from "../middlewares/validationMiddleware";

const storeRouter = Router()

/**
 * @swagger
 * /stores:
 *   post:
 *     tags:
 *       - Stores
 *     summary: 新規店舗登録
 *     description: 新しい店舗情報を登録します。住所から緯度経度を自動計算して保存します。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       '201':
 *         description: 店舗が正常に作成されました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       '400':
 *         description: リクエストが無効です。
 *       '500':
 *         description: サーバーエラー。
 */
storeRouter.post('/', storeValidationRules, handleValidationErrors, createHandler(StoreController, "createStore"))

/**
 * @swagger
 * /stores/{id}:
 *   get:
 *     tags:
 *       - Stores
 *     summary: 店舗情報取得
 *     description: 指定されたIDの店舗情報を取得します。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *     responses:
 *       '200':
 *         description: 正常に店舗情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
storeRouter.get('/:id', createHandler(StoreController, 'getStoreById'))

/**
 * @swagger
 * /stores:
 *   get:
 *     tags:
 *       - Stores
 *     summary: 全店舗情報取得
 *     description: データベースに登録されている全ての店舗情報を取得します。
 *     responses:
 *       '200':
 *         description: 正常に全店舗情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Store'
 */
storeRouter.get('/', createHandler(StoreController, 'getStoresAll'))

/**
 * @swagger
 * /stores/{id}:
 *   put:
 *     tags:
 *       - Stores
 *     summary: 店舗情報更新
 *     description: 指定されたIDの店舗情報を更新します。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Store'
 *     responses:
 *       '200':
 *         description: 正常に店舗情報を更新しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Store'
 *       '400':
 *         description: リクエストが無効です。
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
storeRouter.put('/:id', storeValidationRules, handleValidationErrors, createHandler(StoreController, 'updateStore'))

/**
 * @swagger
 * /stores/{id}/close:
 *   patch:
 *     tags:
 *       - Stores
 *     summary: 店舗を閉店済みにする
 *     description: 指定された店舗の営業状態を「閉店」に変更します。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *     responses:
 *       '200':
 *         description: 正常に店舗を閉店済みにしました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
storeRouter.patch('/:id/close', createHandler(StoreController, 'storeClose'))

/**
 * @swagger
 * /stores/{id}/toppingcalls:
 *   get:
 *     tags:
 *       - Stores
 *     summary: 店舗のトッピングコール情報取得
 *     description: 指定された店舗のトッピングコール情報を取得します。
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *     responses:
 *       '200':
 *         description: 正常にトッピングコール情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                        topping_id:
 *                          type: integer
 *                        call_name:
 *                          type: string
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
storeRouter.get('/:id/toppingcalls', createHandler(StoreController, 'getStoreToppingCalls'))

/**
 * @swagger
 * /map:
 *   get:
 *     tags:
 *       - Map
 *     summary: 全店舗のマップ情報取得
 *     description: 全ての店舗の位置情報（緯度経度）を取得します。
 *     responses:
 *       '200':
 *         description: 正常にマップ情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Map'
 */
const mapRouter = Router()
mapRouter.get('/', createHandler(StoreController, 'getMapAll'))

export { storeRouter, mapRouter }