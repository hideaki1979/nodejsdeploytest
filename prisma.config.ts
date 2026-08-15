// Prisma CLI（migrate / generate / studio）の設定ファイル。
//
// Prisma 7 から datasource の url を schema.prisma に書けなくなったため、
// Migrate が使う接続情報はここで指定する。
// 実行時（PrismaClient）の接続はドライバアダプタ経由で、src/app.ts 側で設定している。
//
// Prisma CLI は .env を自動で読み込まないため、明示的に読み込む必要がある。
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        // env('DATABASE_URL') ヘルパーは未定義だとその場で例外を投げるため使わない。
        // prisma generate は接続先を必要としないのに対し、CI には DATABASE_URL が無く、
        // ヘルパーを使うと generate の時点でビルドが落ちてしまう。
        //
        // 一方 datasource.url を省略すると prisma migrate 系が
        // 「datasource.url が必要」と言って動かなくなるため、キー自体は残す。
        // 実際にDBへ接続するコマンド（migrate など）で未設定なら、そこで失敗する。
        url: process.env.DATABASE_URL ?? '',
    },
})
