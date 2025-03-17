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
            console.log("トッピング情報：", results)
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
            console.log("コールオプション情報", results)
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
}