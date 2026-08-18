import { Image, ImageStoreToppingCall } from "../generated/prisma/client";
import type {
    ImageEditDetail,
    ImageListItem,
    ImageUpdateInput,
    ImageUploadInput,
} from "../schemas/image.schema";

/**
 * 店舗画像まわりの型定義。
 *
 * リクエストの形とレスポンスの形は src/schemas/image.schema.ts の zod スキーマが正で、
 * ここではそこから導出したものを再輸出する（理由は src/types/store.ts の冒頭を参照）。
 */

/** 画像アップロードのリクエストデータ（image_base64 は必須） */
export type StoreImageUploadData = ImageUploadInput;

/** 画像更新のリクエストデータ（image_base64 は任意） */
export type StoreImageUpdateData = ImageUpdateInput;

/** 店舗別画像一覧のレスポンスデータ */
export type StoreImageDownloadData = ImageListItem;

/** 店舗別画像更新画面用のレスポンスデータ */
export type StoreImageEditData = ImageEditDetail;

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
