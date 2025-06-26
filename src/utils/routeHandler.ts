import { NextFunction, Request, Response } from "express";
import { container } from "tsyringe";
import { constructor } from "tsyringe/dist/typings/types";

// コントローラーのメソッドの型を定義
type ControllerMethod = (req: Request, res: Response) => Promise<void | Response>

export function createHandler<T>(
    controller: constructor<T>,
    methodName: keyof T
) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const controllerInstance = container.resolve<T>(controller)
            // メソッドを安全にキャスト
            const method = controllerInstance[methodName] as unknown as ControllerMethod
            method.call(controllerInstance, req, res).catch(next)
        } catch (error) {
            next(error)
        }
    }
}