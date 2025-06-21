# Time Design Test UI

⚠️ **実験的プロトタイプ** - 開発者向けの包括的なTime Design Modesテストインターフェースです。

## 📋 実装ステータス: プロトタイプ仕様固定版

**最終仕様確定日**: 2025年6月21日  
**状態**: 実験的プロトタイプとして機能固定  
**制約**: 新機能追加は一時停止、バグ修正のみ許可

## ⚠️ 重要: アクセス方法

**推奨: メインサーバー経由でアクセス**

```
http://localhost:3000/dev-tools/time-design-test/
```

メインの開発サーバー（`npm run dev`）が自動的に`/dev-tools`ディレクトリを提供します。この方法では、最新のAnother Hour実装（HH:MM:SS/HH:MM:SS分数表示など）がすべて反映されます。

## クイックスタート

### 1. HTTPサーバーの起動（重要）
ブラウザのセキュリティポリシーにより、ローカルファイルから直接開くとモジュールのインポートがブロックされます。
以下のいずれかの方法でHTTPサーバーを起動してください：

#### 方法1: Python（推奨）
```bash
cd dev-tools/time-design-test
python -m http.server 8080
```

#### 方法2: Node.js
```bash
cd dev-tools/time-design-test
node start-server.js
```

#### 方法3: PowerShell（Windows）
```powershell
cd dev-tools/time-design-test
./start-server.ps1
```

### 2. ブラウザでアクセス
サーバー起動後、ブラウザで http://localhost:8080 にアクセス

### 3. 使い方
1. 左パネルからモードを選択
2. 設定を調整してリアルタイムで確認
3. デバッグ情報は右パネルで確認

## トラブルシューティング

### "Initializing..."で止まる場合
1. ブラウザのコンソール（F12）でエラーを確認
2. HTTPサーバー経由でアクセスしているか確認（file://ではなくhttp://）
3. test.htmlを開いて詳細なデバッグ情報を確認

## 詳細仕様
完全な技術仕様とUI/UX設計については、[こちらの仕様書](../../docs/ui-specifications/time-design-test-ui-spec.md)を参照してください。

## 主な機能
- 全モードの動作確認
- **Another Hour期間の分数表示テスト** (HH:MM:SS/HH:MM:SS形式)
- リアルタイムデバッグ
- パフォーマンス計測
- 設定のエクスポート/インポート

## 🆕 最新機能
- **Another Hour期間の新しい表示形式**: 0:00:00からのカウントアップ表示
- **視覚的な区別**: Another Hour期間の金色グラデーション表示
- **分数フォーマット**: 経過時間/総時間 (例: 01:30:00/02:00:00)

---

## 📖 プロトタイプ仕様書（固定版）

### アーキテクチャ概要
**独立実装**: `packages/core`とは独立したJavaScript実装  
**実装規模**: 1,393行（BaseMode.js:99, ClassicMode.js:197, CoreTimeMode.js:190, SolarMode.js:292, WakeBasedMode.js:189）  
**依存関係**: 外部ライブラリ（noUiSlider, moment.js）を使用

### 実装ファイル構成
```
dev-tools/time-design-test/
├── index.html                  # メインインターフェース
├── test.html                   # デバッグ用ページ
├── start-server.js            # Node.js HTTPサーバー
├── start-server.ps1           # PowerShell起動スクリプト
├── css/
│   └── style.css              # 1000行以上の統合CSS
├── js/
│   ├── main.js                # エントリーポイント
│   ├── core/
│   │   └── logger.js          # ログシステム
│   ├── time-design/
│   │   ├── TimeDesignManager.js
│   │   ├── ModeRegistry.js
│   │   └── modes/             # Time Design Modes実装
│   │       ├── BaseMode.js
│   │       ├── ClassicMode.js
│   │       ├── CoreTimeMode.js
│   │       ├── SolarMode.js
│   │       ├── SolarModeV2.js
│   │       └── WakeBasedMode.js
│   ├── ui/                    # UIコンポーネント
│   │   ├── ConfigPanel.js
│   │   ├── ModeSelector.js
│   │   ├── TimeDisplay.js
│   │   └── Timeline.js
│   └── utils/                 # ユーティリティ
│       ├── dom.js
│       ├── formatters.js
│       └── SolarTimeFormatter.js
└── docs/
    └── solar-time-formatter-test.md
```

### 実装特徴
1. **ES6モジュール**: すべてJavaScript ES6モジュールとして実装
2. **独立動作**: HTTPサーバー(port 8080)で独立動作可能
3. **リアルタイム更新**: setIntervalベースの1秒間隔更新
4. **設定永続化**: LocalStorageベースの設定保存
5. **デバッグ機能**: コンソールログとデバッグ情報表示

### Time Design Modes実装差異
#### vs packages/core (TypeScript版)
- **パラメータ名**: 基本的に同一だが、一部デフォルト値が異なる
- **計算ロジック**: 独自実装のため、微細な差異が存在する可能性
- **型安全性**: TypeScript版と異なり、実行時エラーの可能性

#### vs packages/scheduler-web (JavaScript版)  
- **実装規模**: dev-tools版が153行多い（より詳細な実装）
- **機能範囲**: テスト機能とデバッグ機能が追加
- **依存関係**: 異なる外部ライブラリを使用

### UI/UX仕様（固定）
#### メイン画面構成
- **左パネル**: Mode Selector（モード選択）
- **中央パネル**: TimeDisplay（時刻表示・タイムライン）
- **右パネル**: ConfigPanel（設定・デバッグ）

#### 色彩設計
- **Another Hour期間**: 金色グラデーション (#FFD700 → #FFA500)
- **通常期間**: 青系グラデーション (#4A90E2 → #357ABD)
- **状態インジケーター**: 緑(正常)・赤(エラー)・黄(警告)

#### アクセシビリティ対応
- **ARIA属性**: 適切なrole, aria-live設定
- **キーボード操作**: Tab navigations対応
- **セマンティック**: HTMLセマンティック要素使用

### 制約事項とガイドライン

#### 🚫 禁止事項
1. **モード実装の変更**: `js/time-design/modes/`内のファイル修正禁止
2. **新機能追加**: 新しいTime Design Modeの追加禁止
3. **アーキテクチャ変更**: ES6モジュール構造の変更禁止
4. **外部依存変更**: 現在の外部ライブラリ構成の変更禁止

#### ✅ 許可事項
1. **UI改善**: `js/ui/`、`css/style.css`の修正
2. **バグ修正**: 動作に影響するエラーの修正
3. **デバッグ強化**: ログ機能、エラーハンドリングの改善
4. **ドキュメント更新**: README、コメントの更新

#### 🔧 緊急修正プロトコル
修正前に以下を確認：
1. **影響範囲**: 修正がメインアプリに影響しないか
2. **テスト**: `http://localhost:8080`での動作確認
3. **整合性**: メインアプリ（`localhost:3000`）との機能一貫性

### 今後の統合計画
1. **Phase 2**: `packages/core`ブラウザバンドルとの統合
2. **Phase 3**: メインアプリへの機能統合と重複解消
3. **Phase 4**: 統一アーキテクチャへの完全移行

**統合完了予定**: 1-2ヶ月後  
**その後**: この独立実装は廃止予定