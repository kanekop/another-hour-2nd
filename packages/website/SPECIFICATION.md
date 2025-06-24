# Another Hour Website 仕様書

## 1. プロジェクト概要

### 1.1 目的
Another Hour Websiteは、「時間との関係を再定義する」というコンセプトを世界に伝えるためのオウンドメディアです。技術的なアプリケーションとは別に、哲学的・概念的な側面を伝えることに特化しています。

### 1.2 位置づけ
- **技術プロダクト**: Scheduler、Clock、Watch（機能提供）
- **Website**: コンセプト啓蒙、ストーリーテリング（価値提供）

### 1.3 ターゲットユーザー
- 時間に追われていると感じる現代人
- ライフスタイルを見直したい人
- 新しい時間の概念に興味がある人
- Another Hourアプリの潜在ユーザー

## 2. 技術仕様

### 2.1 技術スタック
- **フレームワーク**: Astro 4.x
- **スタイリング**: Tailwind CSS v3.x
- **言語**: JavaScript（TypeScript導入は将来検討）
- **ホスティング**: Vercel
- **バージョン管理**: Git (GitHub)

### 2.2 プロジェクト構造
```
packages/website/
├── src/
│   ├── pages/          # ページコンポーネント
│   ├── layouts/        # 共通レイアウト
│   ├── components/     # 再利用可能コンポーネント
│   ├── content/        # Markdownコンテンツ
│   ├── styles/         # グローバルスタイル
│   └── i18n/          # 多言語リソース
├── public/            # 静的アセット
│   ├── images/
│   └── fonts/
├── astro.config.mjs   # Astro設定
├── tailwind.config.js # Tailwind設定
└── package.json
```

### 2.3 ビルド・デプロイ
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist/`
- **デプロイ方式**: Git push → Vercel自動デプロイ
- **環境**: Production（main branch）

## 3. 機能仕様

### 3.1 ページ構成

#### ホームページ（/）
- **目的**: 第一印象とコンセプトの伝達
- **構成要素**:
  - ヒーローセクション（キャッチコピー）
  - 3つの価値提案
  - ユーザーストーリーへの導線
  - CTAボタン（アプリへ）

#### コンセプトページ（/concept）
- **目的**: Another Hourの哲学を詳しく説明
- **構成要素**:
  - 時間との新しい関係性
  - Designed 24の説明
  - Another Hourの仕組み
  - ビジュアル図解

#### ストーリーページ（/stories）
- **目的**: 実際の使用シナリオを物語形式で
- **構成要素**:
  - ストーリー一覧
  - カテゴリ分類
  - 各ストーリーの詳細ページ

#### アプリケーションページ（/apps）
- **目的**: 各アプリの紹介と導線
- **構成要素**:
  - Scheduler紹介
  - Clock紹介
  - Watch紹介（今後）
  - 各アプリへのリンク

### 3.2 共通機能

#### ナビゲーション
- ヘッダー：ロゴ、メニュー、言語切替
- フッター：リンク集、著作権表示

#### 多言語対応
- 対応言語：日本語（デフォルト）、英語
- URL構造：パスベース（/en/concept）
- 自動言語検出：ブラウザ設定から

#### レスポンシブデザイン
- モバイルファースト
- ブレークポイント：
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

## 4. コンテンツ仕様

### 4.1 コンテンツ管理
- **形式**: Markdown + Frontmatter
- **配置**: src/content/配下
- **コレクション**:
  ```typescript
  // stories collection
  {
    title: string
    description: string
    date: Date
    author: string
    tags: string[]
    lang: 'ja' | 'en'
  }
  
  // concepts collection
  {
    title: string
    order: number
    lang: 'ja' | 'en'
  }
  ```

### 4.2 初期コンテンツ計画
1. **ストーリー（5本）**
   - 朝の儀式
   - 夕暮れの時間
   - 週末の過ごし方
   - 仕事との向き合い方
   - 家族との時間

2. **コンセプト記事（3本）**
   - Another Hourとは
   - 時間をデザインする意味
   - 使い始めるには

## 5. デザイン仕様

### 5.1 デザイン原則
- **シンプル**: 余白を活かしたミニマルデザイン
- **読みやすさ**: コンテンツファースト
- **一貫性**: Another Hourブランドの統一

### 5.2 カラーパレット
```css
--color-primary: #0066CC;    /* AH Blue */
--color-dark: #1a1a1a;       /* Text */
--color-light: #f5f5f5;      /* Background */
--color-gray: #666666;       /* Secondary text */
--color-white: #ffffff;      /* Card background */
```

### 5.3 タイポグラフィ
- **見出し**: Noto Sans JP / Inter
- **本文**: Noto Sans JP / Inter
- **サイズ**:
  - H1: 2.5rem (40px)
  - H2: 2rem (32px)
  - H3: 1.5rem (24px)
  - Body: 1rem (16px)

### 5.4 スペーシング
- 8pxグリッドシステム
- セクション間：64px (8rem)
- 要素間：24px (3rem)

## 6. パフォーマンス要件

### 6.1 目標指標
- **Lighthouse Score**: 90以上（全カテゴリ）
- **First Contentful Paint**: < 1.5秒
- **Time to Interactive**: < 3秒
- **ファイルサイズ**: 各ページ < 200KB

### 6.2 最適化戦略
- 画像：WebP形式、遅延読み込み
- フォント：サブセット化、preload
- CSS：未使用スタイルの削除
- JavaScript：最小限の使用

## 7. SEO・アクセシビリティ

### 7.1 SEO対策
- **メタタグ**: 各ページ個別設定
- **構造化データ**: JSON-LD
- **サイトマップ**: 自動生成
- **robots.txt**: 適切な設定

### 7.2 アクセシビリティ
- **WCAG 2.1 Level AA**準拠
- セマンティックHTML
- キーボードナビゲーション
- スクリーンリーダー対応

## 8. 分析・モニタリング

### 8.1 アナリティクス
- Google Analytics 4（プライバシー配慮）
- 主要指標：
  - ページビュー
  - 滞在時間
  - アプリへの遷移率

### 8.2 エラーモニタリング
- Vercel Analytics
- ビルドエラー通知
- 404エラー追跡

## 9. セキュリティ

### 9.1 基本対策
- HTTPS必須
- Content Security Policy設定
- 依存関係の定期更新

### 9.2 プライバシー
- Cookieは最小限
- 個人情報は収集しない
- プライバシーポリシー明記

## 10. 今後の拡張計画

### Phase 1（現在）
- 基本ページの実装
- 日本語コンテンツ
- 最小限の機能

### Phase 2（3ヶ月後）
- 英語対応
- ブログ機能
- ニュースレター

### Phase 3（6ヶ月後）
- コミュニティ機能
- ユーザー投稿ストーリー
- APIドキュメント

## 11. 運用・保守

### 11.1 更新頻度
- コンテンツ：週1-2回
- 機能追加：月1回
- セキュリティ：随時

### 11.2 バックアップ
- GitHubがマスターデータ
- Vercelに自動デプロイ履歴

### 11.3 モニタリング
- Vercel Status
- Google Search Console
- ユーザーフィードバック

---

## 改訂履歴

| バージョン | 日付 | 変更内容 | 作成者 |
|---------|------|---------|--------|
| 1.0 | 2025-06-14 | 初版作成 | Another Hour Team |

---

*この仕様書は、プロジェクトの進化に合わせて定期的に更新されます。*