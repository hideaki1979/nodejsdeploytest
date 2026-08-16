import { Router } from "express"
import { ImageController } from "../controllers/imageController"
import { imageGetValidationRules, imageListGetValidationRules, imageUpdateValidationRules, imageUploadValidationRules } from "../middlewares/imageValidation"
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
 *             $ref: '#/components/schemas/ImageUploadInput'
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
 *                 message:
 *                   type: string
 *                   example: 画像が正常にアップロードしました！
 *                 data:
 *                   $ref: '#/components/schemas/ImageWriteResult'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 *       '503':
 *         $ref: '#/components/responses/AuthServiceUnavailable'
 */
imageRouter.post('/', authenticateUser, imageUploadValidationRules, handleValidationErrors, createHandler(ImageController, 'uploadStoreImage'))
/**
 * @swagger
 * /stores/{storeId}/images:
 *   get:
 *     tags:
 *       - Images
 *     summary: 店舗画像一覧取得
 *     description: 指定された店舗の全ての画像を取得します。認証は不要です。
 *     security: []
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
 *                 message:
 *                   type: string
 *                   example: 店舗別画像情報を正常に取得できました。
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ImageListItem'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '404':
 *         $ref: '#/components/responses/StoreNotFound'
 */
imageRouter.get(`/`, imageListGetValidationRules, handleValidationErrors, createHandler(ImageController, 'getStoreImages'))
/**
 * @swagger
 * /stores/{storeId}/images/{imageId}:
 *   get:
 *     tags:
 *       - Images
 *     summary: 店舗画像の個別取得
 *     description: 指定された店舗IDと画像IDに一致する画像情報を1件取得します。認証は不要です。
 *     security: []
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
 *                 message:
 *                   type: string
 *                   example: 画像情報を正常取得しました
 *                 data:
 *                   $ref: '#/components/schemas/ImageEditDetail'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
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
 *             $ref: '#/components/schemas/ImageUpdateInput'
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
 *                 message:
 *                   type: string
 *                   example: 画像情報が正常に更新されました
 *                 data:
 *                   $ref: '#/components/schemas/ImageUpdateResult'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/ImageNotFound'
 *       '503':
 *         $ref: '#/components/responses/AuthServiceUnavailable'
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
 *                 message:
 *                   type: string
 *                   example: 画像が正常に削除されました
 *                 data:
 *                   $ref: '#/components/schemas/ImageDeleteResult'
 *       '400':
 *         $ref: '#/components/responses/ValidationError'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '403':
 *         $ref: '#/components/responses/Forbidden'
 *       '404':
 *         $ref: '#/components/responses/ImageNotFound'
 *       '503':
 *         $ref: '#/components/responses/AuthServiceUnavailable'
 */
imageRouter.delete(`/:imageId`, authenticateUser, imageGetValidationRules, handleValidationErrors, createHandler(ImageController, 'deleteStoreImage'))
export { imageRouter }