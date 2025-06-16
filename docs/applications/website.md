# Another Hour Website

## 概要
Another Hour Websiteは、プロジェクトの哲学やユーザーストーリーを紹介するAstro製のウェブサイトです。ホームページ、コンセプトページ、ストーリーページなどで構成され、Vercelへデプロイされています。

## ストーリーページ仕様
`/stories` ページでは、ユーザー体験を物語形式で紹介します。仕様はパッケージ内の [SPECIFICATION.md](../../packages/website/SPECIFICATION.md) にも記載されています。ストーリーページの目的と構成要素は仕様書にもまとめられています【F:packages/website/SPECIFICATION.md†L71-L76】。

- Markdown + Frontmatter 形式で管理
- 配置場所: `packages/website/src/pages/stories/`
- フィールド定義は仕様書のストーリーコレクション項目を参照してください【F:packages/website/SPECIFICATION.md†L110-L119】。
- Frontmatter 例:

```markdown
---
title: "朝の儀式"
description: "Another Hourで始まる新しい一日"
date: 2025-06-14
author: "Another Hour Team"
---
```

上記の `title` がストーリー一覧や詳細ページのタイトルとして使用されます。`title` を省略した場合はファイル名がそのままタイトルに使われます【F:packages/website/src/pages/stories/index.astro†L11-L15】。

## 新しいストーリーの追加方法
1. `packages/website/src/pages/stories/` に `your-story.md` を作成します。
2. 冒頭に上記のFrontmatterを記述し、続けて本文を書きます。
3. サイトをビルドすると `/stories` に自動で反映されます。

> **タイトルと1行目について**
>
> 現在の実装では Frontmatter の `title` フィールドが優先されます。1行目の見出し (`# ...`) は自動ではタイトルとして扱われません。必要に応じて1行目にも同じ見出しを記載してください。

