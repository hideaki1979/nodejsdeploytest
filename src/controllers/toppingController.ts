import { Request, Response } from "express";
import { ToppingService } from "../services/toppingService";

export class ToppingController {
    private toppingService: ToppingService

    constructor() {
        this.toppingService = new ToppingService()
    }

    async getToppingAll(req: Request, res: Response): Promise<void> {
        try {
            const results = await this.toppingService.getToppingAll()
            res.status(200).json({
                status: "success",
                message: "トッピング情報を正常に取得できました",
                data: results
            })
        } catch (error) {
            console.error("トッピング情報取得エラー：", error)
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "トッピング情報取得中にエラーが発生しました。"
            })
        }
    }

    async getCallOptionAll(req: Request, res: Response) {
        try {
            const results = await this.toppingService.getCallOptionAll()
            res.status(200).json({
                status: "success",
                message: "コールオプション情報を正常に取得できました",
                data: results
            })
        } catch (error) {
            console.error("トッピング情報取得エラー：", error)
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "トッピング情報取得中にエラーが発生しました。"
            })
        }
    }

    async getFormattedToppingCollOption(req: Request, res: Response) {
        try {
            // console.log("API通ってます！")
            const results = await this.toppingService.getFormattedToppingCollOption()
            res.status(200).json({
                status: "success",
                message: "トッピング・コールオプション情報を正常に取得できました",
                data: results
            })

        } catch (error) {
            console.error("トッピング・コールオプション情報取得エラー：", error)
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "トッピング・コールオプション情報取得中にエラーが発生しました。"
            })
        }
    }
}