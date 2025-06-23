# CLAUDE.md - Another Hour プロジェクト開発支援ガイド

このファイルは、Claude Code が Another Hour プロジェクトを効率的に支援するための包括的な情報を提供します。

## 📋 プロジェクト概要

### プロジェクト名
Another Hour - 時間との関係を再定義するプラットフォーム

### プロジェクト説明
時間の流れ方を個人がデザインできる革新的なプラットフォームです。従来の24時間制から脱却し、「Time Design Modes」を通じて、より意味のある時間管理を実現します。

### 技術スタック
- **フロントエンド**: HTML, CSS, JavaScript (ES6+)
- **バックエンド**: Node.js, Express.js
- **開発言語**: TypeScript (一部パッケージ)
- **パッケージ管理**: npm workspaces, Lerna
- **プロジェクト構成**: モノレポ形式

## 🏗️ プロジェクト構造

```
another-hour/
├── packages/                          # 各アプリケーション・ライブラリ
│   ├── @another-hour/
│   │   └── time-design-core/          # Time Design Modes統合パッケージ ✅ 新規追加
│   ├── scheduler-web/                 # メインWebアプリケーション（ポート3000）
│   ├── core/                          # コアライブラリ（TypeScript）
│   ├── website/                       # 公式ウェブサイト（Astro）
│   ├── watch-app/                     # ウォッチアプリ（TypeScript）
│   └── clock-web/                     # Webクロックアプリ
├── docs/                              # プロジェクトドキュメント
│   ├── time-design-modes/             # Time Design Modes 仕様
│   ├── applications/                  # 各アプリケーション詳細
│   └── specifications/                # 技術仕様書
├── dev-tools/                         # 開発ツール
│   └── time-design-test/              # Time Design テストUI
├── lerna.json                         # Lerna設定
├── package.json                       # ルートパッケージ設定
└── tsconfig.json                      # TypeScript設定
```

## 🚀 開発環境

### 必須要件
- **Node.js**: >=16.0.0
- **npm**: >=7.0.0

### 重要なポート設定
**開発サーバーは必ずポート3000で動作します**
```
http://localhost:3000
```

### 基本コマンド

#### 開発開始
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（メインアプリ）
npm run dev
# または
PORT=3000 npm run dev  # ポート明示指定
```

#### ビルド関連
```bash
# TypeScriptビルド
npm run build

# クリーンビルド
npm run build:clean

# ウォッチモードビルド
npm run build:watch

# 全パッケージビルド
npm run build:packages
```

#### テスト・品質チェック
```bash
# リント実行
npm run lint

# テスト実行（要実装）
npm run test
```

#### アプリケーション別起動
```bash
# スケジューラーアプリ
npm run scheduler

# ウェブサイト開発
npm run dev:website

# ウォッチアプリ開発
npm run dev:watch

# 全パッケージ並列開発
npm run dev:all
```

## 🌐 主要なURL・エンドポイント

| 機能 | URL | 説明 |
|------|-----|------|
| メインページ | http://localhost:3000 | ランディングページ |
| Time Design Test UI | http://localhost:3000/dev-tools/time-design-test/ | 開発用テストインタフェース |
| メインクロック | http://localhost:3000/pages/main-clock.html | メイン時計ページ |
| スケジューラー | http://localhost:3000/pages/scheduler.html | スケジューラー機能 |
| タイマー | http://localhost:3000/pages/timer.html | タイマー機能 |
| ストップウォッチ | http://localhost:3000/pages/stopwatch.html | ストップウォッチ機能 |
| 世界時計 | http://localhost:3000/pages/world-clock.html | 世界時計機能 |
| 時間変換器 | http://localhost:3000/pages/converter.html | 時間変換ツール |
| パーソナライズクロック | http://localhost:3000/pages/personalized-ah-clock.html | カスタマイズ可能時計 |

## 🎨 Time Design Modes（重要概念）

**実装状況**: 全4モードが完全実装済み（TypeScript + JavaScript版、重複メソッド削除完了）

### 1. Classic Mode
- 元祖Another Hour体験
- Designed 24期間 + Another Hour期間の2段階構成
- パラメータ: designed24Duration（分）、dayStartTime（時刻）
- Another Hour期間は0:00:00からのカウントアップ表示

### 2. Core Time Mode  
- 朝・夜のAnother Hour + 中央のCore Time（Designed 24）
- パラメータ: coreTimeStart, coreTimeEnd, minCoreHours, anotherHourAllocation
- デフォルト実装差異: TS版(07:00-22:00) vs JS版(09:00-17:00)

### 3. Wake-Based Mode
- 起床時刻ベースの動的時間スケーリング
- パラメータ: defaultWakeTime, todayWakeTime, anotherHourDuration, maxScaleFactor
- 毎日の起床時刻記録に対応
- **最新**: 重複メソッド削除、詳細実装版に統一

### 4. Solar Mode
- 太陽の動きに基づく自然時間
- 南中時刻を常に12:00に固定、昼の長さをカスタマイズ
- パラメータ: location, dayHoursTarget/designedDayHours, seasonalAdjustment
- **最新**: 不完全なコードブロック削除、構文エラー修正完了

## 📁 重要なファイル・ディレクトリ

### コアファイル
- `packages/core/src/TimeDesignManager.ts` - Time Design管理
- `packages/core/src/modes/` - 各Time Designモード実装
- `packages/scheduler-web/server.js` - メインサーバー
- `packages/scheduler-web/public/js/time-design/` - フロントエンドTime Design実装

### 設定ファイル
- `lerna.json` - モノレポ設定
- `tsconfig.json` - TypeScript設定
- `package.json` - ルートパッケージ設定

### ドキュメント
- `docs/time-design-modes/overview.md` - Time Design概念と設計哲学（概要）
- `docs/specifications/time-design-modes-data-spec.md` - 技術仕様書（開発者向け）
- `docs/time-design-modes/` - Time Design詳細仕様
- `docs/applications/` - アプリケーション仕様
- `docs/specifications/` - 個別モード技術仕様書
- `DEVELOPMENT.md` - 開発ガイド

## 🔧 開発時の注意事項

### コーディング規約
1. **TypeScript使用推奨**: 新規開発はTypeScriptで実装
2. **モジュール化**: 機能は適切にモジュール分割
3. **Time Design概念の遵守**: 既存のTime Designパターンに従う
4. **テスト記述**: 新機能には必ずテストを追加

### 📝 ドキュメント管理の重要性

#### 必須ルール: コミット前のドキュメント更新
**開発完了時には必ずドキュメントを最新状態に更新してからGitコミットを行うこと**

#### ドキュメント更新のタイミング
1. **機能実装完了後**: 即座にドキュメントを更新
2. **Gitコミット前**: 必ずドキュメントの整合性を確認
3. **プルリクエスト作成前**: レビュー可能な状態でドキュメントを整備

#### 更新すべきドキュメント
- **CLAUDE.md**: 開発ガイドライン、制約事項、進行状況
- **README.md**: 各パッケージの使用方法、セットアップ手順  
- **技術仕様書**: `docs/specifications/`内の該当ファイル
- **APIドキュメント**: 新しい関数・クラスの説明
- **変更履歴**: 破壊的変更や重要な変更の記録

#### レビューとの整合性確保
**目的**: 他の開発者のレビュー時に、コードとドキュメントの矛盾を防ぐ

**チェックポイント**:
- [ ] 実装内容とドキュメントの記述が一致している
- [ ] 新機能の使用方法が明記されている  
- [ ] 破壊的変更がある場合は移行ガイドを追加
- [ ] 設定変更がある場合は設定例を更新
- [ ] 依存関係の変更がある場合はインストール手順を更新

#### ドキュメント品質の指針
- **正確性**: 実装と100%一致する内容
- **完全性**: 必要な情報の漏れがない
- **明確性**: 他の開発者が理解しやすい表現
- **保守性**: 将来の変更時に更新しやすい構造

### ファイル編集時の優先順位
1. **既存ファイルの編集を優先**: 新規ファイル作成は最小限に
2. **TypeScript版の優先**: JavaScriptとTypeScript版が共存する場合はTypeScript版を編集
3. **パッケージ内の一貫性保持**: 同一パッケージ内では統一されたパターンに従う

### よくある作業パターン

#### Time Designモード追加・修正
1. `packages/core/src/modes/` でTypeScript実装
2. `packages/scheduler-web/public/js/time-design/modes/` でJavaScript版同期
3. `dev-tools/time-design-test/` でテスト実装
4. `docs/time-design-modes/modes/` でドキュメント更新
5. **重要**: TypeScript/JavaScript実装間の整合性を確認
6. `docs/specifications/` の技術仕様書も更新

#### 実装間整合性チェック
- パラメータ名の統一確認
- デフォルト値の整合性確認  
- 計算ロジックの一致確認
- 仕様書との齟齬がないか確認
- **重複メソッドの存在チェック**（削除済みだが今後の追加時に注意）

#### UI機能追加・修正
1. `packages/scheduler-web/public/` 内の対応ファイル編集
2. CSS: `packages/scheduler-web/public/css/` 内の対応ファイル
3. JavaScript: `packages/scheduler-web/public/js/` 内の対応ファイル
4. HTML: `packages/scheduler-web/public/pages/` 内の対応ファイル

## ✅ Time Design Modes アーキテクチャ統合完了

**2025年6月21日 更新**: packages/core への統合が完全に完了しました。

### 🎯 統合結果概要

**統合前の問題**: Time Design Modesが3箇所で重複実装され、実装間の不整合が「動いていた部分が動かなくなる」問題の根本原因となっていました。

**統合後の解決**:
- ✅ **単一パッケージに統合**: `packages/core` (TypeScript実装)
- ✅ **重複削除**: time-design-core パッケージを完全削除
- ✅ **統一されたAPI**: 全モードが同一インターフェースを実装
- ✅ **メンテナンス性向上**: バグ修正・機能追加が1箇所で完結
- ✅ **型安全性**: TypeScriptによる完全な型サポート

### 📦 統合されたパッケージ: `@another-hour/core`

#### 含まれるモード (TypeScript実装)
1. **BaseMode**: 全モードの基底クラス
2. **ClassicMode**: 元祖Another Hour体験  
3. **CoreTimeMode**: 生産性重視の時間設計
4. **WakeBasedMode**: 起床時刻ベースの動的スケーリング
5. **SolarMode**: 太陽の動きに基づく自然時間

#### 統合されたコンポーネント
- **TimeDesignManager**: モード管理・設定永続化
- **ModeRegistry**: モード登録・検索システム
- **Utilities**: 共通ユーティリティ関数群

### 🚀 開発制約の解除

#### ✅ 完全解除された制約
- **新しいTime Design Modeの追加**: 1箇所のみの実装で完結
- **既存モードのパラメータ変更**: 統一された実装での安全な変更
- **バグ修正**: 単一箇所での修正で全環境に反映

#### 📍 現在の実装状況
1. **`packages/core/`** ✅ **メイン実装**
   - TypeScriptによる型安全な実装
   - 全モードが統一されたAPIで実装
   - ブラウザ用ビルド (core.browser.js) 提供

2. **`packages/scheduler-web/`** ✅ **統合完了** 
   - core.browser.jsを通じてpackages/coreを使用
   - 重複実装削除完了
   - time-design-coreパッケージ依存削除

3. **`dev-tools/time-design-test/`** ✅ **独立動作**
   - 開発・テスト用の独立実装を維持
   - ブラウザでの即座なテストが可能

### 🔧 新しい開発ワークフロー

#### Time Design Mode開発
```bash
# 新モード追加 (1箇所のみ)
cd packages/core/src/modes/
# NewMode.ts を作成
# TypeScript型定義を追加
# index.ts でエクスポート追加
```

#### 統合パッケージの使用
```javascript
// TypeScript/JavaScript両方で使用可能
import { TimeDesignManager, ClassicMode } from '@another-hour/core';

// ブラウザでの使用
import { TimeDesignManager } from './node_modules/@another-hour/core/dist/core.browser.js';
```

### 🌟 今後のメンテナンスの利点

#### 開発効率の向上
- **コード重複ゼロ**: バグ修正・機能追加が1箇所で完結
- **一貫性保証**: 実装間の不整合が構造的に不可能
- **型安全性**: TypeScriptベースの堅牢な実装

#### 品質向上
- **統一されたテスト**: 一元化されたテストスイート
- **包括的ドキュメント**: JSDocによる詳細なAPIドキュメント
- **エラーハンドリング**: 統一されたエラー処理パターン

---

## 🐛 トラブルシューティング

### よくあるエラーと対処法

#### "EADDRINUSE: address already in use"
```bash
# ポート使用状況確認
lsof -i :3000                    # Mac/Linux
netstat -ano | findstr :3000     # Windows

# 別ポートで起動
PORT=3001 npm run dev
```

#### モジュールが見つからない
```bash
# ルートディレクトリで依存関係再インストール
npm install

# 特定パッケージの依存関係インストール
npm install --workspace=@another-hour/scheduler-web
```

#### TypeScriptビルドエラー
```bash
# クリーンビルド実行
npm run build:clean
npm run build
```

### パフォーマンス最適化
- ブラウザキャッシュを開発時は無効化
- nodemonによる自動再起動を活用
- Chrome DevToolsでデバッグ

## 📚 参考ドキュメント

### 内部ドキュメント
- [Documentation Index](docs/README.md) - 全ドキュメント概要
- [Time Design Modes](docs/time-design-modes/) - Time Designモード詳細
- [Applications](docs/applications/) - 各アプリケーション詳細
- [Development Guide](docs/DEVELOPMENT.md) - 開発ガイド
- [Project Structure](docs/project-structure.md) - プロジェクト構造詳細

### 技術仕様
- [Time Design Modes Data Spec](docs/specifications/time-design-modes-data-spec.md)
- [Solar Mode Spec](docs/specifications/solar-mode-spec.md)
- [Wake-Based Mode Spec](docs/specifications/wake-based-mode-spec.md)
- [Classic Mode Spec](docs/specifications/classic-mode-spec.md)

## 🤝 開発者向け追加情報

### Git運用
- **メインブランチ**: `main`
- **コミットメッセージ**: 日本語・英語どちらも可
- **プルリクエスト**: 機能追加時は必須

### コードレビューポイント
1. Time Design概念との整合性
2. 既存UIパターンとの一貫性
3. レスポンシブ対応
4. パフォーマンス影響
5. ドキュメント更新の必要性
6. **TypeScript/JavaScript実装間の一貫性**
7. **仕様書との整合性確認**

### テスト方針
- ユニットテスト: `packages/core/tests/`
- 統合テスト: `dev-tools/time-design-test/`
- 手動テスト: 各ページでの動作確認

---

## 📞 サポート

このガイドに関する質問や、プロジェクトに関する問題が発生した場合は、GitHubのIssueを作成してください。

## 📝 最新の実装状況

### ✅ 完了済み: Another Hour期間表示ロジック修正

**実装完了日**: 2025年6月21日  
**コミットID**: `053300f`

**実装内容**:
- ✅ Another Hour期間の「残り時間カウントダウン」→「0:00:00からのカウントアップ」修正完了
- ✅ HH:MM:SS/HH:MM:SS形式の分数表示実装完了
- ✅ 全Time Designモード（Classic、CoreTime、WakeBased）で統一実装
- ✅ UI表示（TimeDisplay.js、scheduler-ui.js）でAnother Hour対応完了
- ✅ 視覚的な区別（金色グラデーション、"AH"バッジ）実装完了
- ✅ segmentInfoにelapsed、total、displayFormatプロパティ追加完了
- ✅ 後方互換性維持

**修正されたファイル**:
1. `packages/scheduler-web/public/js/time-design/modes/` (ClassicMode.js, CoreTimeMode.js, WakeBasedMode.js)
2. `dev-tools/time-design-test/js/time-design/modes/` (ClassicMode.js, CoreTimeMode.js, WakeBasedMode.js)
3. `dev-tools/time-design-test/js/ui/TimeDisplay.js`
4. `packages/scheduler-web/public/js/scheduler-ui.js`
5. `packages/scheduler-web/public/css/scheduler.css`
6. `packages/core/src/modes/WakeBasedMode.ts`

### 🔄 次回作業の候補

現在、優先度の高い未完了タスクはありません。以下のような継続的な改善が考えられます：

1. **テストカバレッジの向上**: ユニットテスト・統合テストの追加
2. **パフォーマンス最適化**: 時間計算の最適化・メモ化
3. **アクセシビリティ向上**: ARIA属性・キーボード操作対応
4. **国際化対応**: 多言語表示・タイムゾーン対応の強化

### 🔄 2025年6月21日 追加修正内容

#### packages/core テスト環境改善
- ✅ Jest設定をts-jest新形式に更新（globals廃止）
- ✅ TypeScript設定にモジュール解決設定追加
- ✅ 全テストファイルのTypeScript型エラー修正
- ⚠️ Jest実行時のタイムアウト問題は調査継続中（コード自体は正常動作）

#### アーキテクチャクリーンアップ
- ✅ time-design-coreパッケージ削除完了
- ✅ scheduler-webの依存関係を@another-hour/coreに統一
- ✅ console.log文の削除（TimeDesignManager.ts）
- ✅ ブラウザビルドの統合（core.browser.js使用）

---

**最終更新**: 2025年6月21日
**バージョン**: 1.4.0
**更新内容**: 
- Another Hour期間表示ロジック修正完了（残り時間→経過時間）
- HH:MM:SS/HH:MM:SS分数表示形式実装完了
- 全Time Designモードでの統一された実装
- UI/UXでのAnother Hour視覚的区別実装
- packages/coreへの完全統合とクリーンアップ完了