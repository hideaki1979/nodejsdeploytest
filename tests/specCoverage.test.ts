import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { swaggerSpec } from '../src/config/swagger'

/**
 * spec の全オペレーションに契約テストがあることを確認する。
 *
 * これが無いと、エンドポイントを増やしたときにテストを書き忘れても誰も気づかない。
 * #81 のルート突き合わせで spec と実ルートの一致は保証されているため、
 * 「spec の全オペレーションを網羅している」＝「全エンドポイントを網羅している」になる。
 */

const OPENAPI_OPERATION_METHODS = new Set([
    'get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace',
])

/** expectApiResponse に渡された { method, path } を、テストのソースから拾う */
const ASSERTION_PATTERN = /method:\s*'([a-z]+)',\s*path:\s*'([^']+)'/g

function collectSpecOperations(): string[] {
    const paths = (swaggerSpec as { paths?: Record<string, Record<string, unknown>> }).paths ?? {}

    return Object.entries(paths).flatMap(([specPath, pathItem]) =>
        Object.keys(pathItem)
            .filter((key) => OPENAPI_OPERATION_METHODS.has(key.toLowerCase()))
            .map((method) => `${method.toUpperCase()} ${specPath}`),
    )
}

function collectTestedOperations(): Set<string> {
    const testsDir = __dirname
    const tested = new Set<string>()

    for (const file of readdirSync(testsDir).filter((name) => name.endsWith('.test.ts'))) {
        const source = readFileSync(path.join(testsDir, file), 'utf8')
        for (const [, method, specPath] of source.matchAll(ASSERTION_PATTERN)) {
            tested.add(`${method.toUpperCase()} ${specPath}`)
        }
    }
    return tested
}

describe('契約テストの網羅性', () => {
    it('spec の全オペレーションに対応するテストがある', () => {
        const tested = collectTestedOperations()
        const missing = collectSpecOperations()
            .filter((operation) => !tested.has(operation))
            .sort()

        expect(missing).toEqual([])
    })
})
