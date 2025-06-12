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