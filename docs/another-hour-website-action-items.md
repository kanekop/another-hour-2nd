# Another Hour Website 開発アクションアイテム

## 🌿 ブランチ戦略

### メインブランチ構成
```
main
├── feature/website-initial-setup     # Phase 1-2: 初期セットアップ
├── feature/website-content           # Phase 2-3: コンテンツ作成
├── feature/website-design            # Phase 3: デザイン実装
├── feature/website-i18n              # Phase 4: 多言語対応
└── feature/website-deploy            # Phase 5: デプロイ設定
```

### ブランチ運用フロー
```bash
# 1. メインから機能ブランチ作成
git checkout main
git pull origin main
git checkout -b feature/website-initial-setup

# 2. 作業完了後、PR作成
git add .
git commit -m "feat(website): initial Astro setup with Tailwind"
git push origin feature/website-initial-setup

# 3. PR承認後、mainにマージ
# 4. 次のフェーズのブランチを作成
git checkout main
git pull origin main
git checkout -b feature/website-content
```

### コミットメッセージ規約
- `feat(website):` 新機能追加
- `fix(website):` バグ修正
- `docs(website):` ドキュメント更新
- `style(website):` デザイン変更
- `chore(website):` 設定・ビルド関連

---

## 🎯 Another Hour Website - アクションアイテム

### **Phase 1: 初期セットアップ（1-2日）**
**ブランチ: `feature/website-initial-setup`**

#### 1. **パッケージ作成と基本構成**
```bash
# ディレクトリ作成
cd packages
mkdir website
cd website

# Astroプロジェクト初期化
npm create astro@latest . -- --template minimal --typescript no

# 必要な依存関係追加
npm install @astrojs/tailwind astro-i18n
npm install -D tailwindcss
```

#### 2. **package.json設定**
```json
{
  "name": "@another-hour/website",
  "version": "0.1.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  }
}
```

#### 3. **プロジェクト構造作成**
```
packages/website/
├── src/
│   ├── pages/
│   │   ├── index.astro      # ホームページ
│   │   ├── concept.astro    # コンセプト説明
│   │   └── stories/         # ストーリーコレクション
│   ├── content/
│   │   ├── stories/         # Markdownストーリー
│   │   └── concepts/        # コンセプト記事
│   ├── layouts/
│   │   └── Layout.astro     # 共通レイアウト
│   └── components/
│       ├── Header.astro     # ナビゲーション
│       └── Footer.astro     # フッター
├── public/
│   └── images/             # 画像アセット
└── astro.config.mjs        # Astro設定
```

### **Phase 2: コンテンツ構造（2-3日）**
**ブランチ: `feature/website-content`**

#### 4. **基本ページ作成**
- [ ] ランディングページ（index.astro）
  - Another Hourの一言説明
  - 3つの主要な価値提案
  - CTAボタン（アプリへのリンク）

- [ ] コンセプトページ（concept.astro）
  - 時間との新しい関係性
  - Designed 24の説明
  - Another Hourの哲学

#### 5. **コンテンツコレクション設定**
```javascript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const stories = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string(),
    lang: z.enum(['ja', 'en'])
  })
});

export const collections = { stories };
```

#### 6. **初期ストーリー作成**
```markdown
# src/content/stories/morning-ritual.md
---
title: "朝の儀式"
description: "Another Hourで始まる新しい一日"
date: 2025-06-14
author: "Another Hour Team"
lang: "ja"
---

6時、目覚まし時計が鳴る。でも今日は違う...
```

### **Phase 3: デザイン実装（2-3日）**
**ブランチ: `feature/website-design`**

#### 7. **Tailwind CSS設定**
```javascript
// tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'ah-blue': '#0066CC',
        'ah-dark': '#1a1a1a',
        'ah-light': '#f5f5f5'
      }
    }
  }
}
```

#### 8. **共通コンポーネント作成**
- [ ] ヘッダー（ナビゲーション）
- [ ] フッター（リンク集）
- [ ] ストーリーカード
- [ ] 言語切り替えボタン

### **Phase 4: 多言語対応（1-2日）**
**ブランチ: `feature/website-i18n`**

#### 9. **i18n設定**
```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import i18n from 'astro-i18n';

export default defineConfig({
  integrations: [
    tailwind(),
    i18n({
      defaultLocale: 'ja',
      locales: ['ja', 'en'],
      routing: {
        prefixDefaultLocale: false
      }
    })
  ]
});
```

#### 10. **翻訳ファイル作成**
```
src/i18n/
├── ja.json
└── en.json
```

### **Phase 5: デプロイ設定（1日）**
**ブランチ: `feature/website-deploy`**

#### 11. **Vercel設定**
```json
// vercel.json
{
  "buildCommand": "cd packages/website && npm run build",
  "outputDirectory": "packages/website/dist",
  "framework": "astro"
}
```

#### 12. **GitHub Actions設定**
```yaml
# .github/workflows/deploy-website.yml
name: Deploy Website
on:
  push:
    branches: [main]
    paths:
      - 'packages/website/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:website
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### **Phase 6: 統合とテスト（1-2日）**
**ブランチ: `feature/website-integration`**

#### 13. **ルートpackage.jsonに追加**
```json
{
  "scripts": {
    "dev:website": "npm run dev --workspace=@another-hour/website",
    "build:website": "npm run build --workspace=@another-hour/website"
  }
}
```

#### 14. **最終チェックリスト**
- [ ] レスポンシブデザイン確認
- [ ] ページ間のナビゲーション
- [ ] 言語切り替え動作
- [ ] ビルドエラーなし
- [ ] Lighthouse スコア確認

## 📋 **MVP コンテンツリスト**

1. **ホームページ**
   - ヒーローセクション
   - 3つの主要機能紹介
   - アプリへのCTA

2. **コンセプトページ**
   - Another Hourの哲学
   - 使い方の簡単な説明
   - ユーザーストーリー

3. **初期ストーリー（3-5本）**
   - 朝の儀式
   - 夕暮れの時間
   - 週末の過ごし方

## 🚀 **クイックスタート**

```bash
# 1. 新しいブランチを作成
git checkout -b feature/website-initial-setup

# 2. websiteパッケージを作成
cd packages
npx create-astro@latest website -- --template minimal --no-install
cd website

# 3. 依存関係をインストール
npm install @astrojs/tailwind astro-i18n tailwindcss

# 4. 開発サーバー起動
npm run dev

# 5. コミット
git add .
git commit -m "feat(website): initial Astro setup with minimal template"
git push origin feature/website-initial-setup
```

## 📊 **進捗管理**

### GitHubプロジェクトボード
```
TODO | IN PROGRESS | REVIEW | DONE
-----|-------------|--------|-----
Phase 1: Setup      |        |      |
Phase 2: Content    |        |      |
Phase 3: Design     |        |      |
Phase 4: i18n       |        |      |
Phase 5: Deploy     |        |      |
Phase 6: Integration|        |      |
```

### マイルストーン
- **v0.1.0**: MVPリリース（日本語のみ）
- **v0.2.0**: 多言語対応（日英）
- **v0.3.0**: ストーリー拡充（10本以上）
- **v1.0.0**: 正式リリース

## 🎨 **デザインシステム**

### カラーパレット
- Primary: `#0066CC` (ah-blue)
- Background Dark: `#1a1a1a` (ah-dark)
- Background Light: `#f5f5f5` (ah-light)
- Text Primary: `#333333`
- Text Secondary: `#666666`

### タイポグラフィ
- 見出し: Noto Sans JP (日本語), Inter (英語)
- 本文: Noto Sans JP (日本語), Inter (英語)
- コード: Fira Code

### スペーシング
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 2rem (32px)
- xl: 4rem (64px)

---

これで、シンプルながら洗練されたAnother Hourのオウンドメディアが構築できます。技術的にシンプルで、コンテンツに集中できる構成になっています。