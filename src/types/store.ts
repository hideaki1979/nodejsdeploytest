import { Prisma } from "../generated/prisma/client";
import type {
    FormattedToppingOptionIds,
    FormattedToppingOptionNames,
    StoreInput,
    StoreToppingCallInput,
} from "../schemas/store.schema";

/**
 * 店舗まわりの型定義。
 *
 * リクエストの形とレスポンスの形は src/schemas/store.schema.ts の zod スキーマが正で、
 * ここではそこから導出したものを再輸出する。手書きで別に持つと、
 * スキーマだけ直したときに型が古いまま残り、両者が黙って食い違う。
 * このファイルに残しているのは Prisma のスキーマから導く「サービスの戻り値」だけ。
 */

export type CallTiming = StoreToppingCallInput['call_timing'];

/** 店舗登録・更新のリクエストデータ */
export type StoreData = StoreInput;

/** トッピングコールデータのリクエスト型定義 */
export type ToppingCallData = StoreToppingCallInput;

/**
 * ジオコーディングの結果型定義
 */
export interface GeocodingResult {
    latitude: number;
    longitude: number;
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
