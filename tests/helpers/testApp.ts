import type { ErrorRequestHandler, Express, RequestHandler } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { container } from 'tsyringe'
import { createApp } from '../../src/app'
import { swaggerSpec } from '../../src/config/swagger'
import { GOOGLE_MAP_API_KEY, pinoLogger, PRISMA_CLIENT } from '../../src/di.token'
import { GeocodingService } from '../../src/services/geocodingService'
import { AppError } from '../../src/middlewares/errorMiddleware'
import logger from '../mocks/logger'
import { createPrismaMock, type PrismaMock } from './prismaMock'

type MiddlewareOptions = Parameters<typeof OpenApiValidator.middleware>[0]

export interface TestApp {
    app: Express
    prisma: PrismaMock
    /** 住所→緯度経度の変換。実物は Google Maps API を叩くため必ずモックする */
    geocoding: { geocodeAddress: jest.Mock }
}

/** ジオコーディングの既定の戻り値（storeService が latitude / longitude を使う） */
const DEFAULT_GEOCODING_RESULT = { latitude: 35.6812, longitude: 139.7671 }

/**
 * 契約テスト用のアプリを組み立てる。
 *
 * 本番と同じ createApp() を使い、差し替えるのは以下の3点のみ。
 *   - PrismaClient       … DI でモックへ（DBに接続しない）
 *   - Firebase / logger  … moduleNameMapper でモジュールごと（jest.config.ts）
 *   - OpenAPI バリデータ … ルーターの直前に挿入
 *
 * バリデータの import をここに閉じているのは、src 側から import すると
 * devDependency のままでは `npm ci --omit=dev` の本番ビルドが壊れるため。
 */
export function createTestApp(): TestApp {
    // テスト間で登録が漏れないよう毎回作り直す
    container.reset()

    const prisma = createPrismaMock()
    container.registerInstance(PRISMA_CLIENT, prisma)
    container.register(GOOGLE_MAP_API_KEY, { useValue: 'contract-test' })
    container.register(pinoLogger, { useValue: logger })

    // 実物は node-geocoder 経由で Google Maps API を叩くため、必ず差し替える
    const geocoding = { geocodeAddress: jest.fn(async () => DEFAULT_GEOCODING_RESULT) }
    container.registerInstance(GeocodingService, geocoding as unknown as GeocodingService)

    const validator = OpenApiValidator.middleware({
        apiSpec: swaggerSpec as MiddlewareOptions['apiSpec'],
        // spec が要求する項目・型・パラメータでリクエストが送れるか、
        // security の指定が実装の認証要否と食い違っていないかを検証する
        validateRequests: true,
        /**
         * レスポンス検証はここでは行わない。
         *
         * このミドルウェアは res.json() に渡されたシリアライズ前の JS オブジェクトを見るが、
         * 本プロジェクトは BigInt.prototype.toJSON の上書きで主キーを文字列化しているため、
         * 検証時点ではまだ BigInt のままで "must be string" と誤検知する。
         * 実際に送信されたボディの検証は tests/helpers/responseValidator.ts が担当する。
         */
        validateResponses: false,
    })

    /**
     * バリデータが投げるエラーは AppError ではないため、errorMiddleware に
     * 「サーバー内部で予期せぬエラー」へ丸められ、テストからは原因が読めない。
     * status とメッセージを保ったまま包み直す。
     * バリデータより後ろに置いた4引数のハンドラなので、その例外だけを拾う。
     */
    const surfaceValidationError: ErrorRequestHandler = (err, _req, _res, next) => {
        const status = (err as { status?: number }).status
        next(
            typeof status === 'number'
                ? new AppError(`OpenAPI リクエスト検証エラー: ${err.message}`, status)
                : err,
        )
    }

    // OpenApiRequestHandler は Express の RequestHandler より広い req 型を要求するため、
    // 実行時の互換性はあるが型としては代入できない。ここだけキャストする。
    const app = createApp({
        preRouteMiddleware: [...(validator as unknown as RequestHandler[]), surfaceValidationError],
    })

    return { app, prisma, geocoding }
}
