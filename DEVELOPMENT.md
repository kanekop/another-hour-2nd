# Another Hour 開発ガイド

## 🔴 重要: ローカル開発環境

### ポート設定
**開発サーバーは必ずポート3000で動作します**

```
http://localhost:3000
```

このポートは`packages/scheduler-web/server.js`でハードコードされています。

## クイックスタート

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動（ポート3000）
npm run dev
```

## 主要なURL

| 機能 | URL |
|------|-----|
| メインページ | http://localhost:3000 |
| Time Design Test UI | http://localhost:3000/dev-tools/time-design-test/ |
| クロック | http://localhost:3000/clock |
| スケジューラー | http://localhost:3000/scheduler |
| タイマー | http://localhost:3000/timer |
| ストップウォッチ | http://localhost:3000/stopwatch |

## ディレクトリ構造

```
another-hour/
├── packages/
│   ├── scheduler-web/    # メインWebアプリ（ポート3000）
│   └── core/            # コアライブラリ
├── dev-tools/
│   └── time-design-test/ # 開発用テストUI
└── docs/                # ドキュメント
```

## よくある質問

### Q: ポートを変更できますか？
A: 環境変数`PORT`で変更可能ですが、デフォルトは3000です。
```bash
PORT=8080 npm run dev  # ポート8080で起動
```

### Q: ポート3000が使用中です
A: 以下のコマンドで確認・終了してください：
```bash
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000
```

## 開発のヒント

1. **ブラウザのキャッシュ**: 開発中は無効化を推奨
2. **ホットリロード**: nodemonが自動的にサーバーを再起動
3. **デバッグ**: Chrome DevToolsを活用

## トラブルシューティング

### "EADDRINUSE: address already in use"エラー
ポート3000が既に使用されています。他のプロセスを終了するか、別のポートを指定してください。

### モジュールが見つからない
```bash
npm install  # プロジェクトルートで実行
```

## 連絡先

問題が発生した場合は、GitHubのIssueを作成してください。 