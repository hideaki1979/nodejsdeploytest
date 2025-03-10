import prisma from "../prismaClient"
import { GeocodingService } from "./geocodingService"

/**
 * 店舗データの型定義
 */
interface StoreData {
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
}

/**
 * ジオコーディングの結果型定義
 */
interface GeocodingResult {
    latitude: number;
    longitude: number;
}

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
            const storeData: StoreData = {
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

            // map情報灯登録
            const map = await tx.map.create({
                data: {
                    store_id: store.id,
                    latitude: geocodingResult.latitude,
                    longitude: geocodingResult.longitude
                }
            })

            return { store, map }
        })
    }

    async getStoreById(storeId: number) {
        const store = await prisma.store.findUnique({
            where: {
                id: storeId
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