import dotenv from "dotenv"
import path from "path"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// このスクリプトは単体で実行されるため、.env を自前で読み込む。
// Prisma 6 までは schema.prisma の env("DATABASE_URL") を Prisma が解決し、
// .env の読み込みも Prisma 側で行われていたが、
// Prisma 7 では接続をドライバアダプタで渡すため、いずれも自前で行う必要がある。
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    console.error("DATABASE_URL が環境変数として定義されていません")
    process.exit(1)
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

/**
 * テーブル存在確認用の型定義
 */
type TableExistsResult = {
    exists: boolean;
}

/**
 * PostgreSQLにトリガー関数とテーブルごとのトリガーを作成する
 * 各テーブルの更新時に自動的にupdated_atを現在時刻に設定する
 */
async function setupTriggers() {
    try {
        // Prismaの接続
        await prisma.$connect()
        // トランザクション内で実行して、エラー時にロールバックできるようにする
        await prisma.$transaction(async (tx) => {
            console.log('トリガー関数を作成します。')
            // トリガー関数の作成
            await tx.$executeRaw`
                CREATE OR REPLACE FUNCTION update_timestamp()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW; 
                END;
                $$ LANGUAGE plpgsql;
                `;

            // 各テーブルごとのトリガーの作成
            const tables: string[] = [
                'stores', 'maps', 'images', 'image_store_topping_calls',
                'toppings', 'call_options', 'noodle_types', 'store_topping_calls'
            ]
            for (const table of tables) {
                console.log(`テーブル "${table}"のトリガーを設定します。`)
                const triggerName = `update_${table}_timestamp`
                // テーブルの存在確認
                const tableExists = await tx.$queryRaw<TableExistsResult[]>`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables
                        WHERE table_schema = 'public'
                        AND table_name = ${table}
                    ) as exists;`

                if (!tableExists[0].exists) {
                    console.warn(`テーブル "${table}"が存在しないためスキップします。`)
                    continue
                }

                try {
                    // 存在する場合、既存のトリガーを削除
                    // 二重引用符を直接SQLクエリに含める
                    await tx.$executeRawUnsafe(`
                        DROP TRIGGER IF EXISTS "${triggerName}" ON "${table}";
                    `);
                    // 新しいトリガーを作成
                    await tx.$executeRawUnsafe(`
                        CREATE TRIGGER "${triggerName}"
                        BEFORE UPDATE ON "${table}"
                        FOR EACH ROW
                        EXECUTE FUNCTION update_timestamp();
                    `);
                    console.log(`テーブル "${table}"のトリガーが正常に作成されました。`)
                } catch (tableErr) {
                    console.error(`テーブル "${table}"のトリガーの設定中に失敗しました。`, tableErr)
                    throw tableErr
                }
            }
        })
        console.log('全てのトリガーが正常に作成されました。')
    } catch (error) {
        console.error('トリガーの作成に失敗しました。', error)
    } finally {
        await prisma.$disconnect()
    }
}

setupTriggers()
    .catch((error) => {
        console.error('トリガーの設定中にエラーが発生しました。', error)
        process.exit(1)
    })