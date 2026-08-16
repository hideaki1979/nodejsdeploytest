import { ValidationError } from "express-validator";
import { Image, ImageStoreToppingCall } from "../generated/prisma/client";

/**
 * @swagger
 * components:
 *   schemas:
 *     ImageListItem:
 *       type: object
 *       description: |
 *         店舗画像一覧取得APIが返す画像情報（一覧表示用）。
 *         個別取得APIの ImageEditDetail とは ID の型もトッピング項目名も異なる点に注意。
 *         こちらは ID を Number() で数値化し、トッピングを表示名つきの topping_calls で返す。
 *       properties:
 *         id:
 *           type: integer
 *           description: 画像ID（Number変換済みのため数値）
 *         store_id:
 *           type: integer
 *           description: 関連する店舗のID（Number変換済みのため数値）
 *         user_id:
 *           type: string
 *           description: 投稿したユーザーのID
 *         menu_type:
 *           type: integer
 *           description: メニュータイプ
 *         menu_name:
 *           type: string
 *           description: メニュー名
 *         image_url:
 *           type: string
 *           description: 画像のURL
 *         topping_calls:
 *           type: array
 *           description: 紐づくトッピングコール。1件も無い場合はフィールドごと返却されない。
 *           items:
 *             type: object
 *             properties:
 *               topping_id:
 *                 type: integer
 *                 description: トッピングID（Number変換済みのため数値）
 *               topping_name:
 *                 type: string
 *                 description: トッピング名
 *               call_option_id:
 *                 type: integer
 *                 description: コールオプションID（Number変換済みのため数値）
 *               call_option_name:
 *                 type: string
 *                 description: コールオプション名
 *     ImageEditDetail:
 *       type: object
 *       description: |
 *         店舗画像の個別取得APIが返す画像情報（更新画面用）。
 *         一覧取得APIの ImageListItem とは ID の型もトッピング項目名も異なる点に注意。
 *         こちらは ID を String() で文字列化し、更新リクエストにそのまま渡せる
 *         topping_selections（store_topping_call_id つき）で返す。
 *       properties:
 *         id:
 *           type: string
 *           description: 画像ID（String変換済みのため文字列）
 *         store_id:
 *           type: string
 *           description: 関連する店舗のID（String変換済みのため文字列）
 *         user_id:
 *           type: string
 *           description: 投稿したユーザーのID
 *         menu_type:
 *           type: integer
 *           description: メニュータイプ
 *         menu_name:
 *           type: string
 *           description: メニュー名
 *         image_url:
 *           type: string
 *           description: 画像のURL
 *         topping_selections:
 *           type: array
 *           description: 紐づくトッピングコール。1件も無い場合は空配列を返す。
 *           items:
 *             type: object
 *             properties:
 *               topping_id:
 *                 type: string
 *                 description: トッピングID（String変換済みのため文字列）
 *               call_option_id:
 *                 type: string
 *                 description: コールオプションID（String変換済みのため文字列）
 *               store_topping_call_id:
 *                 type: string
 *                 description: 店舗別トッピングコールID（String変換済みのため文字列）
 *     ImageWriteResult:
 *       type: object
 *       description: 画像アップロードAPIの data 部
 *       properties:
 *         imageId:
 *           type: string
 *           description: 画像ID（BigIntのため文字列で返却）
 *         imageUrl:
 *           type: string
 *           description: アップロードした画像の公開URL
 *     ImageUpdateResult:
 *       type: object
 *       description: 画像更新APIの data 部
 *       properties:
 *         imageId:
 *           type: string
 *           description: 画像ID（BigIntのため文字列で返却）
 *         imageUrl:
 *           type: string
 *           description: 画像の公開URL（image_base64 未指定時は更新前のURLをそのまま返す）
 *         imageUpdated:
 *           type: boolean
 *           description: 画像ファイル自体を差し替えたかどうか（image_base64 を指定した場合に true）
 *     ImageDeleteResult:
 *       type: object
 *       description: 画像削除APIの data 部
 *       properties:
 *         imageId:
 *           type: string
 *           description: 削除した画像ID（BigIntのため文字列で返却）
 *         deleted:
 *           type: boolean
 *           description: 削除に成功したかどうか
 *           example: true
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
