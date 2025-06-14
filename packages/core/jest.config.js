
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
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.ts',
      'src/**/*.js',
      '!src/index.ts',
      '!src/index.js',
      '!**/node_modules/**'
    ],
    
    // カバレッジ閾値
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    
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
      '^.+\\.(ts|tsx)$': 'ts-jest',
      '^.+\\.(js|jsx)$': 'babel-jest'
    },
    
    // ファイル拡張子の解決
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    
    // TypeScript設定ファイル
    globals: {
      'ts-jest': {
        tsconfig: 'tsconfig.json'
      }
    }
};
