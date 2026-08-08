import { AppError } from '../middlewares/errorMiddleware';
import { parseIntWithValidation } from '../utils/env';

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
 * カンマ区切りの許可オリジン文字列を配列へ変換する
 * @param raw 環境変数の生値
 * @param required 本番など、1件以上の指定を必須とするか
 * @returns 許可オリジンの配列。未指定かつ required=false の場合は null（＝全許可）
 */
function parseOrigins(raw: string | undefined, required: boolean): string[] | null {
    const origins = (raw ?? '')
        .split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0)

    if (origins.length === 0) {
        // getEnv は空文字なら throw するが、"," のみのような実質空の値はすり抜けるためここでも弾く
        if (required) {
            throw new AppError('CORS_ALLOWED_ORIGINS に有効なオリジンが1件も指定されていません', 500)
        }
        return null
    }
    return origins
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
    // CORS設定
    cors: {
        // 本番では許可オリジンの明示を必須とする（未設定なら getEnv が起動時に throw）。
        // 開発では未設定を許容し、その場合は null = 全オリジン許可（従来どおりの挙動）。
        allowedOrigins: process.env.NODE_ENV === 'production'
            ? parseOrigins(getEnv('CORS_ALLOWED_ORIGINS'), true)
            : parseOrigins(process.env.CORS_ALLOWED_ORIGINS, false)
    },
    // Prisma
    prisma: {
        transactionMaxWait: parseIntWithValidation(getEnv('PRISMA_TRANSACTION_MAX_WAIT'), 'PRISMA_TRANSACTION_MAX_WAIT'),
        transactionTimeout: parseIntWithValidation(getEnv('PRISMA_TRANSACTION_TIMEOUT'), 'PRISMA_TRANSACTION_TIMEOUT')
    }
}

export default config;
