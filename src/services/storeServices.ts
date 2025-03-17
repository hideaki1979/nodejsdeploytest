import { StoreToppingCall } from "@prisma/client";
import prisma from "../prismaClient"
import { GeocodingResult, StoreData } from "../types/store";
import { GeocodingService } from "./geocodingService"

/**
 * 店舗情報に関するビジネスロジックを提供するサービスクラス
 */
export class StoreService {
    private geoCodingService: GeocodingService;
    constructor() {
        this.geoCodingService = new GeocodingService()
    }
    /**
   * 店舗情報とマップ情報を同時に登録する
   * トランザクションを使用してテーブルの整合性を担保する
   * @param data フロントエンドから受け取ったデータ
   * @returns 作成された店舗とマップ情報
   */
    async createStore(data: StoreData) {
        const geocodingResult: GeocodingResult
            = await this.geoCodingService.geocodeAddress(data.address)
        // トランザクション開始
        return await prisma.$transaction(async (tx) => {
            // 店舗データをセット
            const storeData: Omit<StoreData, 'topping_calls'> = {
                store_name: data.store_name,
                branch_name: data.branch_name,
                address: data.address,
                business_hours: data.business_hours,
                regular_holidays: data.regular_holidays,
                prior_meal_voucher: data.prior_meal_voucher,
                topping_details: data.topping_details,
                call_details: data.call_details,
                is_all_increased: data.is_all_increased,
                is_lot: data.is_lot,
                lot_detail: data.lot_detail
            }

            // 店舗情報登録
            const store = await tx.store.create({
                data: storeData
            })

            // map情報登録
            const map = await tx.map.create({
                data: {
                    store_id: store.id,
                    latitude: geocodingResult.latitude,
                    longitude: geocodingResult.longitude
                }
            })

            // 店舗別トッピングコール情報の登録
            let storeToppingCalls: StoreToppingCall[] = [];

            if (data.topping_calls?.length && data.topping_calls?.length > 0) {
                // map関数でPromiseの配列を作成し、Promise.allで並列実行
                storeToppingCalls = await Promise.all(
                    data.topping_calls.map(toppingCall =>
                        tx.storeToppingCall.create({
                            data: {
                                store_id: store.id,
                                topping_id: toppingCall.topping_id,
                                call_option_id: toppingCall.call_option_id,
                                call_timing: toppingCall.call_timing,
                                noodle_type_id: toppingCall.noodle_type_id
                            }
                        })
                    )
                )
            }
            return { store, map, storeToppingCalls }
        })
    }

    /**
     * 店舗IDに紐づく店舗情報と店舗別トッピングコール情報を取得する
     * @returns IDに紐づく店舗と店舗別トッピングコール情報
     */
    async getStoreById(storeId: number) {
        const store = await prisma.store.findUnique({
            where: {
                id: storeId
            },
            select: {
                // 店舗基本情報を取得（storesの取得項目を明示することでouter joinの形式になる。省略するとinner joinの形になる）
                id: true,
                store_name: true,
                branch_name: true,
                address: true,
                business_hours: true,
                regular_holidays: true,
                prior_meal_voucher: true,
                topping_details: true,
                call_details: true,
                is_all_increased: true,
                is_lot: true,
                lot_detail: true,
                // 関連情報を取得（store_topping_callsが存在しなくても店舗情報は返却される）
                store_topping_calls: {
                    select: {
                        store_id: true,
                        topping_id: true,
                        call_option_id: true,
                        call_timing: true,
                        noodle_type_id: true,
                        topping: {
                            select: {
                                id: true,
                                topping_category: true,
                                topping_name: true
                            }
                        },
                        call_option: {
                            select: {
                                id: true,
                                call_category: true,
                                call_option_name: true
                            }
                        },
                        noodle_type: {
                            select: {
                                id: true,
                                noodle_type_name: true
                            }
                        }
                    }
                }
            }
        })
        if (!store) {
            throw new Error(`ID: ${storeId} の店舗は見つかりませんでした`)
        }
        return store
    }

    /**
     * 全店舗情報とそれに紐づくマップ情報を取得する
     * @returns 店舗とマップ情報のリスト
     */
    async getMapAll() {
        // 店舗フィールドの選択オプション生成
        const mapWithStores = await prisma.map.findMany({
            select: {
                id: true,
                latitude: true,
                longitude: true,
                store: {
                    select: {
                        id: true,
                        store_name: true,
                        branch_name: true,
                        address: true
                    }
                }
            },
        })
        return mapWithStores

    }
}