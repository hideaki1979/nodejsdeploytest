import { Router } from "express"
import { ImageController } from "../controllers/imageController"
import { imageGetValidationRules, imageUpdateValidationRules, imageUploadValidationRules } from "../middlewares/imageValidation"
import { authenticateUser } from "../middlewares/authMiddleware"
import { handleValidationErrors } from "../middlewares/validationMiddleware"
import { createHandler } from "../utils/routeHandler"

const imageRouter = Router({ mergeParams: true })

/**
 * @swagger
 * /stores/{storeId}/images:
 *   post:
 *     tags:
 *       - Images
 *     summary: 店舗画像のアップロード
 *     description: 指定された店舗に新しい画像をアップロードします。認証が必要です。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image_base64:
 *                 type: string
 *                 description: Base64エンコードされた画像データ
 *             required:
 *               - image_base64
 *     responses:
 *       '201':
 *         description: 画像が正常にアップロードされました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       '400':
 *         description: リクエストが無効です。
 *       '401':
 *         description: 認証されていません。
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
imageRouter.post('/', authenticateUser, imageUploadValidationRules, handleValidationErrors, createHandler(ImageController, 'uploadStoreImage'))
/**
 * @swagger
 * /stores/{storeId}/images:
 *   get:
 *     tags:
 *       - Images
 *     summary: 店舗画像一覧取得
 *     description: 指定された店舗の全ての画像を取得します。
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *     responses:
 *       '200':
 *         description: 正常に画像一覧を取得しました。
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
 *                     $ref: '#/components/schemas/Image'
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
imageRouter.get(`/`, imageGetValidationRules, handleValidationErrors, createHandler(ImageController, 'getStoreImages'))
/**
 * @swagger
 * /stores/{storeId}/images/{imageId}:
 *   get:
 *     tags:
 *       - Images
 *     summary: 店舗画像の個別取得
 *     description: 指定された店舗IDと画像IDに一致する画像情報を1件取得します。
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 画像ID
 *     responses:
 *       '200':
 *         description: 正常に画像情報を取得しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       '404':
 *         $ref: '#/components/responses/ImageNotFound'
 */
imageRouter.get(`/:imageId`, imageGetValidationRules, handleValidationErrors, createHandler(ImageController, 'getImageByImageId'))
/**
 * @swagger
 * /stores/{storeId}/images/{imageId}:
 *   put:
 *     tags:
 *       - Images
 *     summary: 画像情報の更新
 *     description: 指定された画像情報を更新します。認証が必要です。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 画像ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image_base64:
 *                 type: string
 *                 description: Base64エンコードされた新しい画像データ（オプション）
 *     responses:
 *       '200':
 *         description: 正常に画像情報を更新しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       '401':
 *         description: 認証されていません。
 *       '403':
 *         description: 権限がありません。
 *       '404':
 *         $ref: '#/components/responses/ImageNotFound'
 */
imageRouter.put(`/:imageId`, authenticateUser, imageUpdateValidationRules, handleValidationErrors, createHandler(ImageController, 'updateStoreImage'))
/**
 * @swagger
 * /stores/{storeId}/images/{imageId}:
 *   delete:
 *     tags:
 *       - Images
 *     summary: 店舗画像の削除
 *     description: 指定された画像を削除します。認証が必要です。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 店舗ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: 画像ID
 *     responses:
 *       '200':
 *         description: 正常に画像を削除しました。
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '401':
 *         description: 認証されていません。
 *       '403':
 *         description: 権限がありません。
 *       '404':
 *         $ref: '#/components/responses/ImageNotFound'
 */
imageRouter.delete(`/:imageId`, authenticateUser, imageGetValidationRules, handleValidationErrors, createHandler(ImageController, 'deleteStoreImage'))
export { imageRouter }