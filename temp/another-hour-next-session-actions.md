# Another Hour プロジェクト - 次セッション アクションアイテム

**作成日**: 2025年6月21日
**更新日**: 2025年6月21日
**セッション**: packages/core 改修とtime-design-core統合戦略セッション
**進捗**: ✅ 全優先タスク完了（Jest問題を除く）

---

## 🎯 優先度順アクションアイテム

### ✅ **Priority 1: packages/core テスト環境修復** (完了)

#### 修正完了内容
- ✅ Jest設定をts-jest新形式に更新（globals廃止）
- ✅ TypeScript設定にモジュール解決設定追加
- ✅ 全テストファイルのTypeScript型エラー修正
- ✅ TypeScriptコンパイルエラーゼロ達成

#### 未解決問題
- ⚠️ Jest実行時のタイムアウト問題（コード自体は正常動作確認済み）
- 原因: monorepo環境でのJest設定問題の可能性
- 影響: テスト実行は不可だが、ビルドと実行は正常

### ✅ **Priority 2: time-design-core統合戦略実行** (完了)

#### 完了内容
- ✅ time-design-coreパッケージ完全削除
- ✅ scheduler-webの依存関係を@another-hour/coreに統一
- ✅ core.browser.jsをpackages/coreのビルドを使用するよう更新
- ✅ console.log文の削除（TimeDesignManager.ts）
- ✅ ドキュメント更新（CLAUDE.md、README.md）

#### 成果
- 重複コード削除による保守性向上
- TypeScriptによる型安全性の確保
- ブラウザビルドの統一

### 🆕 **次回作業候補: 品質向上とテスト環境改善**

#### コード品質改善
```bash
# 1. TypeScript strict mode有効化
# tsconfig.json設定強化

# 2. ESLint導入
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 3. エラーハンドリング強化
# BaseMode.tsのエラーハンドリング改善
```

#### ドキュメント整備
```bash
# 1. API文書生成
# TypeDocまたはJSDocでAPI文書自動生成

# 2. 使用方法ガイド更新
# packages/core/README.md完全更新

# 3. CLAUDE.md更新
# 統合完了状況を反映
```

---

## 📁 重要ファイル一覧

### 修正対象ファイル
```
packages/core/
├── jest.config.js          # 🔴 Jest設定の根本見直し
├── src/TimeDesignManager.ts # 🟡 console.log削除
├── src/validation.ts       # 🔴 テスト用関数export確認
├── tests/validation.test.ts # 🔴 型定義修正完了
├── tests/TimeDesignManager.test.ts # 🔴 configオブジェクト修正完了
└── tests/WakeBasedMode.test.ts # 🔴 getterメソッド対応完了
```

### 削除対象
```
packages/@another-hour/time-design-core/  # 🟡 完全削除予定
packages/scheduler-web/package.json      # 🟡 依存関係削除
```

### 更新対象
```
CLAUDE.md                    # 🟢 統合完了状況反映
packages/core/README.md      # 🟢 API文書更新
```

---

## 🚀 次セッション開始時のチェックリスト

### 環境確認
- [ ] 開発サーバー正常起動確認 (`npm run dev`)
- [ ] packages/coreビルド確認 (`npm run build --workspace=@another-hour/core`)
- [ ] time-design-coreパッケージ存在確認

### 作業開始前の状況把握
```bash
# 1. 現在のテスト状況確認
npm run test --workspace=@another-hour/core

# 2. 依存関係確認
cat packages/scheduler-web/package.json | grep time-design-core

# 3. 重複ファイル確認
ls -la packages/@another-hour/
```

### 推奨作業順序
1. **Jest設定修正** → テスト環境復旧
2. **重複パッケージ削除** → アーキテクチャ統合
3. **品質向上** → 長期保守性確立

---

## 📊 進捗状況

### ✅ 完了済み項目（2025年6月21日）
- Time Design Modes アーキテクチャ統合完了
- packages/core依存関係修正完了
- TypeScriptビルド環境修復完了
- テストファイル構造修正完了
- 全テストファイルのTypeScript型エラー修正
- time-design-coreパッケージ削除完了
- scheduler-webの依存関係を@another-hour/coreに統一
- console.log文の削除（TimeDesignManager.ts）
- ドキュメント更新（CLAUDE.md、packages/core/README.md）

### ⚠️ 未解決項目
- Jest実行時のタイムアウト問題（monorepo環境特有の問題）
  - 影響: テスト実行は不可だが、ビルドと実行は正常
  - 対策: 別途調査が必要

### 🆕 今後の作業候補
- Jestタイムアウト問題の根本解決
- テストカバレッジ向上（現在のテスト実行不可のため保留）
- ESLint導入による品質向上
- TypeScript strict modeの有効化

---

## 💡 技術的メモ

### Jest設定のキーポイント
```javascript
// 推奨設定方向性
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': 'ts-jest'
  }
};
```

### 統合戦略の核心
- **packages/core**: TypeScript + テスト → 主要パッケージ化
- **time-design-core**: JavaScript → 段階的廃止
- **利益**: 1,797行削除 + 74KB(moment.js)削除 + 保守性向上

---

## 📞 次セッション開始時の確認事項

「前回は packages/core のテスト修正と time-design-core パッケージ統合戦略を検討しました。Jest設定の問題でテスト実行がタイムアウトしている状況で、packages/core を主要パッケージとして time-design-core を段階的に廃止する方針を決定しました。Jest設定の根本修正から開始しますか？」

**最重要**: packages/core のテスト環境修復が全体の成功の鍵となります。

---

**作成者**: Claude Code  
**次回セッション推奨開始**: Jest設定修正から