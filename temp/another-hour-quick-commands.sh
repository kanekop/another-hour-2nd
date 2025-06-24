#!/bin/bash
# Another Hour プロジェクト - 次セッション用クイックコマンド集

# セッション開始時の状況確認
echo "=== Another Hour プロジェクト状況確認 ==="

echo "1. 開発サーバー状況確認"
echo "npm run dev"

echo "2. packages/core テスト状況確認"
echo "npm run test --workspace=@another-hour/core"

echo "3. packages/core ビルド確認"
echo "npm run build --workspace=@another-hour/core"

echo "4. 重複パッケージ存在確認"
echo "ls -la packages/@another-hour/"

echo "5. scheduler-web依存関係確認"
echo "cat packages/scheduler-web/package.json | grep time-design-core"

echo ""
echo "=== 推奨作業順序 ==="
echo "Priority 1: Jest設定修正"
echo "  - packages/core/jest.config.js の根本見直し"
echo "  - ESMモジュール解決の改善"
echo "  - TypeScript設定の最適化"

echo ""
echo "Priority 2: time-design-core削除"
echo "  - npm uninstall @another-hour/time-design-core --workspace=@another-hour/scheduler-web"
echo "  - rm -rf packages/@another-hour/time-design-core"
echo "  - 動作確認: npm run dev"

echo ""
echo "Priority 3: 品質向上"
echo "  - console.log削除 (src/TimeDesignManager.ts)"
echo "  - README.md更新"
echo "  - テストカバレッジ向上"

echo ""
echo "=== Jest設定修正のヒント ==="
echo "現在の問題: ESMとts-jestの設定競合でタイムアウト"
echo "修正方向性: preset: 'ts-jest' + moduleNameMapper設定"

echo ""
echo "=== 成功基準 ==="
echo "- テスト実行時間: 15秒以内"
echo "- TypeScriptエラー: ゼロ"
echo "- 重複コード削除: 1,797行"
echo "- アプリ動作: 全て正常"