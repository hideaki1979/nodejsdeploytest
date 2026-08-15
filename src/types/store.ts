import { FormattedToppingOptionIds, FormattedToppingOptionNames } from "./toppingCallOption";
import { ValidationError } from "express-validator";
import { Store, Map, StoreToppingCall, Prisma } from "../generated/prisma/client";

/**
 * @swagger
 * components:
 *   schemas:
 *     Store:
 *       type: object
 *       required:
 *         - store_name
 *         - address
 *         - business_hours
 *         - regular_holidays
 *       properties:
 *         id:
 *           type: integer
 *           description: 店舗ID
 *         store_name:
 *           type: string
 *           description: 店舗名
 *         branch_name:
 *           type: string
 *           description: 支店名
 *         address:
 *           type: string
 *           description: 住所
 *         business_hours:
 *           type: string
 *           description: 営業時間
 *         regular_holidays:
 *           type: string
 *           description: 定休日
 *         prior_meal_voucher:
 *           type: boolean
 *           description: 事前食券購入の有無
 *         is_close:
 *           type: boolean
 *           description: 閉店フラグ
 *     Map:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: 店舗ID
 *         store_name:
 *           type: string
 *           description: 店舗名
 *         latitude:
 *           type: number
 *           format: float
 *           description: 緯度
 *         longitude:
 *           type: number
 *           format: float
 *           description: 経度
 *         is_close:
 *           type: boolean
 *           description: 閉店フラグ
 *   responses:
 *      StoreNotFound:
 *          description: 指定された店舗が見つかりません。
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
 *                    example: 店舗が見つかりません
 */

/**
 * 店舗データの型定義
 */
export type CallTiming = 'pre_call' | 'post_call';

/**
 * 店舗データの型定義
 */
export interface StoreData {
    store_name: string;
    branch_name?: string;
    address: string;
    business_hours: string;
    regular_holidays: string;
    prior_meal_voucher: boolean;
    topping_details?: string;
    call_details?: string;
    is_all_increased: boolean;
    is_lot: boolean;
    lot_detail?: string;
    topping_calls?: ToppingCallData[]; // トッピングコール配列を追加
    is_close?: boolean;
}

/**
 * ジオコーディングの結果型定義
 */
export interface GeocodingResult {
    latitude: number;
    longitude: number;
}

/**
 * トッピングコールデータのリクエスト型定義
 */
export interface ToppingCallData {
    topping_id: number;
    call_option_id: number;
    call_timing: CallTiming;
    noodle_type_id: number;
}

/**
 * 店舗別トッピングコールデータの型定義
 */
export interface StoreToppingCallData {
    store_id: number;
    topping_id: number;
    call_option_id: number;
    call_timing: CallTiming;
    noodle_type_id: number;
}

export interface StoreToppingCallFilter {
    callTiming?: CallTiming | 'all';
    toppingId?: number;
    call_option_id?: number;
    noodleTypeId?: number;
}

// （店舗詳細画面用）整形済店舗・トッピングコール情報
export interface FormattedToppingOptionNameStoreData {
    // StoreDataの店舗別トッピングコール情報以外の全プロパティ
    id: bigint | number;
    store_name: string;
    branch_name?: string | null;
    address: string;
    business_hours: string;
    regular_holidays: string;
    prior_meal_voucher: boolean;
    topping_details?: string | null;
    call_details?: string | null;
    is_all_increased: boolean;
    is_lot: boolean;
    lot_detail?: string | null;
    is_close?: boolean;

    // （トッピング・オプション）整形済名称リスト
    preCallFormatted: FormattedToppingOptionNames;
    postCallFormatted: FormattedToppingOptionNames;

    // （トッピング・オプション）整形済IDリスト
    preCallFormattedIds: FormattedToppingOptionIds;
    postCallFormattedIds: FormattedToppingOptionIds;
}

// =============================================================================
// Service Return Types (Prismaの型を活用)
// =============================================================================

// storeService.createStore の戻り値型
export interface StoreCreateServiceResult {
    store: Store;
    map: Map;
    storeToppingCalls: StoreToppingCall[];
}

// storeService.updateStore の戻り値型
export interface StoreUpdateServiceResult {
    store: Store;
    map: Map;
    storeToppingCalls: StoreToppingCall[];
}

// storeService.getStoreById の戻り値型
export type StoreByIdServiceResult = FormattedToppingOptionNameStoreData;

// storeService.getMapAll の戻り値型
export interface MapWithStoreInfo {
    id: bigint;
    latitude: Prisma.Decimal; // PrismaのDecimal型
    longitude: Prisma.Decimal; // PrismaのDecimal型
    store: {
        id: bigint;
        store_name: string;
        branch_name: string | null;
        address: string;
        is_close: boolean;
    };
}

export type MapsAllServiceResult = MapWithStoreInfo[];

// storeService.getStoresAll の戻り値型
export interface StoreBasicInfo {
    id: bigint;
    store_name: string;
    branch_name: string | null;
}

export type StoresAllServiceResult = StoreBasicInfo[];

// storeService.getStoreToppingCalls の戻り値型
export interface StoreToppingCallsServiceResult {
    id: number;
    store_name: string;
    branch_name: string | null;
    formattedToppingOptions: [number, {
        toppingId: number;
        toppingName: string;
        options: {
            optionId: number;
            optionName: string;
            storeToppingCallId?: number;
        }[];
    }][];
}

// storeService.storeClose の戻り値型
export type StoreCloseServiceResult = Store;

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

// storeController.createStore のレスポンス型
export interface StoreCreateControllerResponse extends BaseSuccessResponse {
    data: StoreCreateServiceResult;
}

// storeController.updateStore のレスポンス型
export interface StoreUpdateControllerResponse extends BaseSuccessResponse {
    data: StoreUpdateServiceResult;
}

// 店舗関連のエラーレスポンス型
export type StoreErrorResponse = BaseErrorResponse;
