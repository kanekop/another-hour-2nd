# @another-hour/clock-web

Another Hour プロジェクトの時刻表示を担当する、実験的なウェブインターフェースです。

## 🚀 現在のステータス

**TypeScriptへの移行が完了しました (Phase 1 & 2 完了)**

-   [x] 既存コードのパッケージ化
-   [x] フロントエンドとサーバーサイドのTypeScript化
-   [x] `esbuild` によるビルドプロセスの構築

現在は、ブラウザで `http://localhost:3001` でアクセスすることで、基本的な時計機能が動作します。

## ✨ 主な技術スタック

-   TypeScript
-   Express.js (サーバー)
-   esbuild (ビルドツール)
-   @another-hour/core (時刻計算コアロジック)

## 🛠️ 開発コマンド

### ビルド
すべてのTypeScriptコードをコンパイルし、実行可能なJavaScriptファイルを生成します。
```bash
npm run build --workspace=@another-hour/clock-web
```

### サーバー起動
ビルド後に生成されたファイルを使って、ローカルサーバーを起動します。
```bash
npm run start --workspace=@another-hour/clock-web
```

## 🎯 今後のステップ (Phase 3)

-   UI/UXの改善（設定画面の高度化など）
-   新機能（Time Design Modesなど）の追加
-   パフォーマンス最適化 