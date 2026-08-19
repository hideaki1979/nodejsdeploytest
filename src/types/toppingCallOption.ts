/**
 * トッピング・コールオプションまわりの型定義。
 *
 * レスポンスの形は src/schemas/*.schema.ts の zod スキーマが正で、
 * ここではそこから導出したものを再輸出する（理由は src/types/store.ts の冒頭を参照）。
 */
export type {
    CallOptionData,
    ResultToppingCall,
    ToppingData,
} from "../schemas/topping.schema";

export type {
    FormattedToppingOptionIds,
    FormattedToppingOptionNames,
} from "../schemas/store.schema";
