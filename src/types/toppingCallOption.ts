/**
 * @swagger
 * components:
 *   schemas:
 *     Topping:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: トッピングID
 *         topping_name:
 *           type: string
 *           description: トッピング名
 *         topping_category:
 *           type: integer
 *           description: カテゴリID
 *     CallOption:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: コールオプションID
 *         call_option_name:
 *           type: string
 *           description: コール名
 *         call_category:
 *           type: integer
 *           description: コールカテゴリ
 *     FormattedTopping:
 *       type: object
 *       properties:
 *         category_id:
 *           type: integer
 *           description: カテゴリID
 *         category_name:
 *           type: string
 *           description: カテゴリ名
 *         toppings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               topping_id:
 *                 type: integer
 *               topping_name:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     option_id:
 *                       type: integer
 *                     option_name:
 *                       type: string
 *
 */

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

export interface FormattedToppingOptionIds {
    [topping_id: number]: number[];
}