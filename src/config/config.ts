import { AppError } from '../middlewares/errorMiddleware';

/**
 * 環境変数が設定されていない場合にエラーをスローする関数
 * @param key 環境変数のキー
 * @returns 環境変数の値
 */
function getEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new AppError(`${key} が環境変数として定義されてません`, 500)
    }
    return value
}

/**
 * アプリケーション設定オブジェクト
 * アプリケーション全体で使用する設定値を集約
 */
const config = {
    // サーバー設定
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        nodeEnv: process.env.NODE_ENV || 'development'
    },
    // DB設定
    db: {
        databaseUrl: getEnv('DATABASE_URL')
    },
    // firebase設定
    firebase: {
        // Firebase設定
        storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
        // 本番環境では環境変数から直接JSONを、開発環境ではファイルパスを使用
        serviceAccount: process.env.NODE_ENV === 'production'
            ? getEnv('FIREBASE_CONFIG')
            : getEnv('GOOGLE_APPLICATION_CREDENTIALS'),
    },
    // Google Maps APIキー
    google: {
        mapsApiKey: getEnv('GOOGLE_MAPS_API_KEY'),
    },
    // Prisma
    prisma: {
        transactionMaxWait: Number(getEnv('PRISMA_TRANSACTION_MAX_WAIT')),
        transactionTimeout: Number(getEnv('PRISMA_TRANSACTION_TIMEOUT'))
    }
}

export default config;
