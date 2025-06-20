# Another Hour Scheduler Web

Another Hourプロジェクトのメインウェブアプリケーション

## 🚨 開発環境のポート設定

**開発サーバーは必ずポート3000で動作します**

```bash
npm run dev
# → http://localhost:3000
```

## 主なURL

- メインアプリ: http://localhost:3000
- Time Design Test UI: http://localhost:3000/dev-tools/time-design-test/
- クロック: http://localhost:3000/clock
- スケジューラー: http://localhost:3000/scheduler

## 開発方法

1. プロジェクトルートから実行:
   ```bash
   npm run dev
   ```

2. または、このディレクトリから:
   ```bash
   npm start
   ```

## トラブルシューティング

### ポート3000が使用中の場合
```bash
# Windowsの場合
netstat -ano | findstr :3000
# プロセスを終了してから再度実行

# macOS/Linuxの場合
lsof -i :3000
kill -9 <PID>
``` 