import { inject, injectable } from "tsyringe";
import { ResultToppingCall } from "../types/toppingCallOption";
import { PrismaClient } from "@prisma/client";

@injectable()
export class ToppingService {

    constructor(
        @inject('PrismaClient') private prisma: PrismaClient
    ) { }

    /**
     *  全てのトッピング情報を取得する
     * @returns トッピング情報のリスト
     */
    async getToppingAll() {
        const toppings = await this.prisma.topping.findMany()
        return toppings
    }

    /**
     *  全てのコールオプション情報を取得する
     * @returns コールオプション情報のリスト
     */
    async getCallOptionAll() {
        const callOptions = await this.prisma.callOption.findMany()
        return callOptions
    }

    /**
     * トッピングIDに対応するコールオプションを取得する
     * @returns トッピングIDをキーに、トッピング情報と紐づくコールオプションのリストをオブジェクトに格納した結果
     */
    async getFormattedToppingCollOption() {
        // 全てのトッピング情報を取得する
        const toppings = await this.prisma.topping.findMany({
            select: {
                id: true,
                topping_category: true,
                topping_name: true
            }
        })

        const callOptions = await this.prisma.callOption.findMany({
            select: {
                id: true,
                call_category: true,
                call_option_name: true
            }
        })

        // 結果を格納するオブジェクト
        const result: Record<string, ResultToppingCall> = {}

        // 各トッピングに紐づくオプションコールを設定する。
        for (const topping of toppings) {
            const toppingId = topping.id.toString()

            // トッピングカテゴリーとコールカテゴリーが一致するコールオプションをフィルタリング
            const matchCallOptions = callOptions
                .filter(option => option.call_category === topping.topping_category)
                .map(option => ({
                    id: Number(option.id),
                    call_category: option.call_category,
                    call_option_name: option.call_option_name
                }))

            result[toppingId] = {
                topping: {
                    id: Number(topping.id),
                    topping_category: topping.topping_category,
                    topping_name: topping.topping_name
                },
                call_options: matchCallOptions
            }
        }

        return result
    }
}