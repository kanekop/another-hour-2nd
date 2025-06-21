// packages/core/jest.config.js
module.exports = {
    // テスト環境
    testEnvironment: 'node',

    // TypeScript設定
    preset: 'ts-jest',

    // テストファイルのパターン
    testMatch: [
        '**/tests/**/*.test.ts',
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.ts',
        '**/__tests__/**/*.js'
    ],

    // カバレッジ設定
    collectCoverage: false, // 一時的に無効化
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        'src/**/*.js',
        '!src/index.ts',
        '!src/index.js',
        '!**/node_modules/**',
        '!src/types/**/*.ts',
    ],

    // カバレッジ閾値 (一時的に無効化)
    // coverageThreshold: {
    //     global: {
    //         branches: 10,
    //         functions: 10,
    //         lines: 10,
    //         statements: 10
    //     }
    // },

    // レポーター設定
    coverageReporters: [
        'text',
        'text-summary',
        'lcov',
        'html'
    ],

    // テスト結果の表示設定
    verbose: true,

    // エラー時の詳細表示
    errorOnDeprecated: true,

    // タイムアウト設定（ミリ秒）
    testTimeout: 10000,

    // モックのクリア設定
    clearMocks: true,
    restoreMocks: true,

    // トランスフォーム設定
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },

    // ファイル拡張子の解決
    moduleFileExtensions: ['ts', 'js', 'json'],

    // モジュール名の解決
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // TypeScript設定
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json'
        }
    }
};