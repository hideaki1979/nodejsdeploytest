import { appendFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * 契約テストが実際に検証したオペレーションを記録する。
 *
 * ソースを正規表現で走査する方式では、`it.skip` やコメントアウトをしても
 * 文字列が残るため「網羅済み」と判定されてしまい、
 * 防ぎたい書き忘れ・無効化をそのまま見逃す。実行された事実だけを根拠にする。
 *
 * Jest はテストファイルをワーカープロセスに分けて実行するためメモリを共有できない。
 * プロセスごとに別ファイルへ追記し（同一ファイルへの並行書き込みを避ける）、
 * globalTeardown で全ファイルを突き合わせる。
 */
export const COVERAGE_DIR = path.resolve(__dirname, '../../node_modules/.cache/openapi-contract-coverage')

export function recordCoveredOperation(operation: string): void {
    mkdirSync(COVERAGE_DIR, { recursive: true })
    appendFileSync(path.join(COVERAGE_DIR, `${process.pid}.txt`), `${operation}\n`, 'utf8')
}

export function readCoveredOperations(): Set<string> {
    let files: string[]
    try {
        files = readdirSync(COVERAGE_DIR)
    } catch {
        // 1件も記録されていない（テストが1つも実行されなかった）
        return new Set()
    }

    const covered = new Set<string>()
    for (const file of files) {
        const content = readFileSync(path.join(COVERAGE_DIR, file), 'utf8')
        for (const line of content.split('\n')) {
            if (line.trim() !== '') covered.add(line.trim())
        }
    }
    return covered
}
