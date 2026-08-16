import { rmSync } from 'node:fs'
import { COVERAGE_DIR } from './helpers/coverage'

/**
 * 前回実行の記録を消す。
 * 残しておくと、削除・無効化したテストの分が「網羅済み」として残り続ける。
 */
export default function globalSetup(): void {
    rmSync(COVERAGE_DIR, { recursive: true, force: true })
}
