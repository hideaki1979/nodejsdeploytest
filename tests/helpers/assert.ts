import type { Response } from 'supertest'
import { findResponseViolations, type OperationRef } from './responseValidator'

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

/**
 * ステータスコードと、実際に送信されたレスポンスボディが spec を満たすことを検証する。
 *
 * 契約テストの中心となるアサーション。
 * ボディは res.text をパースしたもの（＝HTTPで実際に流れた内容）を使う。
 */
export function expectApiResponse(res: Response, operation: OperationRef): void {
    expectStatus(res, operation.status)

    const contentType = operation.contentType ?? 'application/json'
    const body = contentType === 'application/json' ? JSON.parse(res.text) : res.text

    const violations = findResponseViolations(body, operation)
    if (violations.length === 0) return

    throw new Error(
        [
            `${operation.method.toUpperCase()} ${operation.path} のレスポンスが spec と一致しません:`,
            ...violations.map((v) => `  - ${v}`),
            '実際のレスポンス:',
            JSON.stringify(body, null, 2),
        ].join('\n'),
    )
}
