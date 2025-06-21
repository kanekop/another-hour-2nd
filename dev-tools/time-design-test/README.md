# Time Design Test UI

開発者向けの包括的なTime Design Modesテストインターフェースです。

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