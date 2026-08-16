/**
 * @swagger
 * components:
 *   schemas:
 *     Topping:
 *       type: object
 *       description: 全トッピング情報取得APIが返すトッピング（Prismaの行をそのまま返している）
 *       properties:
 *         id:
 *           type: string
 *           description: トッピングID（BigIntのため文字列で返却）
 *         topping_name:
 *           type: string
 *           description: トッピング名
 *         topping_category:
 *           type: integer
 *           description: カテゴリID
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 作成日時
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 更新日時
 *     CallOption:
 *       type: object
 *       description: 全コールオプション取得APIが返すコールオプション（Prismaの行をそのまま返している）
 *       properties:
 *         id:
 *           type: string
 *           description: コールオプションID（BigIntのため文字列で返却）
 *         call_option_name:
 *           type: string
 *           description: コール名
 *         call_category:
 *           type: integer
 *           description: コールカテゴリ
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: 作成日時
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: 更新日時
 *     ResultToppingCall:
 *       type: object
 *       description: 1トッピングと、そのトッピングカテゴリに一致するコールオプションの組
 *       properties:
 *         topping:
 *           type: object
 *           description: トッピング情報（IDは Number 変換済みのため数値で返る）
 *           properties:
 *             id:
 *               type: integer
 *               description: トッピングID
 *             topping_category:
 *               type: integer
 *               description: トッピングカテゴリ
 *             topping_name:
 *               type: string
 *               description: トッピング名
 *         call_options:
 *           type: array
 *           description: トッピングカテゴリとコールカテゴリが一致するコールオプションの配列
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: コールオプションID
 *               call_category:
 *                 type: integer
 *                 description: コールカテゴリ
 *               call_option_name:
 *                 type: string
 *                 description: コールオプション名
 *     FormattedToppingCallOptionMap:
 *       type: object
 *       description: |
 *         トッピングIDを文字列にしたものをキーとするオブジェクト。配列ではない点に注意。
 *         キーの一覧は登録済みトッピングによって変動するため additionalProperties で表現している。
 *       additionalProperties:
 *         $ref: '#/components/schemas/ResultToppingCall'
 *       example:
 *         '1':
 *           topping:
 *             id: 1
 *             topping_category: 1
 *             topping_name: ニンニク
 *           call_options:
 *             - id: 1
 *               call_category: 1
 *               call_option_name: マシ
 *             - id: 2
 *               call_category: 1
 *               call_option_name: マシマシ
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