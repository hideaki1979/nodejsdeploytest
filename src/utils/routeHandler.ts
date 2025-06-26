import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";
import { constructor as tSyringeConstructor } from "tsyringe/dist/typings/types";
import { AppError } from "../middlewares/errorMiddleware";

// コントローラーのメソッドの型を定義
type ControllerMethod = (req: Request, res: Response) => Promise<void | Response>

export function createHandler<T>(
    controller: tSyringeConstructor<T>,
    methodName: keyof T
) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const controllerInstance = container.resolve<T>(controller)
            // メソッドを安全にキャスト
            const method = controllerInstance[methodName]
            if (typeof method === 'function') {
                const result = (method as ControllerMethod).call(controllerInstance, req, res)
                if (result && typeof result.catch === 'function') {
                    result.catch(next)
                }
            } else {
                next(new AppError(`${String(methodName)}はコントローラに存在しません`, 500))
            }
        } catch (error) {
            next(error)
        }
    }
}