/**
 * zod スキーマから生成した OpenAPI spec を JSON ファイルへ書き出す。
 *
 * `/api-docs` は実行中のプロセスからしか参照できないため、
 * lint（@redocly/cli）や実ルートとの突き合わせに使える静的な成果物を作る。
 *
 * 使い方: npm run openapi:generate [出力先パス]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { bootstrapSpecEnv } from './specEnv'

// spec の生成はルート定義の require を伴うため、その前に環境を整える。
// import 文は巻き上げられて実行順を選べないため、swagger だけ動的に読み込む。
bootstrapSpecEnv()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { swaggerSpec } = require('../src/config/swagger') as typeof import('../src/config/swagger')

const DEFAULT_OUTPUT = 'openapi.json'

const outputPath = path.resolve(process.cwd(), process.argv[2] ?? DEFAULT_OUTPUT)

mkdirSync(path.dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`, 'utf8')

console.log(`OpenAPI spec を生成しました: ${path.relative(process.cwd(), outputPath)}`)
