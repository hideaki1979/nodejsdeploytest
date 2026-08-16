import { readCoveredOperations } from './helpers/coverage'
import { listSpecOperations } from './helpers/specOperations'

/**
 * spec の全オペレーションが、実際に実行されたテストで検証されたことを確認する。
 *
 * これが無いと、エンドポイントを増やしてテストを書き忘れても誰も気づかない。
 * #81 のルート突き合わせで spec と実ルートの一致は保証されているため、
 * 「spec の全オペレーションを網羅している」＝「全エンドポイントを網羅している」になる。
 *
 * テストファイルではなく globalTeardown に置いているのは、
 * 全ファイルの実行が終わるまで結果が揃わないため
 * （テストファイル同士の実行順は保証されない）。
 *
 * `-t` などでテストを絞り込んだ実行では当然この確認は通らない。
 * その場合は環境変数 SKIP_SPEC_COVERAGE_CHECK=1 で無効化する。
 */
export default function globalTeardown(): void {
    if (process.env.SKIP_SPEC_COVERAGE_CHECK === '1') return

    const covered = readCoveredOperations()
    const missing = listSpecOperations()
        .filter((operation) => !covered.has(operation))
        .sort()

    if (missing.length === 0) return

    throw new Error(
        [
            `spec に定義されているが契約テストで検証されていないオペレーションが ${missing.length}件 あります:`,
            ...missing.map((operation) => `  - ${operation}`),
            '',
            'tests/ 配下に expectApiResponse を使ったテストを追加してください。',
            '一部のテストだけを実行している場合は SKIP_SPEC_COVERAGE_CHECK=1 を指定してください。',
        ].join('\n'),
    )
}
