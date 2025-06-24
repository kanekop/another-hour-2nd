# ナビゲーションUI仕様書

## 📋 概要

Another Hourプロジェクトにおける統一的なナビゲーションシステムの仕様書です。全アプリケーション間で一貫したユーザーエクスペリエンスを提供するために、共通のナビゲーション要素とその実装方法を定義します。

### 🎯 設計目標

- **統一性**: 全ページで一貫したナビゲーション体験
- **アクセシビリティ**: キーボード操作とスクリーンリーダー対応
- **レスポンシブ**: モバイルからデスクトップまで最適表示
- **モダンUX**: 直感的で美しいインタラクション

## 🏠 メインナビゲーション - Homeボタン

### 基本仕様

**要素名**: `.back-link`
**表示名**: "Home"
**機能**: ランディングページ（`/`）への遷移

### 🎨 ビジュアルデザイン

#### ライトモード
```css
.back-link {
  /* 配置 */
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  
  /* レイアウト */
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  
  /* タイポグラフィ */
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: #333;
  
  /* 背景・ボーダー */
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  
  /* エフェクト */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### アイコン
```css
.back-link::before {
  content: "←";
  font-size: 16px;
  font-weight: bold;
}
```

#### インタラクション状態

**ホバー状態**:
```css
.back-link:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #d0d0d0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}
```

**アクティブ状態**:
```css
.back-link:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### 🌙 ダークモード対応

```css
body.inverted .back-link {
  color: #e0e0e0;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border-color: #404040;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

body.inverted .back-link:hover {
  background: linear-gradient(135deg, #404040 0%, #2a2a2a 100%);
  border-color: #606060;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

## 📱 レスポンシブ対応

### ブレークポイント

#### モバイル (max-width: 768px)
```css
@media (max-width: 768px) {
  .back-link {
    top: 15px;
    left: 15px;
    padding: 10px 16px;
    font-size: 13px;
    gap: 6px;
  }
  
  .back-link::before {
    font-size: 14px;
  }
}
```

#### タブレット (769px - 1024px)
```css
@media (min-width: 769px) and (max-width: 1024px) {
  .back-link {
    top: 18px;
    left: 18px;
  }
}
```

## ♿ アクセシビリティ

### キーボード操作
- **Tab**: フォーカス移動
- **Enter/Space**: リンク実行
- **Escape**: フォーカス解除（任意）

### スクリーンリーダー対応
```html
<a href="/" class="back-link" aria-label="ホームページに戻る">
  Home
</a>
```

### フォーカス状態
```css
.back-link:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.back-link:focus:not(:focus-visible) {
  outline: none;
}
```

## 📄 実装ガイド

### 1. HTML構造

#### 基本実装
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <!-- 必要なメタタグとCSS -->
  <link rel="stylesheet" href="/css/components.css">
</head>
<body>
  <a href="/" class="back-link">Home</a>
  
  <!-- ページコンテンツ -->
  <main>
    <!-- アプリケーション固有のコンテンツ -->
  </main>
</body>
</html>
```

#### Time Design Test UI（独自CSS）
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <a href="/" class="back-link">Home</a>
  
  <!-- 専用スタイルがcss/style.cssに定義済み -->
</body>
</html>
```

### 2. CSS実装

#### 共通コンポーネント使用
```css
/* packages/scheduler-web/public/css/components.css */
/* 既に実装済み - そのまま使用 */
```

#### 独自実装が必要な場合
```css
/* 上記のCSSコードをコピーして使用 */
/* カスタマイズが必要な場合は変数を調整 */
:root {
  --nav-primary-color: #333;
  --nav-bg-start: #ffffff;
  --nav-bg-end: #f8f9fa;
  --nav-border: #e0e0e0;
}
```

## 🗺️ 適用ページ一覧

### ✅ 実装済み

| ページ | パス | CSS実装 | 状態 |
|--------|------|---------|------|
| **Main Clock** | `/pages/personalized-ah-clock.html` | `components.css` | ✅ 完了 |
| **Stopwatch** | `/pages/stopwatch.html` | `components.css` | ✅ 完了 |
| **Timer** | `/pages/timer.html` | `components.css` | ✅ 完了 |
| **AH Scheduler** | `/pages/scheduler.html` | `components.css` | ✅ 完了 |
| **Time Design Test** | `/dev-tools/time-design-test/index.html` | 独自CSS | ✅ 完了 |

### 🔄 実装検討中

| ページ | パス | 優先度 | 備考 |
|--------|------|--------|------|
| **World Clock** | `/pages/world-clock.html` | 中 | 使用頻度に応じて |
| **Converter** | `/pages/converter.html` | 中 | 使用頻度に応じて |
| **Calendar Sync** | `/pages/calendar-sync.html` | 低 | 設定ページのため |

## 🔧 カスタマイズガイド

### 色テーマのカスタマイズ

```css
/* カスタムテーマ例 */
.back-link.theme-blue {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-color: #90caf9;
  color: #1565c0;
}

.back-link.theme-green {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-color: #a5d6a7;
  color: #2e7d32;
}
```

### サイズバリエーション

```css
/* コンパクト版 */
.back-link.compact {
  padding: 8px 16px;
  font-size: 12px;
  gap: 6px;
}

.back-link.compact::before {
  font-size: 14px;
}

/* 大型版 */
.back-link.large {
  padding: 16px 24px;
  font-size: 16px;
  gap: 10px;
}

.back-link.large::before {
  font-size: 18px;
}
```

## 🧪 テストケース

### ビジュアル回帰テスト

1. **ライトモード表示**
   - 通常状態
   - ホバー状態
   - アクティブ状態
   - フォーカス状態

2. **ダークモード表示**
   - `body.inverted`クラス適用時の全状態

3. **レスポンシブ表示**
   - モバイル（320px - 767px）
   - タブレット（768px - 1024px）
   - デスクトップ（1025px+）

### 機能テスト

1. **リンク動作**
   - クリックでランディングページに遷移
   - 正しいURL（`/`）への遷移

2. **キーボード操作**
   - Tabキーでフォーカス可能
   - Enter/Spaceキーで実行可能

3. **アクセシビリティ**
   - スクリーンリーダーでの読み上げ
   - 十分なコントラスト比（WCAG AA準拠）

## 📚 関連ドキュメント

- [Time Design Test UI仕様](./time-design-test-ui-spec.md)
- [共通コンポーネント仕様](../specifications/ui-components-spec.md) ※未作成
- [アクセシビリティガイドライン](../specifications/accessibility-spec.md) ※未作成

## 🚀 今後の拡張予定

### Phase 1: 基本機能強化
- [ ] パンくずナビゲーション
- [ ] アプリケーション間の直接遷移ボタン

### Phase 2: 高度な機能
- [ ] ナビゲーション履歴
- [ ] お気に入りページ機能
- [ ] ユーザー設定によるカスタマイズ

### Phase 3: アニメーション強化
- [ ] ページ遷移アニメーション
- [ ] マイクロインタラクション
- [ ] ジェスチャー操作対応

---

**最終更新**: 2025年6月20日  
**バージョン**: 1.0.0  
**ステータス**: 実装完了・運用中