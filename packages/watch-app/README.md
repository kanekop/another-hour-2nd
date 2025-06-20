# Another Hour Watch App

モバイルファーストで設計された、Another Hourのウォッチアプリケーションです。サーバー不要の静的PWA（Progressive Web App）として動作します。

## 特徴

- 📱 モバイル最適化されたインターフェース
- 🎯 デジタル/アナログ表示の切り替え
- 👆 タッチジェスチャー対応（スワイプで表示切替）
- 📲 PWA対応（ホーム画面に追加可能）
- 🌓 ダークモード/ライトモード自動切替
- 🔄 画面回転対応

## セットアップ

```bash
# 依存関係のインストール（リポジトリルートから）
npm install

# 開発モード（ファイルの変更を監視して自動ビルド）
npm run dev --workspace=@another-hour/watch-app

# publicディレクトリを配信するサーバーを起動（別ターミナルで）
npm run start --workspace=@another-hour/watch-app
```

## 使い方

1. `npm run dev`と`npm run start`をそれぞれ実行します。
2. ブラウザで `http://localhost:3000` にアクセスします。（`serve`のデフォルトポート）
3. モバイルデバイスでの使用を推奨します。
4. ホーム画面に追加してネイティブアプリのように使用できます。

## 操作方法

- **表示切替**: 右上のアイコンをタップ、または左右にスワイプ
- **フルスクリーン**: 左上のアイコンをタップ
- **画面回転**: デバイスを回転させると自動的にレイアウトが調整

## 技術スタック

- TypeScript
- @another-hour/core
- PWA (Progressive Web App)
- esbuild

## 開発

```bash
# 一度だけビルドする場合
npm run build --workspace=@another-hour/watch-app

# テストの実行
npm test --workspace=@another-hour/watch-app
``` 