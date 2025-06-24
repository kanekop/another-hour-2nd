# Time Design Test UI

開発者向けの包括的なTime Design Modesテストインターフェースです。

## ⚠️ 重要: ローカル開発環境

**メインサーバーはポート3000で動作しています**

```
http://localhost:3000/dev-tools/time-design-test/
```

別途HTTPサーバーを起動する必要はありません。メインの開発サーバー（`npm run dev`）が自動的に`/dev-tools`ディレクトリを提供します。

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
- リアルタイムデバッグ
- パフォーマンス計測
- 設定のエクスポート/インポート