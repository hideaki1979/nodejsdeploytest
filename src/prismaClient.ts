import { PrismaClient } from '@prisma/client';

/**
 * Prismaクライアントのシングルトンインスタンス
 * アプリケーション全体で共有され、データベース操作の一貫性を保つ
 * コネクションプールを効率的に管理するために1つのインスタンスのみを使用
 */
const prisma = new PrismaClient({
    transactionOptions: {
        maxWait: 10000,  // トランザクション開始の最大待機時間（10秒）
        timeout: 60000   // トランザクション全体の最大実行時間（60秒）
    }
});

export default prisma;