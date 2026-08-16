import type { Config } from 'jest'

/**
 * 契約テスト（OpenAPI spec と実レスポンスの突き合わせ）用の設定。
 *
 * DBにもFirebaseにも接続しない。PrismaClient は DI で、
 * Firebase とロガーは moduleNameMapper でモックへ差し替える。
 */
const config: Config = {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],

    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
    },

    setupFiles: [
        // config/config.ts は import された時点で環境変数を検証するため、
        // どのモジュールより先に仮の値を入れる必要がある。
        '<rootDir>/tests/helpers/env.ts',
        // controller / service は tsyringe のデコレータを使う（src/server.ts と同じ理由）
        'reflect-metadata',
    ],

    moduleNameMapper: {
        // import 時に認証情報を読みに行くため、実体を読み込ませない。
        '^(.*)/config/firebase$': '<rootDir>/tests/mocks/firebase.ts',
        // 本物は pino-pretty の transport を使う。transport はワーカースレッドを立てるため、
        // Jest が終了できなくなる（open handle）。テストでは transport 無しの silent に差し替える。
        '^(.*)/config/logger$': '<rootDir>/tests/mocks/logger.ts',
    },

    // spec の全オペレーションが「実際に実行されたテスト」で検証されたかを、
    // 全ファイルの実行後に突き合わせる（テストファイル同士の実行順は保証されないため）。
    globalSetup: '<rootDir>/tests/globalSetup.ts',
    globalTeardown: '<rootDir>/tests/globalTeardown.ts',

    clearMocks: true,
    // 想定外の非同期処理が残っていないことを検知する
    detectOpenHandles: true,
}

export default config
