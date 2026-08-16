/**
 * PrismaClient のモック。
 *
 * DI（PRISMA_CLIENT トークン）で差し替えるため、controller と service は本物のまま動く。
 * #72 の乖離は `Number()` / `String()` の違いやエンベロープの形といった
 * controller・service 層で起きているので、モックするのは DB アクセスの一段だけに留める。
 *
 * モデルもメソッドもアクセスされた時点で jest.fn() を生やすため、
 * テストごとに必要な戻り値だけを設定すればよい。
 *   prisma.topping.findMany.mockResolvedValue([...])
 */

export type PrismaModelMock = Record<string, jest.Mock>

/**
 * モデル名でのアクセスは PrismaModelMock、`$transaction` は jest.Mock として扱う。
 * ユニオンにするとプロパティアクセスが解決できなくなるため交差型にしている。
 */
export type PrismaMock = Record<string, PrismaModelMock> & { $transaction: jest.Mock }

function createModelMock(): PrismaModelMock {
    const methods = new Map<string, jest.Mock>()

    return new Proxy({} as PrismaModelMock, {
        get(_target, property) {
            if (typeof property !== 'string') return undefined
            if (!methods.has(property)) methods.set(property, jest.fn())
            return methods.get(property)
        },
    })
}

export function createPrismaMock(): PrismaMock {
    const models = new Map<string, PrismaModelMock>()

    // service 側は `this.prisma.$transaction(async (tx) => ...)` の形で使うため、
    // コールバックには同じモックを渡す（tx.store.create などが同じ jest.fn を指す）。
    // mock を参照するので、生成後に実装を差し込む。
    const transaction = jest.fn()

    const mock = new Proxy({} as PrismaMock, {
        get(_target, property) {
            if (typeof property !== 'string') return undefined
            // await されたときにモックが thenable と誤認されると処理が止まるため明示的に外す
            if (property === 'then') return undefined
            if (property === '$transaction') return transaction
            if (!models.has(property)) models.set(property, createModelMock())
            return models.get(property)
        },
    })

    transaction.mockImplementation(async (arg: unknown) =>
        typeof arg === 'function'
            ? await (arg as (tx: PrismaMock) => unknown)(mock)
            : await Promise.all(arg as unknown[]),
    )

    return mock
}
