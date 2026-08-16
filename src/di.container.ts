import { container } from 'tsyringe'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'
import config from './config/config'
import logger from './config/logger'
import { GOOGLE_MAP_API_KEY, pinoLogger, PRISMA_CLIENT } from './di.token'

/**
 * DIコンテナへ本番用の依存を登録する（コンポジションルート）。
 *
 * app.ts から切り出しているのは、テストが同じ app を組み立てつつ
 * PrismaClient だけモックへ差し替えられるようにするため。
 * app.ts が PrismaClient を生成していると、import しただけで
 * DB接続の設定が走り、テストから差し替える余地が無くなる。
 */
export function registerProductionDependencies(): void {
    /**
     * PrismaClientのインスタンスをDIコンテナに登録
     * アプリケーション全体で単一のインスタンスを共有する
     *
     * Prisma 7 から datasource の url を schema.prisma に書けなくなったため、
     * 実行時の接続はドライバアダプタ経由で行う。
     * CLI（migrate / generate）側の接続情報は prisma.config.ts にある。
     */
    const adapter = new PrismaPg({ connectionString: config.db.databaseUrl })
    const prisma = new PrismaClient({
        adapter,
        transactionOptions: {
            maxWait: config.prisma.transactionMaxWait,  // トランザクション開始の最大待機時間（10秒）
            timeout: config.prisma.transactionTimeout   // トランザクション全体の最大実行時間（60秒）
        }
    })
    container.registerInstance(PRISMA_CLIENT, prisma)

    /**
     * Google Maps APIキーをDIコンテナに登録
     */
    container.register(GOOGLE_MAP_API_KEY, { useValue: config.google.mapsApiKey })

    // DIコンテナにロガーを登録
    container.register(pinoLogger, { useValue: logger })
}
