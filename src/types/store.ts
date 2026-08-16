import { FormattedToppingOptionIds, FormattedToppingOptionNames } from "./toppingCallOption";
import { ValidationError } from "express-validator";
import { Prisma } from "../generated/prisma/client";

/**
 * @swagger
 * components:
 *   schemas:
 *     StoreToppingCallInput:
 *       type: object
 *       description: 店舗登録・更新時に指定する店舗別トッピングコール
 *       required:
 *         - topping_id
 *         - call_option_id
 *         - call_timing
 *         - noodle_type_id
 *       properties:
 *         topping_id:
 *           type: integer
 *           description: トッピングID
 *         call_option_id:
 *           type: integer
 *           description: コールオプションID
 *         call_timing:
 *           type: string
 *           enum: [pre_call, post_call]
 *           description: コールタイミング
 *         noodle_type_id:
 *           type: integer
 *           description: 麺種別ID
 *     StoreInput:
 *       type: object
 *       description: |
 *         店舗登録・更新のリクエストボディ。
 *         緯度経度は address から自動計算するため、リクエストでは指定しない。
 *         id は登録時に採番され、is_close は閉店APIでのみ更新するため、いずれも入力項目ではない。
 *       required:
 *         - store_name
 *         - address
 *         - business_hours
 *         - regular_holidays
 *         - prior_meal_voucher
 *         - is_all_increased
 *         - is_lot
 *       properties:
 *         store_name:
 *           type: string
 *           maxLength: 255
 *           description: 店舗名
 *         branch_name:
 *           type: string
 *           maxLength: 255
 *           nullable: true
 *           description: 支店名
 *         address:
 *           type: string
 *           maxLength: 255
 *           description: 住所（この値から緯度経度を自動計算する）
 *         business_hours:
 *           type: string
 *           maxLength: 255
 *           description: 営業時間
 *         regular_holidays:
 *           type: string
 *           maxLength: 255
 *           description: 定休日
 *         prior_meal_voucher:
 *           type: boolean
 *           description: 事前食券購入の有無
 *         is_all_increased:
 *           type: boolean
 *           description: 全マシの有無
 *         is_lot:
 *           type: boolean
 *           description: ロット制の有無
 *         topping_details:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 *           description: トッピング詳細
 *         call_details:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 *           description: コール詳細
 *         lot_detail:
 *           type: string
 *           maxLength: 1000
 *           nullable: true
 *           description: ロット制詳細
 *         topping_calls:
 *           type: array
 *           description: |
 *             店舗別トッピングコールの配列。
 *             更新時は指定した内容で全件置き換える（既存分を削除してから再登録する）。
 *           items:
 *             $ref: '#/components/schemas/StoreToppingCallInput'
 *     StoreListItem:
 *       type: object
 *       description: 全店舗情報取得APIが返す店舗情報（select で3項目に限定している）
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
 *     StoreDetail:
 *       type: object
 *       description: |
 *         店舗情報取得APIが返す店舗詳細。
 *         店舗別トッピングコールは、コールタイミングごとに整形した4つのフィールドで返る。
 *         is_close は select に含まれないため返却されない。
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
 *         business_hours:
 *           type: string
 *           description: 営業時間
 *         regular_holidays:
 *           type: string
 *           description: 定休日
 *         prior_meal_voucher:
 *           type: boolean
 *           description: 事前食券購入の有無
 *         topping_details:
 *           type: string
 *           nullable: true
 *           description: トッピング詳細
 *         call_details:
 *           type: string
 *           nullable: true
 *           description: コール詳細
 *         is_all_increased:
 *           type: boolean
 *           description: 全マシの有無
 *         is_lot:
 *           type: boolean
 *           description: ロット制の有無
 *         lot_detail:
 *           type: string
 *           nullable: true
 *           description: ロット制詳細
 *         preCallFormatted:
 *           $ref: '#/components/schemas/FormattedToppingOptionNames'
 *         postCallFormatted:
 *           $ref: '#/components/schemas/FormattedToppingOptionNames'
 *         preCallFormattedIds:
 *           $ref: '#/components/schemas/FormattedToppingOptionIds'
 *         postCallFormattedIds:
 *           $ref: '#/components/schemas/FormattedToppingOptionIds'
 *     FormattedToppingOptionNames:
 *       type: object
 *       description: トッピング名をキーに、選択できるコールオプション名の配列を持つオブジェクト
 *       additionalProperties:
 *         type: array
 *         items:
 *           type: string
 *       example:
 *         ニンニク: [マシ, マシマシ]
 *     FormattedToppingOptionIds:
 *       type: object
 *       description: トッピングIDをキーに、選択できるコールオプションIDの配列を持つオブジェクト
 *       additionalProperties:
 *         type: array
 *         items:
 *           type: integer
 *       example:
 *         '1': [1, 2]
 *     Map:
 *       type: object
 *       description: |
 *         マップ情報取得APIが返す位置情報。
 *         店舗情報はトップレベルではなく store にネストして返る。
 *       properties:
 *         id:
 *           type: string
 *           description: マップID（BigIntのため文字列で返却。店舗IDではない点に注意）
 *         latitude:
 *           type: string
 *           description: 緯度（Prisma の Decimal のため文字列で返却）
 *           example: '35.68123456'
 *         longitude:
 *           type: string
 *           description: 経度（Prisma の Decimal のため文字列で返却）
 *           example: '139.76712345'
 *         store:
 *           type: object
 *           description: 紐づく店舗情報
 *           properties:
 *             id:
 *               type: string
 *               description: 店舗ID（BigIntのため文字列で返却）
 *             store_name:
 *               type: string
 *               description: 店舗名
 *             branch_name:
 *               type: string
 *               nullable: true
 *               description: 支店名
 *             address:
 *               type: string
 *               description: 住所
 *             is_close:
 *               type: boolean
 *               description: 閉店フラグ
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
 *     StoreToppingCallOption:
 *       type: object
 *       description: 1トッピングに対して選択できるコールオプション
 *       properties:
 *         optionId:
 *           type: integer
 *           description: コールオプションID（Number変換済みのため数値）
 *         optionName:
 *           type: string
 *           description: コールオプション名
 *         storeToppingCallId:
 *           type: integer
 *           description: 店舗別トッピングコールID（Number変換済みのため数値）
 *     StoreToppingCallGroup:
 *       type: object
 *       description: トッピング単位でグループ化したコールオプション
 *       properties:
 *         toppingId:
 *           type: integer
 *           description: トッピングID（Number変換済みのため数値）
 *         toppingName:
 *           type: string
 *           description: トッピング名
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StoreToppingCallOption'
 *     StoreToppingCallsResult:
 *       type: object
 *       description: 店舗のトッピングコール情報取得APIが返す整形済みデータ
 *       properties:
 *         id:
 *           type: integer
 *           description: 店舗ID（Number変換済みのため数値）
 *         store_name:
 *           type: string
 *           description: 店舗名
 *         branch_name:
 *           type: string
 *           nullable: true
 *           description: 支店名
 *         formattedToppingOptions:
 *           type: array
 *           description: |
 *             `[トッピングID, トッピング情報]` の2要素タプルの配列。
 *             Map を Array.from() で変換したものをそのまま返しているため、
 *             オブジェクトの配列ではなくタプルの配列になる点に注意。
 *             OpenAPI 3.0 はタプルを表現できないため、要素の型は oneOf で示している。
 *           items:
 *             type: array
 *             minItems: 2
 *             maxItems: 2
 *             items:
 *               oneOf:
 *                 - type: integer
 *                   description: トッピングID
 *                 - $ref: '#/components/schemas/StoreToppingCallGroup'
 *           example:
 *             - - 1
 *               - toppingId: 1
 *                 toppingName: ニンニク
 *                 options:
 *                   - optionId: 1
 *                     optionName: マシ
 *                     storeToppingCallId: 10
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
