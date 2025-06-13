# Bangle.js2 Another Hour - Multi-Mode Implementation Guide

**Version**: 2.0  
**Date**: 2025-06-13  
**Purpose**: 3つの時間設計モード（Solar, Wake-Based, Core Time）の実装

## 📋 目次

1. [概要](#概要)
2. [アーキテクチャ設計](#アーキテクチャ設計)
3. [モード選択UI](#モード選択ui)
4. [各モードの実装](#各モードの実装)
5. [統合実装](#統合実装)
6. [テストシナリオ](#テストシナリオ)

## 概要

### 3つの時間設計モード

| モード | 説明 | 特徴 |
|--------|------|------|
| **Solar Mode** | 日の出・日の入りに同期 | 自然のリズムに従う |
| **Wake-Based Mode** | 起床時刻から始まる動的な24時間 | 個人の生活リズムに合わせる |
| **Core Time Mode** | 活動時間の前後にAnother Hour | 生産性重視 |

### 技術的要件

- モード選択画面の実装
- 各モードの時間計算ロジック
- 設定の永続化
- スムーズなモード切り替え

## アーキテクチャ設計

### ファイル構成

```
anotherhour/
├── app.js                 # メインアプリ（モード選択UI）
├── lib/
│   ├── modes/
│   │   ├── solar.js       # Solar Mode実装
│   │   ├── wakebased.js   # Wake-Based Mode実装
│   │   └── coretime.js    # Core Time Mode実装
│   ├── ui/
│   │   ├── modeselect.js  # モード選択画面
│   │   └── settings.js    # 各モード設定画面
│   └── common/
│       ├── storage.js     # データ永続化
│       └── timeutils.js   # 共通時間計算
└── metadata.json
```

### データ構造

```javascript
// 設定データ構造
const settings = {
  version: 2,
  currentMode: 'solar', // 'solar' | 'wakebased' | 'coretime'
  globalSettings: {
    showSeconds: true,
    brightness: 0.8
  },
  modeSettings: {
    solar: {
      latitude: 35.6762,  // 東京
      longitude: 139.6503,
      dstAuto: true
    },
    wakebased: {
      wakeTime: "06:00",
      activeHours: 16,
      adaptiveMode: true
    },
    coretime: {
      coreStart: "09:00",
      coreEnd: "17:00",
      coreHours: 8
    }
  }
};
```

## モード選択UI

### 初回起動時のフロー

```javascript
// app.js - メインエントリーポイント
(function() {
  const storage = require('Storage');
  let settings = storage.readJSON('anotherhour.json', true);
  
  // 初回起動判定
  if (!settings || !settings.version || settings.version < 2) {
    showWelcomeScreen();
  } else {
    loadMode(settings.currentMode);
  }
  
  function showWelcomeScreen() {
    g.clear();
    g.setFont("6x8", 2);
    g.setFontAlign(0, 0);
    
    // タイトル
    g.drawString("Another Hour", g.getWidth()/2, 30);
    g.setFont("6x8", 1);
    g.drawString("Choose your time mode", g.getWidth()/2, 50);
    
    // モード選択ボタン
    const modes = [
      {name: "Solar", y: 80, icon: "☀️"},
      {name: "Wake-Based", y: 110, icon: "⏰"},
      {name: "Core Time", y: 140, icon: "📊"}
    ];
    
    modes.forEach((mode, idx) => {
      // ボタン背景
      g.fillRect(20, mode.y-10, g.getWidth()-20, mode.y+10);
      g.setColor(0);
      g.drawString(mode.name, g.getWidth()/2, mode.y);
      g.setColor(1);
    });
    
    // タッチエリア設定
    Bangle.on('touch', function(button, xy) {
      if (!xy) return;
      
      if (xy.y >= 70 && xy.y < 100) {
        selectMode('solar');
      } else if (xy.y >= 100 && xy.y < 130) {
        selectMode('wakebased');
      } else if (xy.y >= 130 && xy.y < 160) {
        selectMode('coretime');
      }
    });
  }
  
  function selectMode(mode) {
    // 初期設定を作成
    const newSettings = {
      version: 2,
      currentMode: mode,
      globalSettings: {
        showSeconds: true,
        brightness: 0.8
      },
      modeSettings: getDefaultModeSettings()
    };
    
    storage.writeJSON('anotherhour.json', newSettings);
    
    // モード別設定画面へ
    showModeSetup(mode);
  }
})();
```

### モード切り替えメニュー

```javascript
// lib/ui/modeselect.js
function showModeMenu() {
  const menu = {
    '': {title: 'Time Mode'},
    'Solar Mode': () => switchToMode('solar'),
    'Wake-Based': () => switchToMode('wakebased'),
    'Core Time': () => switchToMode('coretime'),
    '< Back': () => loadCurrentMode()
  };
  
  // 現在のモードにチェックマーク
  const current = settings.currentMode;
  if (current === 'solar') menu['Solar Mode'] = {value: '✓', onchange: () => switchToMode('solar')};
  if (current === 'wakebased') menu['Wake-Based'] = {value: '✓', onchange: () => switchToMode('wakebased')};
  if (current === 'coretime') menu['Core Time'] = {value: '✓', onchange: () => switchToMode('coretime')};
  
  E.showMenu(menu);
}
```

## 各モードの実装

### Solar Mode

```javascript
// lib/modes/solar.js
const SolarMode = {
  name: 'Solar Mode',
  
  init: function(settings) {
    this.settings = settings.modeSettings.solar;
    this.updateSunTimes();
    
    // 1時間ごとに日の出・日の入り時刻を更新
    this.sunUpdateInterval = setInterval(() => {
      this.updateSunTimes();
    }, 3600000);
  },
  
  updateSunTimes: function() {
    const now = new Date();
    const sunCalc = this.calculateSunTimes(
      now,
      this.settings.latitude,
      this.settings.longitude
    );
    
    this.sunrise = sunCalc.sunrise;
    this.sunset = sunCalc.sunset;
    this.dayLength = (this.sunset - this.sunrise) / 3600000; // hours
  },
  
  calculateCustomTime: function(now) {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const sunriseHour = this.sunrise.getHours() + this.sunrise.getMinutes() / 60;
    const sunsetHour = this.sunset.getHours() + this.sunset.getMinutes() / 60;
    
    if (currentHour < sunriseHour || currentHour >= sunsetHour) {
      // 夜間：Another Hour（通常速度）
      return {
        time: now,
        mode: 'night',
        scaleFactor: 1
      };
    } else {
      // 昼間：Designed Day（スケール）
      const dayProgress = (currentHour - sunriseHour) / (sunsetHour - sunriseHour);
      const scaledHour = 6 + dayProgress * 12; // 6:00-18:00にマップ
      
      return {
        time: this.hoursToDate(scaledHour),
        mode: 'day',
        scaleFactor: 12 / this.dayLength
      };
    }
  },
  
  // 簡易的な日の出・日の入り計算
  calculateSunTimes: function(date, lat, lon) {
    // 実際の実装では SunCalc ライブラリの軽量版を使用
    // ここでは東京の平均的な時刻を返す
    const sunrise = new Date(date);
    sunrise.setHours(6, 0, 0, 0);
    
    const sunset = new Date(date);
    sunset.setHours(18, 0, 0, 0);
    
    return { sunrise, sunset };
  },
  
  getDisplay: function() {
    return {
      modeName: "SOLAR",
      subInfo: `☀️ ${this.sunrise.getHours()}:${this.sunrise.getMinutes().toString().padStart(2,'0')}-${this.sunset.getHours()}:${this.sunset.getMinutes().toString().padStart(2,'0')}`
    };
  }
};
```

### Wake-Based Mode

```javascript
// lib/modes/wakebased.js
const WakeBasedMode = {
  name: 'Wake-Based Mode',
  
  init: function(settings) {
    this.settings = settings.modeSettings.wakebased;
    this.wakeTime = this.parseTime(this.settings.wakeTime);
    this.activeHours = this.settings.activeHours;
  },
  
  calculateCustomTime: function(now) {
    // 今日の起床時刻を計算
    const todayWake = new Date(now);
    todayWake.setHours(this.wakeTime.hours, this.wakeTime.minutes, 0, 0);
    
    // 前日の起床時刻も考慮（深夜の場合）
    if (now < todayWake) {
      todayWake.setDate(todayWake.getDate() - 1);
    }
    
    // 起床からの経過時間
    const elapsedHours = (now - todayWake) / 3600000;
    
    if (elapsedHours < this.activeHours) {
      // Active Time（スケール）
      const scaleFactor = 24 / this.activeHours;
      const scaledHours = elapsedHours * scaleFactor;
      
      const customTime = new Date(todayWake);
      customTime.setHours(customTime.getHours() + Math.floor(scaledHours));
      customTime.setMinutes((scaledHours % 1) * 60);
      
      return {
        time: customTime,
        mode: 'active',
        scaleFactor: scaleFactor
      };
    } else {
      // Rest Time（通常速度）
      return {
        time: now,
        mode: 'rest',
        scaleFactor: 1
      };
    }
  },
  
  parseTime: function(timeStr) {
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0]),
      minutes: parseInt(parts[1])
    };
  },
  
  getDisplay: function() {
    return {
      modeName: "WAKE",
      subInfo: `⏰ ${this.settings.wakeTime} +${this.activeHours}h`
    };
  }
};
```

### Core Time Mode

```javascript
// lib/modes/coretime.js
const CoreTimeMode = {
  name: 'Core Time Mode',
  
  init: function(settings) {
    this.settings = settings.modeSettings.coretime;
    this.coreStart = this.parseTime(this.settings.coreStart);
    this.coreEnd = this.parseTime(this.settings.coreEnd);
    this.coreHours = this.settings.coreHours;
  },
  
  calculateCustomTime: function(now) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const coreStartMinutes = this.coreStart.hours * 60 + this.coreStart.minutes;
    const coreEndMinutes = this.coreEnd.hours * 60 + this.coreEnd.minutes;
    
    if (currentMinutes >= coreStartMinutes && currentMinutes < coreEndMinutes) {
      // Core Time（通常速度）
      return {
        time: now,
        mode: 'core',
        scaleFactor: 1
      };
    } else {
      // Another Hour（スケール）
      let ahMinutes;
      if (currentMinutes < coreStartMinutes) {
        // 朝のAnother Hour
        ahMinutes = currentMinutes;
      } else {
        // 夜のAnother Hour
        ahMinutes = currentMinutes - coreEndMinutes + coreStartMinutes;
      }
      
      const totalAHMinutes = 1440 - (coreEndMinutes - coreStartMinutes);
      const scaleFactor = (24 - this.coreHours) * 60 / totalAHMinutes;
      
      const scaledMinutes = ahMinutes * scaleFactor;
      const customTime = new Date(now);
      customTime.setHours(Math.floor(scaledMinutes / 60));
      customTime.setMinutes(scaledMinutes % 60);
      
      return {
        time: customTime,
        mode: 'another',
        scaleFactor: scaleFactor
      };
    }
  },
  
  parseTime: function(timeStr) {
    const parts = timeStr.split(':');
    return {
      hours: parseInt(parts[0]),
      minutes: parseInt(parts[1])
    };
  },
  
  getDisplay: function() {
    return {
      modeName: "CORE",
      subInfo: `📊 ${this.settings.coreStart}-${this.settings.coreEnd}`
    };
  }
};
```

## 統合実装

### メインクロックアプリ

```javascript
// anotherhour.clock.js - 統合クロックアプリ
(function() {
  let currentMode = null;
  let settings = null;
  let updateInterval = null;
  
  // 初期化
  function init() {
    settings = require('Storage').readJSON('anotherhour.json', true);
    
    if (!settings || !settings.currentMode) {
      // 初回起動
      load('anotherhour.app.js');
      return;
    }
    
    // モードをロード
    loadMode(settings.currentMode);
  }
  
  function loadMode(modeName) {
    // 既存のモードをクリーンアップ
    if (currentMode && currentMode.cleanup) {
      currentMode.cleanup();
    }
    
    // 新しいモードをロード
    switch(modeName) {
      case 'solar':
        currentMode = Object.create(SolarMode);
        break;
      case 'wakebased':
        currentMode = Object.create(WakeBasedMode);
        break;
      case 'coretime':
        currentMode = Object.create(CoreTimeMode);
        break;
    }
    
    currentMode.init(settings);
    startClock();
  }
  
  function startClock() {
    draw();
    
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(draw, settings.globalSettings.showSeconds ? 1000 : 5000);
  }
  
  function draw() {
    g.clear();
    
    const now = new Date();
    const result = currentMode.calculateCustomTime(now);
    const displayTime = result.time;
    
    // 時刻表示
    const hours = displayTime.getHours();
    const minutes = displayTime.getMinutes();
    const seconds = displayTime.getSeconds();
    
    g.setFont("Vector", 35);
    g.setFontAlign(0, 0);
    
    let timeStr;
    if (settings.globalSettings.showSeconds) {
      timeStr = hours.toString().padStart(2, '0') + ':' + 
                minutes.toString().padStart(2, '0') + ':' +
                seconds.toString().padStart(2, '0');
    } else {
      timeStr = hours.toString().padStart(2, '0') + ':' + 
                minutes.toString().padStart(2, '0');
    }
    
    g.drawString(timeStr, g.getWidth()/2, g.getHeight()/2);
    
    // モード情報表示
    const display = currentMode.getDisplay();
    g.setFont("6x8", 2);
    g.drawString(display.modeName, g.getWidth()/2, g.getHeight()/2 + 35);
    
    g.setFont("6x8", 1);
    g.drawString(display.subInfo, g.getWidth()/2, g.getHeight()/2 + 50);
    
    // スケールファクター表示（デバッグ用）
    if (result.scaleFactor !== 1) {
      g.drawString(`×${result.scaleFactor.toFixed(2)}`, g.getWidth()/2, g.getHeight()/2 + 65);
    }
  }
  
  // タッチ操作
  let touchTimer = null;
  Bangle.on('touch', function(button, xy) {
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
      // ダブルタップ：設定メニュー
      showQuickMenu();
    } else {
      touchTimer = setTimeout(() => {
        touchTimer = null;
        // シングルタップ：秒表示切り替え
        settings.globalSettings.showSeconds = !settings.globalSettings.showSeconds;
        require('Storage').writeJSON('anotherhour.json', settings);
        startClock();
      }, 300);
    }
  });
  
  function showQuickMenu() {
    const menu = {
      '': {title: 'Another Hour'},
      'Change Mode': () => load('anotherhour.modeselect.js'),
      'Settings': () => load('anotherhour.settings.js'),
      'Back': () => startClock()
    };
    
    E.showMenu(menu);
  }
  
  // 開始
  init();
})();
```

## テストシナリオ

### 基本動作テスト

1. **初回起動**
   - モード選択画面が表示されるか
   - 各モードを選択できるか
   - 設定が保存されるか

2. **モード切り替え**
   - ダブルタップでメニューが開くか
   - モード変更が即座に反映されるか
   - 設定が維持されるか

3. **各モードの時間計算**
   - Solar: 日の出・日の入り時刻で切り替わるか
   - Wake-Based: 起床時刻から正しく計算されるか
   - Core Time: コア時間内外で正しく動作するか

### パフォーマンステスト

```javascript
// メモリ使用量の確認
function checkMemory() {
  const mem = process.memory();
  console.log(`Memory: ${mem.usage}/${mem.total} (${Math.round(mem.usage/mem.total*100)}%)`);
}

// バッテリー消費の測定
function measureBattery() {
  const start = E.getBattery();
  setTimeout(() => {
    const end = E.getBattery();
    console.log(`Battery drain: ${start - end}% in 1 hour`);
  }, 3600000);
}
```

## 実装スケジュール

| フェーズ | タスク | 工数 |
|---------|--------|------|
| Phase 1 | モード選択UI | 4h |
| Phase 2 | Solar Mode実装 | 6h |
| Phase 3 | Wake-Based Mode実装 | 4h |
| Phase 4 | Core Time Mode実装 | 4h |
| Phase 5 | 統合・テスト | 4h |
| **合計** | | **22h** |

## 注意事項

1. **メモリ管理**
   - 各モードは必要時のみロード
   - 不要なインターバルは必ずクリア

2. **バッテリー最適化**
   - 更新頻度は最小限に
   - 不要な再描画を避ける

3. **エラーハンドリング**
   - 設定ファイルの破損に対処
   - モード切り替え時の例外処理

---

*このドキュメントは、Another Hour v2.0のマルチモード実装のための技術仕様書です。*