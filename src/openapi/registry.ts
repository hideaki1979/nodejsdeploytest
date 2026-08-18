import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'

/**
 * OpenAPI のコンポーネント・オペレーション定義を集約するレジストリ。
 *
 * スキーマ定義（src/schemas/*.schema.ts）とオペレーション定義（src/routes/*.ts）は
 * モジュールの import 時にここへ自分を登録する。
 * spec の組み立ては src/config/swagger.ts が行う。
 */
export const registry = new OpenAPIRegistry()
