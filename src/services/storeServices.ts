import { Prisma, StoreToppingCall } from "@prisma/client";
import prisma from "../prismaClient"
import { GeocodingResult, StoreData, StoreToppingCallFilter } from "../types/store";
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

        // トッピングコールをコールタイミングで分類
        const preToppingOptions = store.store_topping_calls.filter(pre => pre.call_timing === "pre_call")
        const postToppingOptions = store.store_topping_calls.filter(post => post.call_timing === "post_call")

        // データ整形用変数の構造体定義
        const preCallFormatted: Record<string, string[]> = {}
        const postCallFormatted: Record<string, string[]> = {}

        // 事前コールのデータ整形
        for (const preCall of preToppingOptions) {
            // 各配列のトッピング名・コールオプション名を取得
            const toppingName = preCall.topping?.topping_name
            const optionName = preCall.call_option?.call_option_name

            // 初回はデータ整形用変数の初期化を行う
            if (!preCallFormatted[toppingName]) {
                preCallFormatted[toppingName] = []
            }

            // トッピングコールが重複しなければコール内容を格納
            if (!preCallFormatted[toppingName].includes(preCall.call_option?.call_option_name)) {
                preCallFormatted[toppingName].push(optionName)
            }
        }

        // 着丼前のデータ整形
        for (const postCall of postToppingOptions) {
            // 各配列のトッピング名・コールオプション名を取得する
            const toppingName = postCall.topping.topping_name
            const optionName = postCall.call_option.call_option_name

            // 各トッピング配列の初回は初期化を行う
            if (!postCallFormatted[toppingName]) {
                postCallFormatted[toppingName] = []
            }

            // トッピング名のコールオプションが重複しなければ格納する
            if (!postCallFormatted[toppingName].includes(optionName)) {
                postCallFormatted[toppingName].push(optionName)
            }
        }
        // 元の店舗情報から店舗別トッピングコール情報を削除して格納する。
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { store_topping_calls: _, ...storeData } = store

        // 整形したデータをリターンする。
        return {
            ...storeData,
            preCallFormatted,
            postCallFormatted
        }
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

    /**
     * 全店舗情報（id、店舗名、支店名）を取得する
     * @returns 店舗情報のリスト
     */
    async getStoresAll() {
        // 店舗フィールドの選択オプション生成
        const stores = await prisma.store.findMany({
            select: {
                id: true,
                store_name: true,
                branch_name: true
            }
        })
        return stores
    }
    /**
 * 店舗別トッピングコール情報（事前コール／着丼前コール）を取得する
 * @returns 店舗トッピングコール情報
 */
    async getStoreToppingCalls(storeId: number, filters: StoreToppingCallFilter) {
        // 検索条件を動的に構築
        const callsWhereCondition: Prisma.StoreToppingCallWhereInput = {}

        // 各フィルター条件を追加
        if (filters?.callTiming && filters.callTiming !== 'all') {
            callsWhereCondition.call_timing = filters.callTiming
        }

        if (filters?.toppingId) {
            callsWhereCondition.topping_id = filters.toppingId
        }

        if (filters?.call_option_id) {
            callsWhereCondition.call_option_id = filters.call_option_id
        }

        if (filters?.noodleTypeId) {
            callsWhereCondition.noodle_type_id = filters.noodleTypeId
        }

        // 店舗別トッピングコール情報の事前コール選択オプション生成
        const storeToppingCalls = await prisma.store.findUnique({
            where: {
                id: storeId
            },
            select: {
                id: true,
                store_name: true,
                branch_name: true,
                store_topping_calls: {
                    where: callsWhereCondition,
                    select: {
                        id: true,
                        store_id: true,
                        topping_id: true,
                        call_option_id: true,
                        call_timing: true,
                        noodle_type_id: true,
                        topping: {
                            select: {
                                id: true,
                                topping_name: true,
                                topping_category: true
                            }
                        },
                        call_option: {
                            select: {
                                id: true,
                                call_option_name: true,
                                call_category: true
                            }
                        }
                    }
                }
            }
        })
        // console.log("シミュレーション店舗別トッピングコール情報：", preStoreToppingCalls)
        if (!storeToppingCalls) {
            throw new Error(`ID: ${storeId}の店舗は存在しません。`)
        }

        // console.log("storeToppingCalls：", JSON.stringify(storeToppingCalls, null, 2))

        // トッピングごとにオプションをグループ化するためのマップを作成
        const toppingOptionMap = new Map<number, {
            toppingId: number;
            toppingName: string;
            options: {
                optionId: number;
                optionName: string;
                storeToppingCallId?: number;
            }[]
        }>()

        // 各トッピングコール情報を処理
        for (const call of storeToppingCalls.store_topping_calls) {
            const toppingId = Number(call.topping_id)
            const toppingName = call.topping.topping_name
            const optionId = Number(call.call_option_id)
            const optionName = call.call_option.call_option_name
            const storeToppingCallId = call.id ? Number(call.id) : undefined

            // マップにトッピングが存在しない場合は新しく追加
            if (!toppingOptionMap.has(toppingId)) {
                toppingOptionMap.set(toppingId, {
                    toppingId,
                    toppingName,
                    options: []
                })
            }

            // オプションが重複しないように追加
            const toppingData = toppingOptionMap.get(toppingId)
            const optionExists = toppingData?.options.some(option => option.optionId === optionId)

            // 存在しない場合のみ追加
            if (!optionExists) {
                toppingData?.options.push({
                    optionId,
                    optionName,
                    // store_topping_call_idが undefined の場合は自動的にオプショナルフィールドとなる
                    ...(storeToppingCallId !== undefined && { storeToppingCallId })
                })
            }
            // console.log("toppingData：", toppingData)
            // console.log("toppingOptionMap:");
            // toppingOptionMap.forEach((value, key) => {
            //     console.log(`Key: ${key}`, value);
            // });
        }

        // Map内のデータを配列に変換して返却
        const formattedToppingOptions = Array.from(toppingOptionMap)
        // console.log("配列変換後データ：", JSON.stringify(formattedToppingOptions))

        // 店舗情報と整形したトッピングオプションを返却
        return {
            id: Number(storeToppingCalls.id),
            store_name: storeToppingCalls.store_name,
            branch_name: storeToppingCalls.branch_name,
            formattedToppingOptions: formattedToppingOptions
        }
    }
}