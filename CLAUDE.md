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
├── packages/                    # 各アプリケーション・ライブラリ
│   ├── scheduler-web/          # メインWebアプリケーション（ポート3000）
│   ├── core/                   # コアライブラリ（TypeScript）
│   ├── website/                # 公式ウェブサイト（Astro）
│   ├── watch-app/              # ウォッチアプリ（TypeScript）
│   └── clock-web/              # Webクロックアプリ
├── docs/                       # プロジェクトドキュメント
│   ├── time-design-modes/      # Time Design Modes 仕様
│   ├── applications/           # 各アプリケーション詳細
│   └── specifications/         # 技術仕様書
├── dev-tools/                  # 開発ツール
│   └── time-design-test/       # Time Design テストUI
├── lerna.json                  # Lerna設定
├── package.json                # ルートパッケージ設定
└── tsconfig.json               # TypeScript設定
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

## 🚨 リファクタリング期間中の重要な制約事項

**背景**: [FixRequest.md調査報告書](./FixRequest.md)により、Time Design Modesの実装が3箇所で重複し、実装間の不整合が「動いていた部分が動かなくなる」問題の根本原因と判明。

### 📍 Time Design Modes実装の現状
**⚠️ 重要**: 以下の3箇所で異なる実装が存在します：

1. **`packages/core/src/modes/`** (TypeScript, 1497行)
   - ✅ **正式実装**: 最も完全で型安全な実装
   - ✅ **テスト済み**: 包括的なテストカバレッジ
   - ✅ **推奨**: 新機能開発時は必ずここを基準とする

2. **`packages/scheduler-web/public/js/time-design/modes/`** (JavaScript, 1242行)
   - ⚠️ **統合予定**: coreパッケージへの統合を計画中
   - ⚠️ **制約**: 新機能追加は一時停止

3. **`dev-tools/time-design-test/js/time-design/modes/`** (JavaScript, 1393行)
   - ⚠️ **実験的実装**: 独立したプロトタイプとして位置づけ
   - ⚠️ **制約**: 新機能追加は一時停止、バグ修正のみ

### 🚫 実施してはいけない作業

#### Time Design Modes関連
- **❌ `dev-tools/time-design-test/js/time-design/modes/` の修正**
  - 理由: 独立実装でありcoreとの統合が困難
  - 例外: 緊急のバグ修正のみ
  
- **❌ 新しいTime Design Modeの追加**
  - 理由: 3箇所すべてに実装が必要になる
  - 代替: packages/coreでのプロトタイプ開発を推奨

- **❌ 既存モードのパラメータ変更**
  - 理由: 実装間の整合性が取れなくなる
  - 代替: 十分な検証とすべての実装の同期更新が必要

#### アーキテクチャ関連
- **❌ dev-toolsの独立サーバー機能の拡張**
  - 理由: メインアプリとの分離が問題の原因
  - 代替: packages/scheduler-web内での機能統合を検討

### ✅ 推奨する作業

#### 安全な修正範囲
- **✅ UI/UXの改善** (`dev-tools/time-design-test/js/ui/`, `css/`)
- **✅ 表示・フォーマット関連** (`js/utils/formatters.js`)
- **✅ エラーハンドリングの改善**
- **✅ ドキュメントの更新**

#### 新機能開発
- **✅ packages/coreでの新機能開発**
- **✅ 型安全性を重視したTypeScript実装**
- **✅ テストファーストアプローチ**

### 🔧 緊急修正時のプロトコル

#### dev-tools修正時
1. **必須**: 修正理由と影響範囲を明記
2. **必須**: 以下のファイルのみ修正:
   - `js/ui/ConfigPanel.js` (UI更新)
   - `css/style.css` (スタイル調整)
   - `js/utils/` (ユーティリティ)
3. **禁止**: `js/time-design/modes/` の修正

#### 影響確認チェックリスト
- [ ] メインアプリ (`localhost:3000`) の動作確認
- [ ] dev-tools (`localhost:8080`) の動作確認
- [ ] 両環境での同一機能の一貫性確認

### 📋 リファクタリング進行状況

#### 完了済み
- **Phase 1** (短期): dev-tools仕様固定、ガイドライン作成 ✅ **2025年6月21日完了**
- **Phase 2** (中期): coreパッケージ統合、重複解消 ✅ **2025年6月21日完了**
  - packages/coreブラウザバンドル作成 ✅ (87.2kb ESMバンドル)
  - scheduler-web統合完了 ✅ (重複JavaScript削除)
  - dev-tools統合オプション追加 ✅ (core-integration.html)

#### 進行中
- **Phase 3** (長期): 統一アーキテクチャ完成 🔄
  - 統合テスト実行中
  - 残存制約の段階的解除

#### 制約解除状況
- **packages/core**: 全制約解除 ✅ 新機能開発可能
- **packages/scheduler-web**: 統合完了により制約緩和 ✅
- **dev-tools**: 実験的プロトタイプとして制約維持 ⚠️（統合オプション追加）

**次回マイルストーン**: 統合テスト完了後、全制約解除予定

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

---

**最終更新**: 2025年6月21日
**バージョン**: 1.3.0
**更新内容**: 
- Another Hour期間表示ロジック修正完了（残り時間→経過時間）
- HH:MM:SS/HH:MM:SS分数表示形式実装完了
- 全Time Designモードでの統一された実装
- UI/UXでのAnother Hour視覚的区別実装
- 優先タスク完了に伴うドキュメント更新