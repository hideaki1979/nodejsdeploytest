import { FormattedToppingOptionNames } from "./toppingCallOption";

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

    // （トッピング・オプション）整形済名称リスト
    preCallFormatted: FormattedToppingOptionNames;
    postCallFormatted: FormattedToppingOptionNames;
}
