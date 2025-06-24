import { Request, Response } from "express";
import { ToppingService } from "../services/toppingService";
import { injectable } from "tsyringe";

@injectable()
export class ToppingController {

    constructor(private toppingService: ToppingService) { }

    async getToppingAll(req: Request, res: Response): Promise<void> {
        const results = await this.toppingService.getToppingAll()
        res.status(200).json({
            success: true,
            message: "トッピング情報を正常に取得できました",
            data: results
        })
    }

    async getCallOptionAll(req: Request, res: Response) {
        const results = await this.toppingService.getCallOptionAll()
        res.status(200).json({
            success: true,
            message: "コールオプション情報を正常に取得できました",
            data: results
        })
    }

    async getFormattedToppingCollOption(req: Request, res: Response) {
        const results = await this.toppingService.getFormattedToppingCollOption()
        res.status(200).json({
            success: true,
            message: "トッピング・コールオプション情報を正常に取得できました",
            data: results
        })

    }
}