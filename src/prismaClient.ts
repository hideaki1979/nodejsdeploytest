import { PrismaClient } from '@prisma/client';

/**
 * Prismaクライアントのシングルトンインスタンス
 * アプリケーション全体で共有され、データベース操作の一貫性を保つ
 * コネクションプールを効率的に管理するために1つのインスタンスのみを使用
 */
const prisma = new PrismaClient();

export default prisma;