/**
 * OpenAPI 拡張を適用済みの zod を提供する。
 *
 * extendZodWithOpenApi() は ZodType のプロトタイプへ `.openapi()` を生やす副作用があり、
 * スキーマを組み立てるより先に一度だけ実行されている必要がある。
 * 各スキーマが `zod` を直接 import すると、この初期化を通ったかどうかが
 * import 順に左右されるため、プロジェクト内では必ずこのモジュール経由で z を取得する。
 */
import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export { z }
