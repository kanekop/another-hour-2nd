# アプリケーション統合仕様書

## 📋 概要

Another Hourモノレポ内の各アプリケーション間の統合、データ共有、および一貫したユーザーエクスペリエンスを実現するための技術仕様書です。

### 🎯 統合目標

- **状態同期**: Time Design Modes設定の全アプリ間同期
- **一貫性**: 統一されたUI/UX体験
- **効率性**: 重複するロジックの共有
- **拡張性**: 新規アプリケーションの容易な統合

## 🏗️ アーキテクチャ概要

### システム構成

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface Layer                   │
├─────────────────┬─────────────────┬─────────────────────┤
│  Scheduler-Web  │   Clock-Web     │    Watch-App        │
│  (Port 3000)    │  (Embedded)     │   (Standalone)      │
├─────────────────┼─────────────────┼─────────────────────┤
│                 │                 │                     │
│  Timer/Stopwatch│   Time Display  │   Sync Interface    │
│    Features     │    Features     │                     │
└─────────────────┴─────────────────┴─────────────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│            Shared Integration Layer                     │
├─────────────────────────────────────────────────────────┤
│  • State Management (localStorage/sessionStorage)       │
│  • Event Notification System                           │
│  • Configuration Synchronization                       │
│  • Cross-App Navigation                                │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              Core Library (@another-hour/core)         │
├─────────────────────────────────────────────────────────┤
│  • Time Design Modes Implementation                    │
│  • Time Calculation Engine                             │
│  • Data Validation & Type Safety                       │
│  • Utility Functions                                   │
└─────────────────────────────────────────────────────────┘
```

## 📊 データフロー仕様

### 1. 設定データの流れ

#### 設定更新フロー
```
User Action (任意のアプリ)
    ↓
UI Setting Change
    ↓
Validation (Core Library)
    ↓
localStorage Update
    ↓
Event Notification (Custom Event)
    ↓
All Apps Sync Update
    ↓
UI Refresh
```

#### 設定ロードフロー
```
App Initialization
    ↓
Read from localStorage
    ↓
Validate & Parse (Core Library)
    ↓
Apply Default Values
    ↓
Initialize Time Design Manager
    ↓
Start Real-time Updates
```

### 2. リアルタイム同期

```javascript
// 設定変更通知の標準形式
const settingChangeEvent = new CustomEvent('another-hour-settings-changed', {
  detail: {
    type: 'time-design-mode',
    mode: 'wake-based',
    config: { /* 新しい設定 */ },
    timestamp: Date.now(),
    sourceApp: 'scheduler-web'
  }
});
```

## 🔧 共有データ構造

### localStorage キー管理

```javascript
// 標準的なキー命名規則
const STORAGE_KEYS = {
  // Time Design Modes関連
  CURRENT_MODE: 'another-hour:current-mode',
  MODE_CONFIGS: 'another-hour:mode-configs',
  USER_SETTINGS: 'another-hour:user-settings',
  
  // アプリ固有設定
  SCHEDULER_STATE: 'another-hour:scheduler:state',
  CLOCK_THEME: 'another-hour:clock:theme',
  TIMER_HISTORY: 'another-hour:timer:history',
  
  // 一時的な状態
  SESSION_DATA: 'another-hour:session:data',
  LAST_SYNC: 'another-hour:last-sync'
};
```

### 共有設定オブジェクト

```typescript
interface SharedAppState {
  // Current Time Design Mode
  currentMode: {
    mode: TimeDesignMode;
    config: ModeConfiguration;
    lastUpdated: Date;
  };
  
  // User Preferences
  userSettings: {
    defaultTimezone: string;
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
  };
  
  // App-specific states
  appStates: {
    scheduler?: SchedulerAppState;
    clock?: ClockAppState;
    timer?: TimerAppState;
    stopwatch?: StopwatchAppState;
  };
  
  // Synchronization metadata
  sync: {
    version: number;
    lastSync: Date;
    source: string;
  };
}
```

## 🔄 同期メカニズム

### 1. イベントベース通知システム

```javascript
// 統一イベントマネージャー
class AnotherHourEventManager {
  static events = {
    MODE_CHANGED: 'ah:mode:changed',
    CONFIG_UPDATED: 'ah:config:updated',
    THEME_CHANGED: 'ah:theme:changed',
    APP_SYNC: 'ah:app:sync'
  };
  
  static emit(eventType, data) {
    window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }
  
  static on(eventType, callback) {
    window.addEventListener(eventType, callback);
  }
  
  static off(eventType, callback) {
    window.removeEventListener(eventType, callback);
  }
}
```

### 2. 設定同期ユーティリティ

```javascript
// 共有設定管理クラス
class SharedSettingsManager {
  static async saveSettings(key, data) {
    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: this.getVersion()
      });
      localStorage.setItem(key, serialized);
      
      // 他のアプリに通知
      AnotherHourEventManager.emit(AnotherHourEventManager.events.CONFIG_UPDATED, {
        key,
        data
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }
  
  static loadSettings(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      
      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to load settings:', error);
      return defaultValue;
    }
  }
  
  static getVersion() {
    return '1.0.0'; // アプリバージョンに連動
  }
}
```

## 📱 各アプリケーションの統合仕様

### 1. Scheduler-Web

**役割**: メインハブアプリケーション
**統合ポイント**:
- Time Design Modes設定の主要UI
- 他アプリへのナビゲーションハブ
- カレンダー統合によるイベント管理

```javascript
// Scheduler-Web 統合実装例
class SchedulerIntegration {
  constructor() {
    this.setupTimeDesignSync();
    this.setupNavigationSync();
  }
  
  setupTimeDesignSync() {
    // Core Libraryからの設定変更を監視
    AnotherHourEventManager.on(AnotherHourEventManager.events.MODE_CHANGED, 
      this.handleModeChange.bind(this));
  }
  
  handleModeChange(event) {
    const { mode, config } = event.detail;
    // カレンダー表示を新しいモードに合わせて更新
    this.updateCalendarView(mode, config);
  }
}
```

### 2. Clock-Web

**役割**: Time Design体験の中核
**統合ポイント**:
- リアルタイム時間表示
- アナログ・デジタル時計の同期
- テーマの自動切り替え

```javascript
// Clock-Web 統合実装例
class ClockIntegration {
  constructor() {
    this.timeDesignManager = new TimeDesignManager();
    this.setupRealTimeSync();
  }
  
  setupRealTimeSync() {
    // 60FPSでの時間更新
    setInterval(() => {
      const currentTime = new Date();
      const ahTime = this.timeDesignManager.calculateAnotherHourTime(currentTime);
      this.updateDisplay(ahTime);
    }, 16); // ~60 FPS
  }
}
```

### 3. Timer & Stopwatch

**役割**: 時間測定機能
**統合ポイント**:
- Time Design Modesに基づく動的スケーリング
- 測定結果の統一フォーマット

```javascript
// Timer 統合実装例
class TimerIntegration {
  constructor() {
    this.scaleFactor = 1.0;
    this.setupScaleFactorSync();
  }
  
  setupScaleFactorSync() {
    AnotherHourEventManager.on(AnotherHourEventManager.events.CONFIG_UPDATED, 
      this.updateScaleFactor.bind(this));
  }
  
  updateScaleFactor() {
    // 現在のTime Design Modeからスケールファクターを取得
    this.scaleFactor = this.timeDesignManager.getCurrentScaleFactor();
    this.adjustTimerSpeed();
  }
}
```

### 4. Watch-App

**役割**: ウェアラブル統合
**統合ポイント**:
- 設定の読み取り専用同期
- 軽量データ転送

```javascript
// Watch-App 統合実装例
class WatchIntegration {
  async syncFromMainApp() {
    try {
      // メインアプリからの設定読み込み
      const config = SharedSettingsManager.loadSettings(STORAGE_KEYS.MODE_CONFIGS);
      await this.updateWatchDisplay(config);
    } catch (error) {
      console.log('Sync failed, using local cache');
    }
  }
}
```

## 🔀 ナビゲーション統合

### 統一ナビゲーションシステム

```javascript
// アプリ間ナビゲーション管理
class AppNavigationManager {
  static apps = {
    HOME: '/',
    SCHEDULER: '/pages/scheduler.html',
    CLOCK: '/pages/personalized-ah-clock.html', 
    TIMER: '/pages/timer.html',
    STOPWATCH: '/pages/stopwatch.html',
    SETTINGS: '/pages/settings.html'
  };
  
  static navigate(target, params = {}) {
    // 現在の状態を保存
    this.saveCurrentState();
    
    // パラメータをURLに付加
    const url = this.buildURL(target, params);
    
    // ナビゲーション実行
    window.location.href = url;
  }
  
  static saveCurrentState() {
    // 現在のアプリ状態を一時保存
    SharedSettingsManager.saveSettings(STORAGE_KEYS.SESSION_DATA, {
      currentApp: window.location.pathname,
      timestamp: Date.now(),
      state: this.getCurrentAppState()
    });
  }
}
```

## ⚡ パフォーマンス最適化

### 1. 遅延読み込み

```javascript
// Core Library の遅延読み込み
class LazyLoader {
  static async loadCoreLibrary() {
    if (!window.AnotherHourCore) {
      const { TimeDesignManager } = await import('@another-hour/core');
      window.AnotherHourCore = { TimeDesignManager };
    }
    return window.AnotherHourCore;
  }
}
```

### 2. キャッシュ戦略

```javascript
// 設定変更の効率的なキャッシング
class SettingsCache {
  static cache = new Map();
  static TTL = 5 * 60 * 1000; // 5分
  
  static get(key) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.TTL) {
      return entry.data;
    }
    return null;
  }
  
  static set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

## 🧪 テスト戦略

### 統合テストのアプローチ

```javascript
// 統合テストスイート例
describe('App Integration', () => {
  test('Settings sync between apps', async () => {
    // Scheduler-Webで設定変更
    await SchedulerApp.updateTimeDesignMode('wake-based', config);
    
    // Clock-Webで変更が反映されることを確認
    const clockConfig = await ClockApp.getCurrentConfig();
    expect(clockConfig.mode).toBe('wake-based');
  });
  
  test('Navigation preserves state', () => {
    // 状態を設定
    TimerApp.setState({ remaining: 300 });
    
    // 他のアプリにナビゲート
    AppNavigationManager.navigate(AppNavigationManager.apps.CLOCK);
    
    // 戻った時に状態が保持されていることを確認
    AppNavigationManager.navigate(AppNavigationManager.apps.TIMER);
    expect(TimerApp.getState().remaining).toBe(300);
  });
});
```

## 🔒 セキュリティ考慮事項

### データ保護

```javascript
// 機密データの暗号化（必要に応じて）
class SecureStorage {
  static encryptSensitiveData(data) {
    // OAuth トークンなどの機密データは暗号化
    return btoa(JSON.stringify(data)); // 基本的な実装例
  }
  
  static decryptSensitiveData(encryptedData) {
    return JSON.parse(atob(encryptedData));
  }
}
```

## 📈 モニタリング & デバッグ

### 統合デバッグツール

```javascript
// 開発者向けデバッグユーティリティ
class IntegrationDebugger {
  static getSystemStatus() {
    return {
      coreLibraryLoaded: !!window.AnotherHourCore,
      currentMode: SharedSettingsManager.loadSettings(STORAGE_KEYS.CURRENT_MODE),
      activeApps: this.getActiveApps(),
      eventListeners: this.getActiveEventListeners(),
      storageUsage: this.getStorageUsage()
    };
  }
  
  static logIntegrationEvents() {
    Object.values(AnotherHourEventManager.events).forEach(eventType => {
      AnotherHourEventManager.on(eventType, (event) => {
        console.log(`[Integration] ${eventType}:`, event.detail);
      });
    });
  }
}
```

## 🚀 今後の拡張計画

### Phase 1: 基本統合強化
- [ ] リアルタイム同期の安定性向上
- [ ] エラーハンドリングの充実
- [ ] パフォーマンス監視機能

### Phase 2: 高度な機能
- [ ] オフライン同期サポート
- [ ] 複数デバイス間同期
- [ ] A/Bテスト機能

### Phase 3: 企業機能
- [ ] チーム設定共有
- [ ] 管理者ダッシュボード
- [ ] 使用状況分析

---

**最終更新**: 2025年6月20日  
**バージョン**: 1.0.0  
**ステータス**: 実装ガイドライン策定完了