import dotenv from 'dotenv'
import path from 'path'

/**
 * .env を読み込む副作用モジュール。
 *
 * config/config.ts は import された時点で環境変数を検証するため、この読み込みは
 * それより先に完了していなければならない。dotenv.config() を server.ts の
 * import 文の間に「文」として置くとその順序に依存するが、import は
 * エディタの自動 import などで上に挿し込まれやすく、壊れても気づきにくい。
 * 副作用 import として切り出し、「server.ts の先頭で読む1行」に閉じ込める。
 *
 * quiet: true は必須。dotenv 17 から既定で
 * 「◇ injected env (N) from .env // tip: ...」というバナーを標準出力に出すようになった。
 * 本アプリは pino で構造化ログ(JSON)を出力するため、
 * 非JSONの行が混ざるとログ収集側のパースが壊れる。
 */
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true })
