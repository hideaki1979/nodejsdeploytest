import { ValidationError } from "express-validator";
import { Image, ImageStoreToppingCall } from "@prisma/client";

// StoreImageUploadData インターフェースの追加
export interface StoreImageUploadData {
    store_id: number | string;
    user_id: string;
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
