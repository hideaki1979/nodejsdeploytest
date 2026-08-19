import path from 'node:path'

/**
 * globalTeardown から OpenAPI spec を読み込むための下準備。
 *
 * spec は zod スキーマから生成するようになり、生成には src/routes/*.ts と
 * そこから芋づるに読み込まれる controller / service の require が要る。
 * ところが globalSetup / globalTeardown には jest.config.ts の
 * setupFiles も moduleNameMapper も適用されないため、テスト本体では
 * 効いている差し替えがここでは効かない。同等のことを自前で行う。
 */
export function bootstrapSpecModules(): void {
    // controller / service は tsyringe のデコレータを使う（src/app.ts と同じ理由）
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('reflect-metadata')

    // config/config.ts は import された時点で必須の環境変数を検証する
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('./env')

    // config/firebase.ts は import しただけで認証情報を読みに行くため、
    // require キャッシュへ空のモジュールを先に差し込んで実行を回避する。
    // tests/mocks/firebase.ts は使えない（jest.fn() を呼ぶが、
    // globalTeardown には jest のグローバルが無い）。
    // spec の生成は Firebase を一切呼ばないため、中身は空でよい。
    const firebasePath = require.resolve('../../src/config/firebase')
    if (require.cache[firebasePath]) return

    require.cache[firebasePath] = {
        id: firebasePath,
        filename: firebasePath,
        path: path.dirname(firebasePath),
        loaded: true,
        children: [],
        paths: [],
        exports: { auth: {}, bucket: {} },
    } as unknown as NodeJS.Module
}
