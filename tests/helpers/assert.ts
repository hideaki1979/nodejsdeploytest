import type { Response } from 'supertest'
import { recordCoveredOperation } from './coverage'
import { findResponseViolations, type OperationRef } from './responseValidator'
import { formatOperation } from './specOperations'

function describeBody(res: Response): string {
    if (res.body && Object.keys(res.body).length > 0) return JSON.stringify(res.body, null, 2)
    return res.text ?? '(本文なし)'
}

/**
 * ステータスコードを検証する。
 *
 * リクエスト検証に失敗すると 400、想定外の例外は 500 になり、理由はボディに入る。
 * 素の `expect(res.status).toBe(200)` では「500 だった」しか出ず原因が読めないため、
 * 失敗時にボディごと出す。
 */
export function expectStatus(res: Response, expected: number): void {
    if (res.status === expected) return
    throw new Error(`HTTP ${expected} を期待しましたが ${res.status} でした。\n${describeBody(res)}`)
}

/** `application/json; charset=utf-8` → `application/json` */
function actualContentType(res: Response): string | undefined {
    const header = res.headers['content-type']
    if (typeof header !== 'string' || header === '') return undefined
    return header.split(';')[0].trim().toLowerCase()
}

/** JSON として解釈すべき Content-Type か（application/problem+json などの +json も含む） */
function isJsonContentType(contentType: string | undefined): boolean {
    return contentType === 'application/json' || contentType?.endsWith('+json') === true
}

/**
 * ステータスコード・Content-Type・レスポンスボディが spec を満たすことを検証する。
 *
 * 契約テストの中心となるアサーション。
 * ボディは res.text をパースしたもの（＝HTTPで実際に流れた内容）を使う。
 * Content-Type もテストの申告ではなく実際のレスポンスヘッダから採る。
 */
export function expectApiResponse(res: Response, operation: OperationRef): void {
    expectStatus(res, operation.status)

    const contentType = actualContentType(res)
    const body = isJsonContentType(contentType) ? JSON.parse(res.text) : res.text

    const violations = findResponseViolations(body, operation, contentType)
    if (violations.length === 0) {
        // 記録は全ての検証を通過した後に行う。
        // 先に記録すると、呼び出し側が例外を握り潰した場合
        // （検証器自体を検証するテストなど）に、失敗した検証が
        // 「網羅済み」として数えられてしまう。
        recordCoveredOperation(formatOperation(operation.method, operation.path))
        return
    }

    throw new Error(
        [
            `${operation.method.toUpperCase()} ${operation.path} のレスポンスが spec と一致しません:`,
            ...violations.map((v) => `  - ${v}`),
            `Content-Type: ${contentType ?? '(なし)'}`,
            '実際のレスポンス:',
            typeof body === 'string' ? body : JSON.stringify(body, null, 2),
        ].join('\n'),
    )
}
