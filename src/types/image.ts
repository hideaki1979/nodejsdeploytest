import { ValidationError } from "express-validator";
import { Image, ImageStoreToppingCall } from "../generated/prisma/client";

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 画像ID
 *         image_url:
 *           type: string
 *           description: 画像のURL
 *         user_id:
 *           type: string
 *           description: 投稿したユーザーのID
 *         store_id:
 *           type: integer
 *           description: 関連する店舗のID
 *         menu_type:
 *           type: integer
 *           description: メニュータイプ
 *         menu_name:
 *           type: string
 *           description: メニュー名
 *         topping_calls:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               topping_id:
 *                 type: integer
 *               topping_name:
 *                 type: string
 *               call_option_id:
 *                 type: integer
 *               call_option_name:
 *                 type: string
 *     ImageUpdate:
 *       type: object
 *       properties:
 *         image_url:
 *           type: string
 *           description: 画像の新しいURL
 *     ImageToppingSelection:
 *       type: object
 *       description: 画像に紐づけるトッピングコールの選択内容
 *       required:
 *         - topping_id
 *         - call_option_id
 *         - store_topping_call_id
 *       properties:
 *         topping_id:
 *           type: integer
 *           description: トッピングID
 *         call_option_id:
 *           type: integer
 *           description: コールオプションID
 *         store_topping_call_id:
 *           type: integer
 *           description: |
 *             店舗別トッピングコールID。
 *             バリデーションの検証対象には入っていないが、
 *             登録・更新時に BigInt へ変換して保存するため未指定にはできない。
 *     ImageUploadInput:
 *       type: object
 *       description: |
 *         店舗画像アップロードのリクエストボディ。
 *         投稿者ID（user_id）はなりすまし防止のためリクエストからは受け取らず、
 *         検証済みトークンのUIDをサーバー側で設定する。
 *       required:
 *         - store_id
 *         - menu_type
 *         - menu_name
 *         - image_base64
 *       properties:
 *         store_id:
 *           type: integer
 *           description: 店舗ID
 *         menu_type:
 *           type: integer
 *           description: メニュータイプ
 *         menu_name:
 *           type: string
 *           description: メニュー名
 *         image_base64:
 *           type: string
 *           description: |
 *             data URL形式のBase64画像データ。
 *             `data:image/(jpeg|png|gif|webp);base64,` で始まる必要がある。
 *           example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
 *         topping_selections:
 *           type: array
 *           description: 画像に紐づけるトッピングコールの配列（任意）
 *           items:
 *             $ref: '#/components/schemas/ImageToppingSelection'
 *     ImageUpdateInput:
 *       type: object
 *       description: |
 *         店舗画像更新のリクエストボディ。
 *         image_base64 のみ任意で、指定した場合だけ画像ファイルを差し替える。
 *         それ以外の必須項目はアップロード時と同じ。
 *       required:
 *         - store_id
 *         - menu_type
 *         - menu_name
 *       properties:
 *         store_id:
 *           type: integer
 *           description: 店舗ID
 *         menu_type:
 *           type: integer
 *           description: メニュータイプ
 *         menu_name:
 *           type: string
 *           description: メニュー名
 *         image_base64:
 *           type: string
 *           description: |
 *             data URL形式のBase64画像データ（任意）。
 *             未指定の場合は既存の画像URLを維持し、メニュー情報とトッピング選択のみ更新する。
 *           example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
 *         topping_selections:
 *           type: array
 *           description: 画像に紐づけるトッピングコールの配列（任意。指定すると既存の紐づけを置き換える）
 *           items:
 *             $ref: '#/components/schemas/ImageToppingSelection'
 *   responses:
 *      ImageNotFound:
 *          description: 指定された画像が見つかりません。
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  success:
 *                    type: boolean
 *                    example: false
 *                  error:
 *                    type: string
 *                    example: 画像が見つかりません
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// StoreImageUploadData インターフェースの追加
export interface StoreImageUploadData {
    store_id: number | string;
    // user_idは含めない。投稿者IDは検証済みトークンのUIDをサーバー側で設定する
    menu_type: number;
    menu_name: string;
    image_base64: string | null;
    topping_selections?: {
        topping_id: number | string;
        call_option_id: number | string;
        store_topping_call_id: number | string;
    }[]
}

// StoreImageDownloadData インターフェースの追加
export interface StoreImageDownloadData {
    id: number | string;
    store_id: number | string;
    user_id: string;
    menu_type: number | string;
    menu_name: string;
    image_url: string;
    topping_calls?: {
        topping_id: number | string;
        topping_name: string;
        call_option_id: number | string;
        call_option_name: string;
    }[];
}

// 店舗別画像更新画面用のインターフェース
export interface StoreImageEditData {
    id: number | string;
    store_id: number | string;
    user_id: string;
    menu_type: number | string;
    menu_name: string;
    image_url: string;
    topping_selections: {
        topping_id: number | string;
        call_option_id: number | string;
        store_topping_call_id: number | string;
    }[];
}

// =============================================================================
// Service Return Types (Prismaの型を活用)
// =============================================================================

// imageService.createImage の戻り値型
export interface ImageCreateServiceResult {
    image: Image;
    imageStoreToppingCalls: ImageStoreToppingCall[];
}

// imageService.getImageByStoreId の戻り値型
export type ImagesByStoreServiceResult = StoreImageDownloadData[];

// imageService.getImageByImageId の戻り値型  
export type ImageByIdServiceResult = StoreImageEditData;

// imageService.updateStoreImageService の戻り値型
export interface ImageUpdateServiceResult {
    image: Image;
    imageStoreToppingCalls: ImageStoreToppingCall[];
    imageUpdated: boolean;
}

// imageService.deleteStoreImageService の戻り値型
export interface ImageDeleteServiceResult {
    image: Image;
    deleted: boolean;
}

// =============================================================================
// Controller Response Types (APIレスポンス用)
// =============================================================================

// 成功レスポンスの基本型
interface BaseSuccessResponse {
    status: 'success';
    message: string;
}

// エラーレスポンスの基本型
interface BaseErrorResponse {
    status: 'error';
    message: string;
    errors?: ValidationError[];
}

// imageController.uploadStoreImage のレスポンス型
export interface ImageUploadControllerResponse extends BaseSuccessResponse {
    data: {
        imageId: string;
        imageUrl: string;
    };
}

// imageController.getStoreImages のレスポンス型
export interface ImagesByStoreControllerResponse extends BaseSuccessResponse {
    data: StoreImageDownloadData[];
}

// imageController.getImageByImageId のレスポンス型
export interface ImageByIdControllerResponse extends BaseSuccessResponse {
    data: StoreImageEditData;
}

// imageController.updateStoreImage のレスポンス型
export interface ImageUpdateControllerResponse extends BaseSuccessResponse {
    data: {
        imageId: string;
        imageUrl: string;
        imageUpdated: boolean;
    };
}

// 画像関連のエラーレスポンス型（404、500等）
export type ImageErrorResponse = BaseErrorResponse;
