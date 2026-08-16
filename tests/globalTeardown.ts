import { readCoveredOperations } from './helpers/coverage'
import { listSpecOperations } from './helpers/specOperations'

/** globalTeardown が Jest から受け取る設定のうち、実行対象の絞り込みに関わる部分 */
interface GlobalConfigLike {
    testPathPatterns?: { patterns?: string[] }
    testNamePattern?: string
    onlyChanged?: boolean
}

/** テストの一部だけを実行しているか（絞り込み実行では網羅性を判定できない） */
function isFilteredRun(globalConfig: GlobalConfigLike): boolean {
    if (process.env.SKIP_SPEC_COVERAGE_CHECK === '1') return true
    if (globalConfig.onlyChanged === true) return true
    if (typeof globalConfig.testNamePattern === 'string' && globalConfig.testNamePattern !== '') return true
    return (globalConfig.testPathPatterns?.patterns?.length ?? 0) > 0
}

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
 * `npx jest tests/users.test.ts` のような絞り込み実行では当然通らないので、
 * その場合は自動的に判定を飛ばす。
 */
export default function globalTeardown(globalConfig: GlobalConfigLike): void {
    if (isFilteredRun(globalConfig)) return

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
            '（検証に失敗したオペレーションは網羅済みとして数えないため、'
            + '失敗しているテストがある場合はそちらを先に解消してください）',
        ].join('\n'),
    )
}
