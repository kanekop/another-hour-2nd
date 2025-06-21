# dev-tools/time-design-test UX問題の調査結果レポート

## 調査概要

**調査者**: Another Hour技術アドバイザー  
**調査対象**: dev-tools/time-design-test/のUXが頻繁に動作しなくなる問題

## エグゼクティブサマリー

調査の結果、問題の主要な原因は**アーキテクチャの分離**と**コードの重複実装**にあることが判明しました。`dev-tools/time-design-test/`は独立した実験的実装として存在し、メインのパッケージ構造と統合されていないため、変更が相互に影響せず、一貫性が保てない状況です。

## 詳細な調査結果

### 1. ドキュメントの統合性の問題 ✅

**調査結果**: 部分的に該当

**証拠**:
- `docs/`配下に仕様書は存在するが、実装との紐付けが弱い
- `dev-tools/time-design-test/README.md`と`docs/ui-specifications/time-design-test-ui-spec.md`に重複・矛盾する記述
- 例: READMEではポート8080、仕様書では`/dev-tools/time-design-test/`パスでのアクセス

**影響度**: 中

### 2. UX仕様の不明確さ ⚠️

**調査結果**: 部分的に該当

**証拠**:
- Solar Modeの動作仕様に曖昧な部分が存在
  - 「日の出から日の入りまでの時間が表示される」→ 具体的なUI位置が不明
  - 「Day Hoursスライダーのデフォルト値に変わる」→ 変更タイミングが不明確
- Core Time Modeの表示仕様
  - 「朝のAH期間は通常速度（1.0x）だが、表示はCore Timeが始まるまでのカウントダウン表示とする」→ 暫定仕様として記載

**影響度**: 中

### 3. エージェントの限界 ❌

**調査結果**: 主因ではない

**分析**:
- 技術的な実装能力の問題ではない
- 構造的な問題（後述）により、正しい実装をしても統合性が保てない

**影響度**: 低

### 4. Coreの基本機能と統合の問題 ✅✅

**調査結果**: **これが最も重要な原因**

**証拠**:
```javascript
// packages/core/src/time-calculation.js
export function convertToAHTime(realTime, designed24Start, designed24Duration) {
  // 基本的な時間計算のみ
}

// dev-tools/time-design-test/js/time-design/modes/BaseMode.js
export class BaseMode {
  // Time Design Modesの独自実装
}
```

**問題点**:
1. Time Design Modesの実装が2箇所に分散
   - `dev-tools/time-design-test/js/time-design/` （独自実装）
   - `packages/core/` （未実装）
2. dev-toolsは`@another-hour/core`を使用していない
3. 同じ機能が異なる実装で存在する可能性

**影響度**: 高

### 5. 開発環境の分離 ✅

**調査結果**: 重要な構造的問題

**証拠**:
- メインアプリ: `http://localhost:3000`
- dev-tools: `http://localhost:8080` または `/dev-tools/time-design-test/`
- 異なるサーバーで動作し、コードベースが独立

**問題点**:
1. 変更が相互に反映されない
2. テスト環境と本番環境で異なる実装
3. バージョン管理が困難

**影響度**: 高

### 6. その他の発見事項

**リファクタリングの必要性**:
- `dev-tools/time-design-test/css/style.css` - 1000行以上の巨大CSS
- インラインスタイルとCSSの混在
- モジュール間の責任範囲が不明確

## 根本原因の分析

### 主要因
1. **アーキテクチャの分離** - dev-toolsが独立した実装として存在
2. **コードの重複** - 同じ機能が複数箇所に実装されている
3. **統合テストの欠如** - 変更の影響範囲を検証できない

### 副次的要因
1. ドキュメントの分散と不整合
2. 仕様の一部が曖昧
3. 開発プロセスの問題（エージェントへの指示が不明確）

## 推奨される解決策

### フェーズ1: 短期的対策（1-2週間）

#### 1.1 dev-toolsの仕様固定
- 現在の実装を「実験的プロトタイプ」として位置づけ
- 機能追加を一時停止し、バグ修正のみに限定
- 明確な仕様書を作成（現在の動作を正とする）

#### 1.2 エージェント向けガイドライン作成
```markdown
# dev-tools/time-design-test 修正ガイドライン

## 重要な注意事項
1. このツールは独立した実験的実装です
2. packages/core を使用していません
3. 以下のファイルのみを修正してください：
   - js/ui/ConfigPanel.js （UI更新）
   - css/style.css （スタイル調整）
4. モード実装（js/time-design/modes/）は変更しないでください
```

### フェーズ2: 中期的対策（1-2ヶ月）

#### 2.1 Time Design Modesのcore実装
```typescript
// packages/core/src/time-design-modes/index.ts
export interface TimeDesignMode {
  id: string;
  name: string;
  calculate(date: Date, config: ModeConfig): TimeResult;
  validate(config: ModeConfig): ValidationResult;
}

// 各モードを正式に実装
export { ClassicMode } from './classic';
export { CoreTimeMode } from './core-time';
export { WakeBasedMode } from './wake-based';
export { SolarMode } from './solar';
```

#### 2.2 dev-toolsのパッケージ化
```bash
packages/
├── core/
│   └── src/
│       └── time-design-modes/
├── time-design-test-ui/  # 新規パッケージ
│   ├── src/
│   │   ├── ui/          # UIコンポーネント
│   │   └── app.js       # エントリーポイント
│   └── package.json
```

### フェーズ3: 長期的対策（3-6ヶ月）

#### 3.1 統一されたドキュメント構造
```
docs/
├── architecture/
│   └── time-design-modes.md
├── api/
│   └── core-api.md
└── guides/
    ├── agent-instructions.md
    └── development-workflow.md
```

#### 3.2 自動テストの充実
- 統合テストスイートの作成
- UIテスト（Playwright等）の導入
- CI/CDパイプラインでの自動検証

## 結論

問題の根本原因は技術的な実装の問題ではなく、**アーキテクチャの分離**と**統合の欠如**にあります。短期的にはdev-toolsを安定化させ、中長期的には適切な統合を行うことで、「動いていた部分が動かなくなる」問題を根本的に解決できます。

## 次のアクション

1. **即座に実施**: エージェント向けガイドラインの作成と共有
2. **1週間以内**: dev-toolsの仕様固定と文書化
3. **1ヶ月以内**: Time Design Modesのcore実装開始
4. **3ヶ月以内**: 統合されたアーキテクチャへの移行完了

---

*このレポートは、Another Hourプロジェクトの技術的課題を解決するための指針として作成されました。定期的な見直しと更新を推奨します。*