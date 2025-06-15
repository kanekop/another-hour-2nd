# Another Hour - 時間との関係を再定義する

時間との関係を再定義するプラットフォーム。Another Hour時間システムを使用して、より意味のある時間管理を実現します。

## 🚀 ローカル開発

### ポート設定

`packages/scheduler-web/server.js` では `process.env.PORT || 5000` を使用しており、環境変数`PORT`が指定されていない場合はポート **5000** で起動します。

開発ドキュメントではポート3000を前提としているため、以下のように`PORT`を指定して起動してください。

```bash
PORT=3000 npm run dev
# サーバーは http://localhost:3000 で起動します
```

## プロジェクト構成

## What is Another Hour?

Another Hourは、時間の流れ方を個人がデザインできる革新的なプラットフォームです。

## Core Concepts

### Time Design Modes (NEW! 🎨)
- **Classic Mode**: The original Another Hour experience with a single, continuous scaled day.
- **Core Time Mode** - 活動時間の前後にAnother Hourを配置
- **Wake-Based Mode** - 起床時刻から始まる動的な24時間
- **Solar Mode** - 日の出・日の入りに同期した自然時間
[詳細 → docs/time-design-modes/](docs/time-design-modes/)

### Applications
- **Another Hour Clock** - 時間設計を体験する基本時計
- **Another Hour Scheduler** - カレンダーと統合した時間管理
- **Another Hour Timer/Stopwatch** - スケールされた時間での計測
[各アプリケーションの詳細 → docs/applications/](docs/applications/)

## Quick Start
```bash
# Clone the repository
git clone https://github.com/kanekop/another-hour-scheduler.git
cd another-hour-scheduler

# Install dependencies and run
npm install
npm start

# Open in browser
http://localhost:8080
```
*For detailed setup, see the [Development Setup Guide](docs/DEVELOPMENT.md).*

## Documentation
- [Time Design Modes](docs/time-design-modes/) - 時間設計モードの詳細
- [API Reference](docs/api/) - 開発者向けドキュメント
- [Applications](docs/applications/) - 各アプリケーションの詳細
- [Contributing Guidelines](docs/applications/scheduler.md#🤝-contributing) - プロジェクトへの貢献

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*© 2025 Another Hour Project. All Rights Reserved.*

### Project Structure

A detailed guide to the project's file and directory structure can be found in [`/docs/project-structure.md`](./docs/project-structure.md).
