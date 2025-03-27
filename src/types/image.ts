export interface StoreImageUploadData {
    store_id: number | string;
    menu_type: number;
    menu_name: string;
    image_base64: string | null;
    topping_selections?: {
        topping_id: number | string;
        call_option_id: number | string;
        store_topping_call_id: number | string;
    }[]
}