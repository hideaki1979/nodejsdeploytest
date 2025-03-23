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
