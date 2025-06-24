// packages/core/jest.config.js
module.exports = {
    // テスト環境
    testEnvironment: 'node',

    // TypeScript設定
    preset: 'ts-jest',

    // ルートディレクトリ
    rootDir: __dirname,

    // テストファイルのパターン
    testMatch: [
        '<rootDir>/tests/**/*.test.ts'
    ],

    // カバレッジ設定
    collectCoverage: false,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/index.ts',
        '!**/node_modules/**',
        '!src/types/**/*.ts',
    ],

    // レポーター設定
    coverageReporters: [
        'text',
        'text-summary'
    ],

    // テスト結果の表示設定
    verbose: true,

    // タイムアウト設定（ミリ秒）
    testTimeout: 5000,

    // モックのクリア設定
    clearMocks: true,
    restoreMocks: true,

    // トランスフォーム設定
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: {
                target: 'ES2020',
                module: 'commonjs',
                lib: ['ES2020'],
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: false,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: false,
                moduleResolution: 'node',
                resolveJsonModule: true,
                allowJs: true,
                noEmit: true,
                isolatedModules: true
            },
            isolatedModules: true,
            diagnostics: false
        }]
    },

    // ファイル拡張子の解決
    moduleFileExtensions: ['ts', 'js', 'json'],

    // モジュール名の解決
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },

    // パフォーマンス設定
    maxWorkers: 1,
    
    // キャッシュ無効
    cache: false,
    
    // Watch プラグイン無効
    watchPlugins: []
};