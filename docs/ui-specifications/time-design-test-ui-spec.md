# Time Design Test UI/UX 仕様書

## 1. 概要

### 1.1 目的
Time Design Test UIは、Another Hourプロジェクトの新しい時間設計モードシステムを包括的にテストするための開発者向けインターフェースです。すべてのモードの動作確認、設定変更、リアルタイム表示を一画面で行えるよう設計されています。

### 1.2 対象ユーザー
- 開発者
- QAエンジニア
- プロダクトマネージャー（デモ・検証用）

### 1.3 設計原則
- **情報密度優先**: Full HD（1920×1080）でブラウザメニュー表示時も全機能が表示可能
- **リアルタイム性**: 60FPSでの滑らかな更新
- **開発効率**: デバッグ情報の充実とアクセシビリティ
- **レスポンシブ**: モバイルから4Kまで対応

## 2. レイアウト構成

### 2.1 全体構造
```
┌─────────────────────────────────────────────────────────┐
│                    Header (40px)                         │
├────────────┬─────────────────────────┬──────────────────┤
│            │                         │                  │
│    Left    │        Center           │      Right       │
│   (200px)  │       (flexible)        │     (280px)      │
│            │                         │                  │
└────────────┴─────────────────────────┴──────────────────┘
│                  Status Bar (30px)                       │
└─────────────────────────────────────────────────────────┘
```

### 2.2 ヘッダー部
- **高さ**: 40px（固定）
- **内容**:
  - タイトル: "⏰ Time Design Modes Test Interface"
  - ステータスインジケーター（システム状態表示）
- **背景色**: 白（#FFFFFF）
- **影**: 0 1px 3px rgba(0, 0, 0, 0.1)

### 2.3 左パネル（モード選択）
- **幅**: 200px（固定）
- **内容**: 利用可能な時間設計モード一覧
- **各モードアイテム**:
  - パディング: 8px
  - マージン: 4px（下部）
  - ホバー効果: 背景色変更 + 右方向に5px移動
  - アクティブ状態: 青背景（#3498db）、白文字

### 2.4 中央パネル
3つのセクションに分割：

#### 2.4.1 時間表示セクション
- **時計表示**: 
  - フォントサイズ: 2.5em（Full HD最適化）
  - フォント: font-variant-numeric: tabular-nums（等幅数字）
- **情報グリッド**: 4列×1行
  - Scale Factor
  - Real Time
  - Current Phase
  - Progress

#### 2.4.2 タイムライン表示

##### 基本仕様
- **高さ**: 40px（固定）
- **幅**: 100%（親要素に依存）
- **背景色**: #F8F9FA
- **境界線**: 4px radius
- **マージン**: 上部8px

##### セグメント表示
各時間設計モードに応じて、24時間を異なるセグメントに分割して表示：

**Classic Mode**
- Designed 24期間: 青色（#3498DB）
- Another Hour期間: グレー（#95A5A6）

**Core Time Mode**
- Morning Another Hour: 薄い青（#85C1E9）
- Core Time: 濃い青（#2874A6）
- Evening Another Hour: 薄い青（#85C1E9）

**Wake-Based Mode**
- Activity Period: 青のグラデーション（濃→薄）
- Another Hour: グレー（#95A5A6）

**Solar Mode**
- Daytime: 黄色～オレンジのグラデーション（#F39C12 → #E67E22）
- Nighttime: 紺色～黒のグラデーション（#34495E → #2C3E50）

##### セグメント要素
```css
.timeline-segment {
    position: absolute;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.7em;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    transition: opacity 0.3s ease;
}
```

##### ラベル表示ルール
1. **幅が60px以上**: フルラベル表示（例: "Core Time"）
2. **幅が30px以上60px未満**: 短縮ラベル（例: "Core"）
3. **幅が30px未満**: ラベル非表示

##### 現在位置マーカー
```css
.timeline-current {
    position: absolute;
    width: 2px;
    height: 100%;
    background: #E74C3C; /* 赤色 */
    top: 0;
    z-index: 10;
    box-shadow: 0 0 4px rgba(231, 76, 60, 0.5);
    transition: left 1s linear; /* 滑らかな移動 */
}
```

##### インタラクション
1. **ホバー効果**
   - セグメントホバー時: 明度を10%上げる
   - ツールチップ表示:
     - セグメント名
     - 開始時刻 - 終了時刻
     - 継続時間
     - スケールファクター

2. **クリック動作**
   - セグメントクリック: そのセグメントの詳細設定にジャンプ
   - 背景クリック: 現在時刻にスクロール

##### 時刻目盛り（オプション）
```html
<div class="timeline-hours">
    <span class="hour-mark" style="left: 0%">0</span>
    <span class="hour-mark" style="left: 25%">6</span>
    <span class="hour-mark" style="left: 50%">12</span>
    <span class="hour-mark" style="left: 75%">18</span>
    <span class="hour-mark" style="left: 100%">24</span>
</div>
```

##### レスポンシブ対応
- **デスクトップ**: フル表示
- **タブレット**: ラベルを短縮表示
- **モバイル**: ラベル非表示、タップで詳細表示

#### 2.4.3 設定パネル
- **タブ構成**: Settings | Advanced | Presets
- **スクロール**: 内容が多い場合は独立スクロール
- **入力フィールド**: 各モード固有の設定項目

### 2.5 右パネル（デバッグ情報）
- **幅**: 280px（固定）
- **上部**: リアルタイムデータ表示（2×2グリッド）
- **下部**: デバッグコンソール（最大50エントリー）

### 2.6 ステータスバー
- **高さ**: 30px（固定）
- **内容**: 最終更新時刻、メモリ使用量、バージョン情報

## 3. インタラクション仕様

### 3.1 モード選択
- **トリガー**: モードアイテムをクリック
- **動作**:
  1. 選択状態の視覚的更新（即座）
  2. TimeDesignManagerへのモード変更要求
  3. 設定UIの動的生成
  4. デバッグログへの記録

### 3.2 設定変更
- **リアルタイムプレビュー**: 入力中も継続的に反映
- **保存ボタン**: localStorageへの永続化
- **リセットボタン**: デフォルト値への復帰
- **エクスポート**: JSON形式での設定ダウンロード

### 3.3 タブ切り替え
- **アニメーション**: なし（パフォーマンス優先）
- **状態保持**: タブ切り替え時も入力値を保持

## 4. レスポンシブ設計

### 4.1 ブレークポイント
```css
/* デスクトップ (>1400px) */
- 3カラムレイアウト維持
- 全情報表示

/* ノートPC (1200-1400px) */
- カラム幅を調整（180px | 1fr | 250px）
- 時計フォントサイズ: 2.2em

/* タブレット (768-1200px) */
- 2カラム表示（左パネル非表示）
- 情報グリッド: 2×2配置

/* モバイル (<768px) */
- 1カラム表示
- 垂直スタック
- 時計フォントサイズ: 3em（視認性向上）
```

## 5. パフォーマンス仕様

### 5.1 更新頻度
- **時計更新**: 60FPS（requestAnimationFrame使用）
- **デバッグログ**: 最大50エントリー（メモリ効率）
- **設定プレビュー**: デバウンスなし（即時反映）

### 5.2 メモリ管理
- **最大DOM要素数**: 約500要素
- **イベントリスナー**: 適切なクリーンアップ
- **メモリ使用量表示**: performance.memory API使用

## 6. カラースキーム

### 6.1 基本色
- **背景**: #F0F2F5（薄いグレー）
- **パネル背景**: #FFFFFF（白）
- **テキスト**: #333333（ダークグレー）
- **アクセント**: #3498DB（ブルー）
- **エラー**: #E74C3C（レッド）
- **成功**: #2ECC71（グリーン）

### 6.2 デバッグコンソール
- **背景**: #1E1E1E（ダーク）
- **時刻**: #569CD6（ブルー）
- **イベント**: #4EC9B0（シアン）
- **データ**: #DCDCAA（イエロー）
- **エラー**: #F48771（オレンジレッド）

## 7. アクセシビリティ

### 7.1 キーボード操作
- **Tab**: フォーカス移動
- **Enter/Space**: ボタン・リンクの実行
- **Escape**: モーダル・ポップアップを閉じる

### 7.2 スクリーンリーダー対応
- 適切なARIAラベル
- セマンティックHTML構造
- フォーカス管理

## 8. 技術仕様

### 8.1 依存ライブラリ
- **moment.js**: 時刻計算
- **moment-timezone**: タイムゾーン処理
- **suncalc**: 太陽位置計算（Solar Mode用）
- **noUiSlider**: 高度なスライダーUI

### 8.2 ブラウザ要件
- **最小要件**: Chrome 80+, Firefox 75+, Safari 13+
- **推奨**: 最新バージョン
- **必須API**: ES6 Modules, CSS Grid, Flexbox

### 8.3 モジュール構成
```javascript
// メインエントリーポイント
import { timeDesignManager } from './js/time-design/TimeDesignManager.js';

// 主要な機能
- initialize(): システム初期化
- selectMode(modeId): モード切り替え
- loadModeConfig(modeId): 設定UI生成
- updateLoop(): 60FPS更新ループ
```

## 9. エラーハンドリング

### 9.1 エラー表示
- **視覚的フィードバック**: ステータスインジケーターが赤に変化
- **デバッグログ**: 詳細なエラー情報を記録
- **ユーザー通知**: ステータステキストで簡潔に表示

### 9.2 フォールバック
- **モード読み込み失敗**: Classic Modeにフォールバック
- **設定読み込み失敗**: デフォルト値を使用
- **API利用不可**: 機能を段階的に無効化

## 10. 将来の拡張性

### 10.1 計画中の機能
- **A/Bテスト機能**: 複数設定の同時比較
- **記録・再生**: 時間の流れを記録・再生
- **パフォーマンスプロファイル**: 詳細な性能分析
- **多言語対応**: i18n実装

### 10.2 拡張ポイント
- **カスタムモード追加**: ModeRegistryによるプラグイン機構
- **UI テーマ**: CSS変数によるテーマ切り替え
- **外部連携**: WebSocket/REST APIサポート

## 11. 使用方法

### 11.1 基本的な使い方
1. ブラウザでアクセス: `/dev-tools/time-design-test/`
2. 左パネルからモードを選択
3. 中央パネルで設定を調整
4. リアルタイムで結果を確認
5. 必要に応じて設定を保存/エクスポート

### 11.2 デバッグ手順
1. 右パネルのデバッグコンソールを確認
2. エラーが発生した場合は赤色で表示
3. FPSカウンターでパフォーマンスを監視
4. メモリ使用量で異常な増加をチェック

### 11.3 ショートカット
- **Ctrl + S**: 現在の設定を保存
- **Ctrl + R**: 設定をリセット
- **Ctrl + E**: 設定をエクスポート
- **F11**: フルスクリーンモード

## 12. HTML/CSS実装詳細

### 12.1 命名規則
**BEM (Block Element Modifier) 方式を採用**

```css
/* Block */
.time-display {}
.mode-selector {}
.debug-panel {}

/* Element */
.time-display__value {}
.mode-selector__item {}
.debug-panel__console {}

/* Modifier */
.mode-selector__item--active {}
.status-indicator--error {}
.btn--primary {}
```

### 12.2 HTML構造テンプレート

#### ヘッダー部
```html
<header class="app-header" role="banner">
  <h1 class="app-header__title">⏰ Time Design Modes Test Interface</h1>
  <div class="app-header__status">
    <span class="status-indicator" id="statusIndicator" aria-live="polite"></span>
    <span class="status-text" id="statusText">Initializing...</span>
  </div>
</header>
```

#### モード選択パネル
```html
<aside class="mode-selector" role="navigation" aria-label="Mode selection">
  <h2 class="mode-selector__title">Mode Selection</h2>
  <ul class="mode-selector__list" role="list">
    <li class="mode-selector__item" 
        data-mode-id="classic" 
        data-testid="mode-classic"
        role="button"
        tabindex="0"
        aria-pressed="false">
      <h3 class="mode-selector__name">Classic Mode</h3>
      <p class="mode-selector__description">Traditional Another Hour</p>
    </li>
    <!-- 他のモード -->
  </ul>
</aside>
```

#### 時間表示部
```html
<section class="time-display" aria-label="Current time display">
  <div class="time-display__clock">
    <time class="time-display__value" id="timeDisplay" datetime="">--:--:--</time>
    <div class="time-display__label" id="periodLabel">Initializing...</div>
  </div>
  
  <div class="info-grid" role="group" aria-label="Time information">
    <div class="info-card" data-metric="scale">
      <h4 class="info-card__label">Scale</h4>
      <div class="info-card__value" id="scaleFactor">-</div>
    </div>
    <!-- 他の情報カード -->
  </div>
</section>
```

### 12.3 CSS実装パターン

#### CSS変数による設計システム
```css
:root {
  /* Colors */
  --color-primary: #3498db;
  --color-success: #2ecc71;
  --color-error: #e74c3c;
  --color-bg-main: #f0f2f5;
  --color-bg-panel: #ffffff;
  --color-text-primary: #333333;
  --color-text-secondary: #666666;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 2.5rem;
  
  /* Layout */
  --panel-left-width: 200px;
  --panel-right-width: 280px;
  --header-height: 40px;
  --status-bar-height: 30px;
  
  /* Animations */
  --transition-base: 200ms ease-in-out;
  --transition-fast: 100ms ease-out;
}
```

#### レスポンシブ対応のmixin
```scss
// SCSS mixinの例
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'tablet' {
    @media (max-width: 1200px) { @content; }
  }
  @else if $breakpoint == 'mobile' {
    @media (max-width: 768px) { @content; }
  }
  @else if $breakpoint == 'large' {
    @media (min-width: 1400px) { @content; }
  }
}

// 使用例
.time-display__value {
  font-size: var(--font-size-xl);
  
  @include respond-to('tablet') {
    font-size: 2.2rem;
  }
  
  @include respond-to('mobile') {
    font-size: 3rem;
  }
}
```

## 13. JavaScript実装詳細

### 13.1 モジュール構成

```javascript
// ディレクトリ構造
/js
  /time-design
    /core
      - EventBus.js        // イベント管理
      - StateManager.js    // 状態管理
      - Logger.js          // ロギング
    /ui
      - UIManager.js       // UI統括
      - ModeSelector.js    // モード選択UI
      - TimeDisplay.js     // 時間表示UI
      - ConfigPanel.js     // 設定パネルUI
      - DebugPanel.js      // デバッグパネルUI
    /utils
      - DOMHelpers.js      // DOM操作ユーティリティ
      - Performance.js     // パフォーマンス計測
      - Validators.js      // 入力検証
```

### 13.2 状態管理パターン

```javascript
// StateManager.js
class StateManager {
  constructor() {
    this.state = {
      currentMode: null,
      config: {},
      ui: {
        isLoading: false,
        activeTab: 'settings',
        errors: []
      },
      performance: {
        fps: 0,
        memoryUsage: 0,
        lastUpdate: null
      }
    };
    
    this.subscribers = new Map();
  }
  
  // 状態更新メソッド
  setState(path, value) {
    const keys = path.split('.');
    let current = this.state;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    const oldValue = current[keys[keys.length - 1]];
    current[keys[keys.length - 1]] = value;
    
    this.notify(path, value, oldValue);
  }
  
  // サブスクリプション
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    this.subscribers.get(path).add(callback);
    
    return () => {
      this.subscribers.get(path).delete(callback);
    };
  }
  
  // 通知
  notify(path, newValue, oldValue) {
    const callbacks = this.subscribers.get(path);
    if (callbacks) {
      callbacks.forEach(cb => cb(newValue, oldValue));
    }
  }
}
```

### 13.3 イベントバスの実装

```javascript
// EventBus.js
class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }
  
  on(event, callback, priority = 0) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event).push({ callback, priority });
    this.events.get(event).sort((a, b) => b.priority - a.priority);
    
    return () => this.off(event, callback);
  }
  
  once(event, callback) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }
    
    this.onceEvents.get(event).push(callback);
  }
  
  emit(event, data) {
    // 通常のイベント
    if (this.events.has(event)) {
      this.events.get(event).forEach(({ callback }) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
    
    // 一度だけのイベント
    if (this.onceEvents.has(event)) {
      const callbacks = this.onceEvents.get(event);
      this.onceEvents.delete(event);
      callbacks.forEach(callback => callback(data));
    }
  }
  
  off(event, callback) {
    if (this.events.has(event)) {
      const handlers = this.events.get(event);
      const index = handlers.findIndex(h => h.callback === callback);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
}
```

### 13.4 DOM操作ヘルパー

```javascript
// DOMHelpers.js
export const DOM = {
  // 要素取得（キャッシュ付き）
  get(selector, parent = document) {
    const cache = DOM._cache || (DOM._cache = new Map());
    const key = `${parent === document ? 'doc' : parent.id}:${selector}`;
    
    if (!cache.has(key)) {
      cache.set(key, parent.querySelector(selector));
    }
    
    return cache.get(key);
  },
  
  // 複数要素取得
  getAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },
  
  // クラス操作
  addClass(element, className) {
    element.classList.add(...className.split(' '));
    return element;
  },
  
  removeClass(element, className) {
    element.classList.remove(...className.split(' '));
    return element;
  },
  
  toggleClass(element, className, force) {
    return element.classList.toggle(className, force);
  },
  
  // イベント委譲
  delegate(parent, eventType, selector, handler) {
    parent.addEventListener(eventType, (event) => {
      const target = event.target.closest(selector);
      if (target && parent.contains(target)) {
        handler.call(target, event);
      }
    });
  },
  
  // アニメーション付き更新
  updateWithAnimation(element, text, duration = 200) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms`;
    
    setTimeout(() => {
      element.textContent = text;
      element.style.opacity = '1';
    }, duration / 2);
  }
};
```

## 14. パフォーマンス最適化実装

### 14.1 仮想スクロールの実装（デバッグログ用）

```javascript
// VirtualScroll.js
class VirtualScroll {
  constructor(container, options = {}) {
    this.container = container;
    this.itemHeight = options.itemHeight || 30;
    this.buffer = options.buffer || 5;
    this.items = [];
    this.scrollTop = 0;
    this.visibleStart = 0;
    this.visibleEnd = 0;
    
    this.init();
  }
  
  init() {
    // スクロールコンテナの設定
    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-scroll__viewport';
    this.viewport.style.height = '100%';
    this.viewport.style.overflow = 'auto';
    
    this.content = document.createElement('div');
    this.content.className = 'virtual-scroll__content';
    
    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);
    
    // スクロールイベント（throttle付き）
    let scrollTimeout;
    this.viewport.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        this.handleScroll();
        scrollTimeout = null;
      }, 16); // 60fps
    });
  }
  
  setItems(items) {
    this.items = items;
    this.content.style.height = `${items.length * this.itemHeight}px`;
    this.render();
  }
  
  handleScroll() {
    this.scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;
    
    this.visibleStart = Math.floor(this.scrollTop / this.itemHeight) - this.buffer;
    this.visibleEnd = Math.ceil((this.scrollTop + viewportHeight) / this.itemHeight) + this.buffer;
    
    this.visibleStart = Math.max(0, this.visibleStart);
    this.visibleEnd = Math.min(this.items.length, this.visibleEnd);
    
    this.render();
  }
  
  render() {
    const fragment = document.createDocumentFragment();
    
    for (let i = this.visibleStart; i < this.visibleEnd; i++) {
      const item = this.items[i];
      const element = this.renderItem(item, i);
      element.style.position = 'absolute';
      element.style.top = `${i * this.itemHeight}px`;
      element.style.height = `${this.itemHeight}px`;
      fragment.appendChild(element);
    }
    
    this.content.innerHTML = '';
    this.content.appendChild(fragment);
  }
  
  renderItem(item, index) {
    // オーバーライドして使用
    const div = document.createElement('div');
    div.textContent = JSON.stringify(item);
    return div;
  }
}
```

### 14.2 メモ化とキャッシング

```javascript
// Memoization.js
export function memoize(fn, options = {}) {
  const cache = new Map();
  const maxSize = options.maxSize || 100;
  const ttl = options.ttl || Infinity;
  
  return function memoized(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      const cached = cache.get(key);
      if (Date.now() - cached.timestamp < ttl) {
        return cached.value;
      }
      cache.delete(key);
    }
    
    const result = fn.apply(this, args);
    
    // LRU実装
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, {
      value: result,
      timestamp: Date.now()
    });
    
    return result;
  };
}

// 使用例
const calculateTimeSegments = memoize((mode, config) => {
  // 重い計算処理
  return segments;
}, { maxSize: 50, ttl: 60000 }); // 1分間キャッシュ
```

### 14.3 Web Worker活用

```javascript
// TimeCalculationWorker.js
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CALCULATE_TIME':
      const result = performTimeCalculation(data);
      self.postMessage({ type: 'TIME_RESULT', data: result });
      break;
      
    case 'BATCH_CALCULATE':
      const results = data.map(item => performTimeCalculation(item));
      self.postMessage({ type: 'BATCH_RESULT', data: results });
      break;
  }
});

// メインスレッド側
class WorkerManager {
  constructor() {
    this.worker = new Worker('TimeCalculationWorker.js');
    this.callbacks = new Map();
    this.messageId = 0;
    
    this.worker.addEventListener('message', (event) => {
      const { id, type, data } = event.data;
      if (this.callbacks.has(id)) {
        this.callbacks.get(id)(data);
        this.callbacks.delete(id);
      }
    });
  }
  
  calculate(data) {
    return new Promise((resolve) => {
      const id = this.messageId++;
      this.callbacks.set(id, resolve);
      this.worker.postMessage({ id, type: 'CALCULATE_TIME', data });
    });
  }
}
```

## 15. テスト戦略

### 15.1 テスト用属性とセレクター規則

```html
<!-- data-testid: E2Eテスト用 -->
<button data-testid="save-config-btn">Save</button>

<!-- data-test-state: 状態確認用 -->
<div data-test-state="loading">Loading...</div>

<!-- data-test-value: 値確認用 -->
<span data-test-value="current-time">12:34:56</span>
```

### 15.2 モックデータ構造

```javascript
// mocks/timeDesignMocks.js
export const mockModes = {
  classic: {
    id: 'classic',
    name: 'Classic Mode',
    description: 'Traditional Another Hour',
    defaultConfig: {
      designed24Duration: 1380
    }
  },
  'core-time': {
    id: 'core-time',
    name: 'Core Time Mode',
    description: 'Work-life balance',
    defaultConfig: {
      morningAH: { start: '05:00', duration: 120 },
      eveningAH: { duration: 120 }
    }
  }
};

export const mockTimeCalculation = {
  hours: 12,
  minutes: 34,
  seconds: 56,
  scaleFactor: 1.04,
  segmentInfo: {
    type: 'designed',
    label: 'Designed 24',
    startTime: 1234567890000,
    endTime: 1234567890000
  }
};
```

### 15.3 E2Eテストヘルパー

```javascript
// e2e/helpers/TimeDesignTestHelpers.js
export class TimeDesignTestHelpers {
  constructor(page) {
    this.page = page;
  }
  
  async selectMode(modeId) {
    await this.page.click(`[data-mode-id="${modeId}"]`);
    await this.page.waitForSelector(`[data-mode-id="${modeId}"].active`);
  }
  
  async setConfigValue(fieldId, value) {
    const input = await this.page.$(`#${fieldId}`);
    await input.clear();
    await input.type(value.toString());
  }
  
  async saveConfiguration() {
    await this.page.click('[data-testid="save-config-btn"]');
    await this.page.waitForSelector('[data-test-state="saved"]');
  }
  
  async getTimeDisplay() {
    return await this.page.$eval('#timeDisplay', el => el.textContent);
  }
  
  async getDebugLog() {
    return await this.page.$eval('.debug-entry', entries => 
      entries.map(entry => ({
        time: entry.querySelector('.debug-time').textContent,
        event: entry.querySelector('.debug-event').textContent,
        data: entry.querySelector('.debug-data').textContent
      }))
    );
  }
}
```

## 16. エラーハンドリングとロギング

### 16.1 エラーバウンダリー実装

```javascript
// ErrorBoundary.js
class ErrorBoundary {
  constructor(options = {}) {
    this.onError = options.onError || console.error;
    this.fallbackUI = options.fallbackUI || this.defaultFallback;
    this.retryLimit = options.retryLimit || 3;
    this.retryCount = 0;
  }
  
  wrap(fn, context = null) {
    return (...args) => {
      try {
        return fn.apply(context, args);
      } catch (error) {
        this.handleError(error, fn, args);
      }
    };
  }
  
  async wrapAsync(fn, context = null) {
    return async (...args) => {
      try {
        return await fn.apply(context, args);
      } catch (error) {
        return this.handleError(error, fn, args);
      }
    };
  }
  
  handleError(error, fn, args) {
    this.onError(error);
    
    if (this.retryCount < this.retryLimit) {
      this.retryCount++;
      console.warn(`Retrying... (${this.retryCount}/${this.retryLimit})`);
      return fn(...args);
    }
    
    this.showFallback(error);
    this.retryCount = 0;
  }
  
  showFallback(error) {
    const container = document.getElementById('app');
    container.innerHTML = this.fallbackUI(error);
  }
  
  defaultFallback(error) {
    return `
      <div class="error-boundary">
        <h2>Something went wrong</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}
```

### 16.2 ログレベルとロガー実装

```javascript
// Logger.js
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || LogLevel.INFO;
    this.handlers = options.handlers || [new ConsoleHandler()];
    this.context = options.context || {};
  }
  
  log(level, message, data = {}) {
    if (level < this.level) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      data: { ...this.context, ...data },
      stack: new Error().stack
    };
    
    this.handlers.forEach(handler => handler.handle(logEntry));
  }
  
  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }
  
  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }
  
  error(message, data) {
    this.log(LogLevel.ERROR, message, data);
  }
  
  fatal(message, data) {
    this.log(LogLevel.FATAL, message, data);
  }
  
  // パフォーマンス計測
  time(label) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} took ${duration.toFixed(2)}ms`);
    };
  }
}

// ハンドラーの例
class ConsoleHandler {
  handle(logEntry) {
    const { level, message, data } = logEntry;
    const style = this.getStyle(level);
    
    console.log(
      `%c[${level}] ${message}`,
      style,
      data
    );
  }
  
  getStyle(level) {
    const styles = {
      DEBUG: 'color: #888',
      INFO: 'color: #3498db',
      WARN: 'color: #f39c12',
      ERROR: 'color: #e74c3c',
      FATAL: 'color: #c0392b; font-weight: bold'
    };
    return styles[level] || '';
  }
}
```

## 17. ビルドとデプロイ設定

### 17.1 環境変数管理

```javascript
// config/environment.js
export const ENV = {
  MODE: import.meta.env.MODE || 'development',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  FEATURES: {
    SOLAR_MODE: import.meta.env.VITE_FEATURE_SOLAR_MODE === 'true',
    EXPORT_IMPORT: import.meta.env.VITE_FEATURE_EXPORT_IMPORT === 'true',
    ADVANCED_DEBUG: import.meta.env.VITE_FEATURE_ADVANCED_DEBUG === 'true'
  }
};

// 使用例
if (ENV.FEATURES.ADVANCED_DEBUG) {
  enableAdvancedDebugging();
}
```

### 17.2 Feature Flag実装

```javascript
// FeatureFlags.js
class FeatureFlags {
  constructor() {
    this.flags = new Map();
    this.loadFlags();
  }
  
  loadFlags() {
    // 環境変数から読み込み
    Object.entries(ENV.FEATURES).forEach(([key, value]) => {
      this.flags.set(key, value);
    });
    
    // ローカルストレージのオーバーライド
    try {
      const overrides = JSON.parse(localStorage.getItem('featureFlags') || '{}');
      Object.entries(overrides).forEach(([key, value]) => {
        this.flags.set(key, value);
      });
    } catch (e) {}
  }
  
  isEnabled(flagName) {
    return this.flags.get(flagName) || false;
  }
  
  setFlag(flagName, value) {
    this.flags.set(flagName, value);
    this.saveOverrides();
  }
  
  saveOverrides() {
    const overrides = {};
    this.flags.forEach((value, key) => {
      if (value !== ENV.FEATURES[key]) {
        overrides[key] = value;
      }
    });
    localStorage.setItem('featureFlags', JSON.stringify(overrides));
  }
  
  // UIコンポーネント用ラッパー
  when(flagName, component) {
    return this.isEnabled(flagName) ? component : null;
  }
}

export const featureFlags = new FeatureFlags();
```

### 17.3 ビルド最適化設定

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    target: 'es2018',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['moment', 'moment-timezone'],
          'charts': ['suncalc'],
          'ui': ['nouislider']
        }
      }
    }
  },
  
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true
    })
  ]
});
```

## 19. タイムライン実装詳細

### 19.1 データ構造

```typescript
// タイムラインセグメントのインターフェース
interface TimelineSegment {
    id: string;                  // 一意のID
    type: 'designed' | 'another' | 'core' | 'morning' | 'evening' | 'day' | 'night';
    label: string;               // 表示ラベル
    shortLabel?: string;         // 短縮ラベル
    startMinutes: number;        // 0-1440の範囲
    durationMinutes: number;     // 分単位の継続時間
    scaleFactor: number;         // 時間の進む速度
    color: string;              // 背景色
    textColor?: string;         // テキスト色（デフォルト: white）
    className?: string;         // カスタムCSSクラス
}

// 各モードのセグメント生成例
const classicModeSegments: TimelineSegment[] = [
    {
        id: 'classic-designed',
        type: 'designed',
        label: 'Designed 24',
        shortLabel: 'D24',
        startMinutes: 360,      // 6:00
        durationMinutes: 1380,  // 23時間
        scaleFactor: 1.04,
        color: '#3498DB'
    },
    {
        id: 'classic-another',
        type: 'another',
        label: 'Another Hour',
        shortLabel: 'AH',
        startMinutes: 300,      // 5:00
        durationMinutes: 60,    // 1時間
        scaleFactor: 1.0,
        color: '#95A5A6'
    }
];
```

### 19.2 レンダリング実装

```javascript
class TimelineRenderer {
    constructor(container) {
        this.container = container;
        this.segments = [];
        this.currentTime = null;
    }
    
    render(segments, currentTimeMinutes) {
        this.segments = segments;
        this.currentTime = currentTimeMinutes;
        
        // コンテナをクリア（マーカー以外）
        this.clearSegments();
        
        // セグメントを描画
        segments.forEach(segment => {
            this.renderSegment(segment);
        });
        
        // 現在位置を更新
        this.updateCurrentPosition(currentTimeMinutes);
        
        // 時刻目盛りを描画（オプション）
        if (this.showHourMarks) {
            this.renderHourMarks();
        }
    }
    
    renderSegment(segment) {
        const element = document.createElement('div');
        element.className = `timeline-segment ${segment.className || ''}`;
        element.dataset.segmentId = segment.id;
        element.dataset.segmentType = segment.type;
        
        // 位置とサイズを計算
        const leftPercent = (segment.startMinutes / 1440) * 100;
        const widthPercent = (segment.durationMinutes / 1440) * 100;
        
        // スタイルを適用
        Object.assign(element.style, {
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
            backgroundColor: segment.color,
            color: segment.textColor || 'white'
        });
        
        // ラベルを設定（幅に応じて調整）
        const label = this.getAppropriateLabel(segment, widthPercent);
        if (label) {
            element.textContent = label;
        }
        
        // イベントリスナーを追加
        this.attachEventListeners(element, segment);
        
        this.container.appendChild(element);
    }
    
    getAppropriateLabel(segment, widthPercent) {
        const pixelWidth = (widthPercent / 100) * this.container.offsetWidth;
        
        if (pixelWidth >= 60) {
            return segment.label;
        } else if (pixelWidth >= 30) {
            return segment.shortLabel || segment.label.substring(0, 4);
        }
        return ''; // ラベル非表示
    }
    
    attachEventListeners(element, segment) {
        // ホバー時のツールチップ
        element.addEventListener('mouseenter', (e) => {
            this.showTooltip(e, segment);
        });
        
        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
        
        // クリック時の動作
        element.addEventListener('click', () => {
            this.onSegmentClick(segment);
        });
    }
    
    showTooltip(event, segment) {
        const tooltip = document.createElement('div');
        tooltip.className = 'timeline-tooltip';
        tooltip.innerHTML = `
            <strong>${segment.label}</strong><br>
            Start: ${this.formatMinutes(segment.startMinutes)}<br>
            Duration: ${this.formatDuration(segment.durationMinutes)}<br>
            Scale: ${segment.scaleFactor}x
        `;
        
        // 位置を計算
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        
        document.body.appendChild(tooltip);
        this.currentTooltip = tooltip;
    }
    
    formatMinutes(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
    
    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}m`;
        }
    }
}
```

### 19.3 アニメーション仕様

```css
/* セグメントのトランジション */
.timeline-segment {
    transition: all 0.3s ease;
}

.timeline-segment:hover {
    filter: brightness(1.1);
    transform: scaleY(1.1);
    z-index: 5;
}

/* 現在位置マーカーのアニメーション */
@keyframes pulse {
    0% { box-shadow: 0 0 4px rgba(231, 76, 60, 0.5); }
    50% { box-shadow: 0 0 8px rgba(231, 76, 60, 0.8); }
    100% { box-shadow: 0 0 4px rgba(231, 76, 60, 0.5); }
}

.timeline-current {
    animation: pulse 2s infinite;
}

/* セグメント切り替え時のアニメーション */
.timeline-segment-enter {
    opacity: 0;
    transform: scaleX(0);
}

.timeline-segment-enter-active {
    opacity: 1;
    transform: scaleX(1);
    transition: all 0.5s ease;
}

.timeline-segment-exit {
    opacity: 1;
    transform: scaleX(1);
}

.timeline-segment-exit-active {
    opacity: 0;
    transform: scaleX(0);
    transition: all 0.5s ease;
}
```

### 19.4 モード別表示仕様

#### Classic Mode
- **配色**: 単純な2色構成
- **境界**: はっきりとした境界線
- **ラベル**: "Designed 24" と "Another Hour"

#### Core Time Mode
- **配色**: 3色構成（朝AH、コアタイム、夜AH）
- **グラデーション**: 朝夕のAHは薄い色
- **境界**: ソフトな境界（1px blur）

#### Wake-Based Mode
- **配色**: 起床からの経過時間でグラデーション
- **透明度**: 時間経過とともに透明度変化
- **アニメーション**: 起床時刻変更時にスライドアニメーション

#### Solar Mode
- **配色**: 実際の太陽の位置に基づく色
  - 日の出前: 濃紺（#1A237E）
  - 日の出: オレンジグラデーション（#FF6F00 → #FFB300）
  - 昼間: 明るい黄色（#FFD600）
  - 日の入り: 赤オレンジグラデーション（#FF6F00 → #D32F2F）
  - 夜: 濃紺から黒へ（#1A237E → #000000）
- **リアルタイム更新**: 1分ごとに色を微調整

### 19.5 アクセシビリティ

1. **キーボード操作**
   - Tab: セグメント間を移動
   - Enter/Space: セグメントの詳細を表示
   - 矢印キー: 時間を前後に移動

2. **スクリーンリーダー対応**
   ```html
   <div role="progressbar" 
        aria-valuenow="720" 
        aria-valuemin="0" 
        aria-valuemax="1440"
        aria-label="Current time: 12:00, in Core Time period">
   ```

3. **高コントラストモード**
   - 境界線を追加
   - パターン（斜線など）でセグメントを区別

### 19.6 パフォーマンス最適化

1. **レンダリング最適化**
   - RAF (requestAnimationFrame) を使用した更新
   - 不可視要素のレンダリングスキップ
   - CSS transformを使用した位置更新

2. **メモリ管理**
   - 不要なDOMノードの削除
   - イベントリスナーの適切な解除
   - ツールチップの再利用

3. **更新頻度**
   - 現在位置: 1秒ごと
   - セグメント: モード変更時のみ
   - 色調整（Solar Mode）: 1分ごと