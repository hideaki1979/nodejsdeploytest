export interface ToppingData {
    id: number;
    topping_category: number;
    topping_name: string;
}

export interface CallOptionData {
    id: number;
    call_category: number;
    call_option_name: string;
}

export interface ResultToppingCall {
    topping: ToppingData;
    call_options: CallOptionData[];
}

export interface FormattedToppingOptionNames {
    [topping_name: string]: string[];
}