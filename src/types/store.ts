import { FormattedToppingOptionIds, FormattedToppingOptionNames } from "./toppingCallOption";
import { ValidationError } from "express-validator";
import { Prisma } from "../generated/prisma/client";

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
 *     StoreWriteResult:
 *       type: object
 *       description: 店舗登録・更新APIが返す店舗情報（返却フィールドを明示的に限定している）
 *       properties:
 *         id:
 *           type: string
 *           description: 店舗ID（BigIntのため文字列で返却）
 *         store_name:
 *           type: string
 *           description: 店舗名
 *         branch_name:
 *           type: string
 *           nullable: true
 *           description: 支店名
 *         address:
 *           type: string
 *           description: 住所
 *         is_close:
 *           type: boolean
 *           description: 閉店フラグ
 *     StoreCloseResult:
 *       type: object
 *       description: 閉店APIが返す店舗情報（返却フィールドを明示的に限定している）
 *       properties:
 *         id:
 *           type: string
 *           description: 店舗ID（BigIntのため文字列で返却）
 *         store_name:
 *           type: string
 *           description: 閉店表記を付与した店舗名
 *         is_close:
 *           type: boolean
 *           description: 閉店フラグ
 *     MapWriteResult:
 *       type: object
 *       description: 店舗登録・更新APIが返すマップ情報（返却フィールドを明示的に限定している）
 *       properties:
 *         id:
 *           type: string
 *           description: マップID（BigIntのため文字列で返却）
 *         store_id:
 *           type: string
 *           description: 店舗ID（BigIntのため文字列で返却）
 *         latitude:
 *           type: string
 *           description: 緯度（Decimalのため文字列で返却）
 *         longitude:
 *           type: string
 *           description: 経度（Decimalのため文字列で返却）
 *     StoreToppingCallWriteResult:
 *       type: object
 *       description: 店舗登録・更新APIが返す店舗別トッピングコール情報（返却フィールドを明示的に限定している）
 *       properties:
 *         id:
 *           type: string
 *           description: 店舗別トッピングコールID（BigIntのため文字列で返却）
 *         store_id:
 *           type: string
 *           description: 店舗ID（BigIntのため文字列で返却）
 *         topping_id:
 *           type: string
 *           description: トッピングID（BigIntのため文字列で返却）
 *         call_option_id:
 *           type: string
 *           description: コールオプションID（BigIntのため文字列で返却）
 *         call_timing:
 *           type: string
 *           enum: [pre_call, post_call]
 *           description: コールタイミング
 *         noodle_type_id:
 *           type: string
 *           description: 麺種別ID（BigIntのため文字列で返却）
 *     StoreWriteResponseData:
 *       type: object
 *       description: 店舗登録・更新APIの data 部
 *       properties:
 *         store:
 *           $ref: '#/components/schemas/StoreWriteResult'
 *         map:
 *           $ref: '#/components/schemas/MapWriteResult'
 *         storeToppingCalls:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StoreToppingCallWriteResult'
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
// 書き込み系エンドポイントのレスポンス用 select 定義
//
// Prismaの行をそのまま返すと、テーブルにカラムを追加した時点で
// サービス層・コントローラを一切変更していないのにAPIの公開契約が変わってしまう。
// 返却するフィールドをここで明示し、スキーマ変更が公開契約へ波及しないようにする。
// 読み取り系（getMapAll / getStoresAll など）と同じ方針を書き込み系にも適用する。
// =============================================================================

// storeService.createStore / updateStore が返す店舗フィールド
export const storeWriteSelect = {
    id: true,
    store_name: true,
    branch_name: true,
    address: true,
    is_close: true
} satisfies Prisma.StoreSelect;

// storeService.createStore / updateStore が返すマップフィールド
export const mapWriteSelect = {
    id: true,
    store_id: true,
    latitude: true,
    longitude: true
} satisfies Prisma.MapSelect;

// storeService.createStore / updateStore が返す店舗別トッピングコールのフィールド
export const storeToppingCallWriteSelect = {
    id: true,
    store_id: true,
    topping_id: true,
    call_option_id: true,
    call_timing: true,
    noodle_type_id: true
} satisfies Prisma.StoreToppingCallSelect;

// storeService.storeClose が返す店舗フィールド
export const storeCloseSelect = {
    id: true,
    store_name: true,
    is_close: true
} satisfies Prisma.StoreSelect;

// =============================================================================
// Service Return Types (Prismaの型を活用)
// =============================================================================

export type StoreWriteResult = Prisma.StoreGetPayload<{ select: typeof storeWriteSelect }>;
export type MapWriteResult = Prisma.MapGetPayload<{ select: typeof mapWriteSelect }>;
export type StoreToppingCallWriteResult = Prisma.StoreToppingCallGetPayload<{ select: typeof storeToppingCallWriteSelect }>;

// storeService.createStore の戻り値型
export interface StoreCreateServiceResult {
    store: StoreWriteResult;
    map: MapWriteResult;
    storeToppingCalls: StoreToppingCallWriteResult[];
}

// storeService.updateStore の戻り値型
export interface StoreUpdateServiceResult {
    store: StoreWriteResult;
    map: MapWriteResult;
    storeToppingCalls: StoreToppingCallWriteResult[];
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
export type StoreCloseServiceResult = Prisma.StoreGetPayload<{ select: typeof storeCloseSelect }>;

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
