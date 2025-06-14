// packages/core/jest.config.js
module.exports = {
    // テスト環境
    testEnvironment: 'node',
    
    // テストファイルのパターン
    testMatch: [
      '**/tests/**/*.test.js',
      '**/__tests__/**/*.js'
    ],
    
    // カバレッジ設定
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
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
    
    // トランスフォーム設定（将来のTypeScript対応用）
    transform: {
      '^.+\\.js$': 'babel-jest'
    }
  };