# Time Design Modes 統合ガイド

## 📋 概要

新規アプリケーションや既存アプリケーションをAnother Hourモノレポに統合する際の実践的ガイドです。Time Design Modesの効果的な活用とアプリケーション間の一貫した統合を実現するための手順書です。

## 🚀 クイックスタート

### 新規アプリの基本統合（15分で完了）

```bash
# 1. 新規パッケージディレクトリの作成
mkdir packages/your-app-name
cd packages/your-app-name

# 2. 基本的なpackage.json作成
npm init -y

# 3. Core Libraryへの依存関係追加
npm install --workspace=packages/your-app-name file:../core
```

### 必須実装コード

```html
<!-- 基本HTMLテンプレート -->
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your App - Another Hour</title>
  <link rel="stylesheet" href="/css/components.css">
</head>
<body>
  <a href="/" class="back-link">Home</a>
  
  <!-- アプリ固有のコンテンツ -->
  <main id="app-content">
    <!-- ここにアプリのUIを配置 -->
  </main>
  
  <script type="module" src="js/your-app.js"></script>
</body>
</html>
```

```javascript
// 基本JavaScript統合コード (js/your-app.js)
import { TimeDesignManager } from '@another-hour/core';

class YourApp {
  constructor() {
    this.timeDesignManager = new TimeDesignManager();
    this.setupIntegration();
    this.initializeApp();
  }
  
  setupIntegration() {
    // Time Design Modes との統合
    this.timeDesignManager.addListener('modeChanged', this.handleModeChange.bind(this));
    this.timeDesignManager.addListener('configUpdated', this.handleConfigUpdate.bind(this));
    
    // 設定変更イベントの監視
    window.addEventListener('another-hour-settings-changed', this.handleSettingsChange.bind(this));
  }
  
  handleModeChange(event) {
    console.log('Mode changed:', event.detail);
    this.updateAppForNewMode(event.detail.mode, event.detail.config);
  }
  
  updateAppForNewMode(mode, config) {
    // アプリ固有のロジックをここに実装
    // 例: スケールファクターの更新、UI表示の変更など
  }
  
  initializeApp() {
    // アプリの初期化処理
    this.loadSettings();
    this.startRealTimeUpdates();
  }
  
  loadSettings() {
    // 共有設定の読み込み
    const settings = localStorage.getItem('another-hour:current-mode');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      this.timeDesignManager.setMode(parsedSettings.mode, parsedSettings.config);
    }
  }
  
  startRealTimeUpdates() {
    // リアルタイム更新の開始（必要に応じて）
    setInterval(() => {
      this.updateDisplay();
    }, 1000);
  }
  
  updateDisplay() {
    const currentTime = new Date();
    const ahTime = this.timeDesignManager.calculateAnotherHourTime(currentTime);
    const scaleFactor = this.timeDesignManager.getCurrentScaleFactor();
    
    // UI更新ロジック
    this.renderTime(ahTime, scaleFactor);
  }
  
  renderTime(ahTime, scaleFactor) {
    // 時間表示の更新
    document.getElementById('time-display').textContent = 
      ahTime.toLocaleTimeString();
  }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
  window.yourApp = new YourApp();
});
```

## 🔄 統合パターン別ガイド

### パターン1: 時間表示系アプリ

**対象**: クロック、世界時計、時間変換器など
**主要統合ポイント**: リアルタイム時間計算

```javascript
class TimeDisplayApp {
  constructor() {
    this.timeDesignManager = new TimeDesignManager();
    this.setupTimeDisplay();
  }
  
  setupTimeDisplay() {
    // 高頻度更新（60 FPS）
    const updateDisplay = () => {
      const now = new Date();
      const ahTime = this.timeDesignManager.calculateAnotherHourTime(now);
      const phase = this.timeDesignManager.getCurrentPhase(now);
      
      // 時間表示更新
      this.updateClockDisplay(ahTime, phase);
      
      requestAnimationFrame(updateDisplay);
    };
    
    requestAnimationFrame(updateDisplay);
  }
  
  updateClockDisplay(ahTime, phase) {
    // アナログ時計の針の角度計算
    const angles = this.calculateClockAngles(ahTime);
    
    // デジタル表示更新
    document.getElementById('digital-time').textContent = 
      ahTime.toLocaleTimeString();
    
    // 現在のフェーズ表示
    document.getElementById('current-phase').textContent = phase.name;
    
    // テーマ切り替え（Another Hour期間中はダークモード）
    document.body.classList.toggle('inverted', phase.name === 'Another Hour');
  }
}
```

### パターン2: 測定系アプリ

**対象**: タイマー、ストップウォッチ、ポモドーロタイマーなど
**主要統合ポイント**: 動的スケーリング

```javascript
class MeasurementApp {
  constructor() {
    this.timeDesignManager = new TimeDesignManager();
    this.scaleFactor = 1.0;
    this.setupScaleFactorTracking();
  }
  
  setupScaleFactorTracking() {
    // スケールファクターの監視
    setInterval(() => {
      const newScaleFactor = this.timeDesignManager.getCurrentScaleFactor();
      if (Math.abs(newScaleFactor - this.scaleFactor) > 0.01) {
        this.scaleFactor = newScaleFactor;
        this.adjustTimerSpeed();
      }
    }, 100);
  }
  
  adjustTimerSpeed() {
    // タイマーの進行速度をスケールファクターに合わせて調整
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.startTimer(this.scaleFactor);
    }
  }
  
  startTimer(scaleFactor = 1.0) {
    // スケールファクターを考慮したタイマー
    const baseInterval = 1000; // 1秒
    const adjustedInterval = baseInterval / scaleFactor;
    
    this.timerInterval = setInterval(() => {
      this.updateTimer();
    }, adjustedInterval);
  }
}
```

### パターン3: スケジューリング系アプリ

**対象**: カレンダー、予定管理、リマインダーなど
**主要統合ポイント**: 時間変換とイベント管理

```javascript
class SchedulingApp {
  constructor() {
    this.timeDesignManager = new TimeDesignManager();
    this.eventManager = new EventManager();
    this.setupEventIntegration();
  }
  
  setupEventIntegration() {
    // イベント時刻の自動変換
    this.eventManager.setTimeConverter({
      toAnotherHour: (realTime) => this.timeDesignManager.calculateAnotherHourTime(realTime),
      toRealTime: (ahTime) => this.timeDesignManager.convertToRealTime(ahTime)
    });
  }
  
  createEvent(title, startTime, duration, timeFormat = 'real') {
    let eventData;
    
    if (timeFormat === 'another-hour') {
      // Another Hour時間で作成されたイベント
      eventData = {
        title,
        ahStartTime: startTime,
        realStartTime: this.timeDesignManager.convertToRealTime(startTime),
        duration,
        timeFormat: 'another-hour'
      };
    } else {
      // 実時間で作成されたイベント
      eventData = {
        title,
        realStartTime: startTime,
        ahStartTime: this.timeDesignManager.calculateAnotherHourTime(startTime),
        duration,
        timeFormat: 'real'
      };
    }
    
    return this.eventManager.addEvent(eventData);
  }
  
  renderEventCalendar() {
    // カレンダー表示でのイベント時刻の自動変換
    const events = this.eventManager.getEvents();
    
    events.forEach(event => {
      const displayTime = this.getUserPreferredTimeFormat() === 'another-hour' 
        ? event.ahStartTime 
        : event.realStartTime;
      
      this.renderEventBlock(event, displayTime);
    });
  }
}
```

## 📦 共有ユーティリティ

### 設定管理ヘルパー

```javascript
// 共有設定管理ユーティリティ
class AnotherHourUtils {
  // 設定の保存
  static saveAppSettings(appName, settings) {
    const key = `another-hour:${appName}:settings`;
    localStorage.setItem(key, JSON.stringify({
      data: settings,
      timestamp: Date.now(),
      version: '1.0.0'
    }));
    
    // 他のアプリに通知
    window.dispatchEvent(new CustomEvent('another-hour-settings-changed', {
      detail: { app: appName, settings }
    }));
  }
  
  // 設定の読み込み
  static loadAppSettings(appName, defaultSettings = {}) {
    const key = `another-hour:${appName}:settings`;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored).data : defaultSettings;
    } catch (error) {
      console.warn(`Failed to load settings for ${appName}:`, error);
      return defaultSettings;
    }
  }
  
  // 現在のTime Design Mode取得
  static getCurrentTimeDesignMode() {
    const stored = localStorage.getItem('another-hour:current-mode');
    return stored ? JSON.parse(stored) : null;
  }
  
  // テーマ管理
  static applyTheme(isDarkMode) {
    document.body.classList.toggle('inverted', isDarkMode);
  }
  
  // 時間フォーマット
  static formatAnotherHourTime(ahTime, options = {}) {
    const defaultOptions = {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: options.showSeconds ? '2-digit' : undefined
    };
    
    return ahTime.toLocaleTimeString('ja-JP', { ...defaultOptions, ...options });
  }
  
  // スケールファクター表示
  static formatScaleFactor(scaleFactor) {
    if (scaleFactor === 1.0) return '標準速度';
    if (scaleFactor > 1.0) return `${scaleFactor.toFixed(1)}倍速`;
    return `${scaleFactor.toFixed(1)}倍（ゆっくり）`;
  }
}
```

### UI コンポーネントヘルパー

```javascript
// 共通UIコンポーネント
class AnotherHourUIComponents {
  // Time Design Mode セレクター
  static createModeSelector(currentMode, onModeChange) {
    const modes = [
      { id: 'classic', name: 'Classic Mode', description: '従来のAnother Hour体験' },
      { id: 'core-time', name: 'Core Time Mode', description: '活動時間の前後にAH配置' },
      { id: 'wake-based', name: 'Wake-Based Mode', description: '起床時刻ベース' },
      { id: 'solar', name: 'Solar Mode', description: '太陽時間ベース' }
    ];
    
    const selector = document.createElement('select');
    selector.className = 'mode-selector';
    
    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode.id;
      option.textContent = mode.name;
      option.title = mode.description;
      option.selected = mode.id === currentMode;
      selector.appendChild(option);
    });
    
    selector.addEventListener('change', (e) => {
      onModeChange(e.target.value);
    });
    
    return selector;
  }
  
  // 時間表示コンポーネント
  static createTimeDisplay(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="time-display">
        <div class="ah-time" id="ah-time-display">--:--:--</div>
        <div class="real-time" id="real-time-display">--:--:--</div>
        <div class="phase-info" id="phase-display">--</div>
        <div class="scale-factor" id="scale-display">--</div>
      </div>
    `;
    
    return {
      updateTime: (ahTime, realTime, phase, scaleFactor) => {
        document.getElementById('ah-time-display').textContent = 
          AnotherHourUtils.formatAnotherHourTime(ahTime, { showSeconds: true });
        document.getElementById('real-time-display').textContent = 
          realTime.toLocaleTimeString();
        document.getElementById('phase-display').textContent = phase.name;
        document.getElementById('scale-display').textContent = 
          AnotherHourUtils.formatScaleFactor(scaleFactor);
      }
    };
  }
}
```

## 🧪 テスト統合

### 統合テストのベストプラクティス

```javascript
// テスト用ユーティリティ
class AnotherHourTestUtils {
  // モックTime Design Manager
  static createMockTimeDesignManager(mode = 'classic') {
    return {
      currentMode: mode,
      calculateAnotherHourTime: (realTime) => realTime,
      getCurrentScaleFactor: () => 1.0,
      getCurrentPhase: () => ({ name: 'Designed Day', progress: 0.5 }),
      addListener: () => {},
      removeListener: () => {}
    };
  }
  
  // 設定のモック
  static mockSettings(settings) {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => {
      if (key.startsWith('another-hour:')) {
        return JSON.stringify({ data: settings });
      }
      return originalGetItem.call(localStorage, key);
    };
  }
  
  // テスト後のクリーンアップ
  static cleanup() {
    // localStorageのリセット
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('another-hour:')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// 統合テスト例
describe('App Integration Tests', () => {
  beforeEach(() => {
    AnotherHourTestUtils.mockSettings({
      mode: 'classic',
      config: { designed24Duration: 1380 }
    });
  });
  
  afterEach(() => {
    AnotherHourTestUtils.cleanup();
  });
  
  test('should initialize with correct Time Design Mode', () => {
    const app = new YourApp();
    expect(app.timeDesignManager.currentMode).toBe('classic');
  });
  
  test('should respond to mode changes', () => {
    const app = new YourApp();
    const spy = jest.spyOn(app, 'updateAppForNewMode');
    
    // モード変更イベントをシミュレート
    window.dispatchEvent(new CustomEvent('another-hour-settings-changed', {
      detail: { mode: 'wake-based', config: {} }
    }));
    
    expect(spy).toHaveBeenCalledWith('wake-based', {});
  });
});
```

## 📚 トラブルシューティング

### よくある問題と解決方法

#### 1. Core Libraryの読み込みエラー
```javascript
// 解決方法: 動的インポートでエラーハンドリング
async function loadCoreLibrary() {
  try {
    const { TimeDesignManager } = await import('@another-hour/core');
    return new TimeDesignManager();
  } catch (error) {
    console.error('Failed to load Core Library:', error);
    // フォールバック実装を返す
    return new MockTimeDesignManager();
  }
}
```

#### 2. 設定同期の失敗
```javascript
// 解決方法: 定期的な同期確認
class SettingsSyncManager {
  constructor() {
    this.lastSyncTime = 0;
    this.syncInterval = 30000; // 30秒
    this.startSyncMonitoring();
  }
  
  startSyncMonitoring() {
    setInterval(() => {
      this.checkSyncStatus();
    }, this.syncInterval);
  }
  
  checkSyncStatus() {
    const lastSync = localStorage.getItem('another-hour:last-sync');
    if (!lastSync || Date.now() - parseInt(lastSync) > this.syncInterval * 2) {
      console.warn('Settings sync may be out of date');
      this.forceSyncRefresh();
    }
  }
}
```

#### 3. パフォーマンス問題
```javascript
// 解決方法: 効率的な更新とデバウンス
class PerformanceOptimizedApp {
  constructor() {
    this.updateDebounced = this.debounce(this.updateDisplay.bind(this), 16); // 60 FPS
  }
  
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  startUpdates() {
    // requestAnimationFrame を使用した効率的な更新
    const update = () => {
      this.updateDebounced();
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
}
```

## 🎯 統合チェックリスト

新規アプリケーション統合時の確認項目：

### 基本統合
- [ ] Core Libraryの依存関係追加
- [ ] Time Design Managerの初期化
- [ ] 設定読み込み機能の実装
- [ ] 統一ナビゲーションボタンの追加

### 時間関連機能
- [ ] リアルタイム時間更新の実装
- [ ] スケールファクターの監視
- [ ] フェーズ変更の対応
- [ ] 時間フォーマットの統一

### UI/UX統合
- [ ] 共通CSSコンポーネントの使用
- [ ] テーマ切り替えの実装
- [ ] レスポンシブデザインの対応
- [ ] アクセシビリティの確保

### データ連携
- [ ] 設定変更イベントの監視
- [ ] localStorageキーの標準化
- [ ] 他アプリとの状態同期
- [ ] エラーハンドリングの実装

### テスト
- [ ] 単体テストの作成
- [ ] 統合テストの実装
- [ ] パフォーマンステスト
- [ ] ユーザビリティテスト

---

**最終更新**: 2025年6月20日  
**バージョン**: 1.0.0  
**対象読者**: 開発者・統合エンジニア