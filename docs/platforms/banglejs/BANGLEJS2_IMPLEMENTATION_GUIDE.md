# Bangle.js2 Another Hour 実装ガイド - 完全版

## 目次
1. [プロジェクト概要と技術要件](#1-プロジェクト概要と技術要件)
2. [開発環境のセットアップ](#2-開発環境のセットアップ)
3. [アプリケーション構造の詳細設計](#3-アプリケーション構造の詳細設計)
4. [コア機能の実装](#4-コア機能の実装)
5. [UI/UXの実装](#5-uiuxの実装)
6. [Bluetooth通信の詳細実装](#6-bluetooth通信の詳細実装)
7. [電力管理とパフォーマンス最適化](#7-電力管理とパフォーマンス最適化)
8. [テストとデバッグ](#8-テストとデバッグ)
9. [デプロイメントと配布](#9-デプロイメントと配布)
10. [トラブルシューティング](#10-トラブルシューティング)

## 1. プロジェクト概要と技術要件

### 1.1 Another Hourの時間モデル

```javascript
// 時間モデルの定義
const TimeModel = {
  // Designed 24: ユーザーが定義する1日の時間数（例：16時間）
  // 実際の24時間を16時間として扱う（1.5倍速）
  
  // Another Hour: 残りの時間（24 - 16 = 8時間）を通常速度で過ごす
  
  // 計算例：
  // 実時間 00:00 → カスタム時間 00:00
  // 実時間 06:00 → カスタム時間 09:00（1.5倍速）
  // 実時間 16:00 → カスタム時間 24:00（Designed 24終了）
  // 実時間 16:01 → Another Hour 開始（通常速度）
  // 実時間 24:00 → 次の日の開始
};
```

### 1.2 Bangle.js2の技術制約

```javascript
// メモリ制約
const MEMORY_LIMITS = {
  totalRAM: 262144,        // 256KB
  availableRAM: 65536,     // 約64KB（システム使用後）
  storageFlash: 8388608,   // 8MB
  maxAppSize: 200000,      // 推奨最大200KB
  maxVariableSize: 2048    // 単一変数の最大サイズ
};

// APIの制約
const API_LIMITATIONS = {
  setInterval: {
    minInterval: 10,       // 10ms（実用的には20ms以上推奨）
    maxTimers: 4           // 同時実行可能なタイマー数
  },
  bluetooth: {
    maxConnections: 1,     // 同時接続数
    maxCharacteristics: 10, // カスタムCharacteristicの最大数
    mtu: 53                // Maximum Transmission Unit
  }
};
```

## 2. 開発環境のセットアップ

### 2.1 前提条件と必要なソフトウェア

#### システム要件
- **OS**: Windows 10/11、macOS 10.15以降、Linux（Ubuntu 20.04以降推奨）
- **Node.js**: v16.0.0以降（v18.x推奨）
- **Git**: 最新版
- **ブラウザ**: Chrome/Edge（Web Bluetooth API対応）
- **スマートフォン**: Android 6.0以降 または iOS 13以降（デバッグ用）

#### 必要なハードウェア
- **Bangle.js2本体**（実機テスト用）
- **Bluetooth 4.0以降対応のPC**（Web Bluetooth用）

### 2.2 ステップバイステップのセットアップ

#### Step 1: Node.jsとnpmの確認・インストール

```bash
# Node.jsのバージョン確認
node --version
# v16.0.0以上であることを確認

# npmのバージョン確認
npm --version
# v7.0.0以上推奨

# Node.jsがない場合はインストール
# macOS (Homebrew使用)
brew install node

# Windows (Chocolatey使用)
choco install nodejs

# Linux (NodeSource経由)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Step 2: Espruino CLIツールのインストール

```bash
# グローバルインストール（推奨）
npm install -g espruino

# インストール確認
espruino --version
# 0.1.40以上であることを確認

# 権限エラーが出る場合（Linux/macOS）
sudo npm install -g espruino --unsafe-perm=true --allow-root
```

#### Step 3: BangleAppsリポジトリのセットアップ

```bash
# 作業ディレクトリの作成
mkdir ~/bangle-development
cd ~/bangle-development

# BangleAppsリポジトリのクローン
git clone https://github.com/espruino/BangleApps.git
cd BangleApps

# 依存関係のインストール
npm install

# ビルドツールのインストール（オプション、最適化用）
npm install -g terser    # JavaScript圧縮用
npm install -g typescript # TypeScript使用時
```

#### Step 4: ローカル開発サーバーの起動

```bash
# BangleAppsディレクトリ内で実行
npm start
# または
npm run local

# 成功すると以下のようなメッセージが表示される：
# App Loader running on http://localhost:8080
# Emulator running on http://localhost:8080/emulator.html
```

#### Step 5: Espruino Web IDEのセットアップ

1. **Chrome Web Store**から[Espruino Web IDE](https://chrome.google.com/webstore/detail/espruino-web-ide/bleoifhkdalbjfbobjackfdifdneehpo)をインストール

2. **または**、オンライン版を使用：https://www.espruino.com/ide/

3. **Web IDEの設定**:
```javascript
// Settings > Communications
// Web Bluetooth: ON
// Throttle Send: ON (推奨値: 10)
// Save on Send: ON (自動保存)

// Settings > Board
// Board Type: BANGLEJS2
```

### 2.3 Another Hourプロジェクトの構築

#### プロジェクト構造の作成

```bash
# BangleApps/apps内にAnother Hourディレクトリを作成
cd ~/bangle-development/BangleApps/apps
mkdir anotherhour
cd anotherhour

# プロジェクト構造の作成
mkdir -p lib test resources
touch app.json
touch anotherhour.app.js
touch anotherhour.boot.js
touch anotherhour.wid.js
touch anotherhour.settings.js
touch anotherhour.lib.js
touch README.md
touch ChangeLog
```

#### 詳細なプロジェクト構造

```
BangleApps/apps/anotherhour/
├── app.json                    # アプリメタデータ（必須）
├── anotherhour.app.js         # メインアプリケーション
├── anotherhour.boot.js        # ブートモジュール（起動時実行）
├── anotherhour.wid.js         # ウィジェット（ステータスバー）
├── anotherhour.settings.js    # 設定画面
├── anotherhour.lib.js         # 共有ライブラリ
├── anotherhour-icon.js        # アプリアイコン（48x48）
├── lib/
│   ├── time-calculator.js     # 時間計算ロジック
│   ├── ble-service.js         # BLE通信サービス
│   ├── power-manager.js       # 電力管理
│   └── debug-utils.js         # デバッグユーティリティ
├── test/
│   ├── time-calculator.test.js # ユニットテスト
│   └── integration.test.js     # 統合テスト
├── resources/
│   ├── screenshots/           # スクリーンショット
│   └── icons/                 # アイコンソース
├── README.md                  # ドキュメント
├── ChangeLog                  # 変更履歴
└── metadata.json             # 追加メタデータ（オプション）
```

### 2.4 開発ツールの設定

#### VS Codeの推奨設定

```bash
# VS Code拡張機能のインストール
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
```

**.vscode/settings.json**:
```json
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "files.eol": "\n",
  "files.encoding": "utf8",
  "javascript.preferences.quoteStyle": "single",
  "eslint.validate": [
    "javascript"
  ],
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.associations": {
    "*.boot.js": "javascript",
    "*.wid.js": "javascript",
    "*.app.js": "javascript"
  }
}
```

**.eslintrc.json**:
```json
{
  "env": {
    "es6": true,
    "node": false
  },
  "parserOptions": {
    "ecmaVersion": 2018,
    "sourceType": "script"
  },
  "globals": {
    "g": "readonly",
    "Bangle": "readonly",
    "E": "readonly",
    "NRF": "readonly",
    "BTN": "readonly",
    "BTN1": "readonly",
    "BTN2": "readonly",
    "BTN3": "readonly",
    "LED": "readonly",
    "LED1": "readonly",
    "LED2": "readonly",
    "require": "readonly",
    "exports": "readonly",
    "global": "readonly",
    "process": "readonly",
    "setInterval": "readonly",
    "setTimeout": "readonly",
    "clearInterval": "readonly",
    "clearTimeout": "readonly",
    "setWatch": "readonly",
    "clearWatch": "readonly",
    "print": "readonly",
    "console": "readonly",
    "WIDGETS": "readonly",
    "load": "readonly"
  },
  "rules": {
    "no-unused-vars": "warn",
    "no-undef": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

### 2.5 Bangle.js2実機の準備

#### 初期設定

1. **Bangle.js2の電源を入れる**
   - ボタンを3秒長押し
   - 起動画面が表示される

2. **Settings > Bluetooth**
   - `BLE`: ON
   - `Programmable`: ON
   - `HID`: OFF（開発時は不要）

3. **Settings > Apps > Bootloader**
   - デフォルトの時計アプリを選択

#### Web IDEとの接続

```javascript
// 1. Chrome/EdgeでWeb IDEを開く
// 2. 左上の接続アイコンをクリック
// 3. "Web Bluetooth"を選択
// 4. デバイスリストから"Bangle.js XXXX"を選択
// 5. ペアリング

// 接続成功時のコンソール出力例：
// Connected to Bangle.js f7a4
// >Espruino 2v19.43
// >Board: BANGLEJS2
```

### 2.6 エミュレータでの開発

#### エミュレータの起動と使用

```bash
# ローカルサーバーが起動している状態で
# ブラウザで以下にアクセス
http://localhost:8080/emulator.html

# パラメータ付き起動（特定のアプリを自動読み込み）
http://localhost:8080/emulator.html?app=anotherhour
```

#### エミュレータの制限事項
- Bluetoothは完全にはエミュレートされない
- バッテリー関連の機能は固定値を返す
- パフォーマンスが実機と異なる
- タッチの精度が実機と異なる

### 2.7 デバッグ環境の構築

#### コンソールログの設定

```javascript
// anotherhour.app.js の先頭に追加
const DEBUG = true; // 本番環境ではfalseに

function log(...args) {
  if (DEBUG) {
    console.log('[AH]', ...args);
  }
}

// 使用例
log('App started');
log('Settings:', settings);
```

#### リモートデバッグ（Bluetooth経由）

```javascript
// Web IDEでの実行
// 1. 実機と接続
// 2. 左側のコンソールでコマンド実行

// メモリ使用状況確認
process.memory()

// 変数の内容確認
global.AnotherHourState

// エラーログ確認
require('Storage').readJSON('anotherhour.errors.json')
```

#### Android/iOSアプリでのデバッグ

**Android - nRF Connect**:
1. Google PlayからnRF Connectをインストール
2. Bangle.js2をスキャン
3. 接続してサービス/Characteristicを確認

**iOS - LightBlue**:
1. App StoreからLightBlueをインストール
2. 同様の手順でBLE通信を確認

### 2.8 ビルドとデプロイの準備

#### package.jsonの作成

```json
{
  "name": "anotherhour-banglejs",
  "version": "1.0.0",
  "description": "Another Hour clock app for Bangle.js 2",
  "scripts": {
    "build": "node scripts/build.js",
    "test": "node test/run-tests.js",
    "lint": "eslint *.js lib/*.js",
    "format": "prettier --write '**/*.js'",
    "validate": "node scripts/validate.js",
    "deploy": "node scripts/deploy.js",
    "watch": "nodemon --watch *.js --exec 'npm run build'"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "prettier": "^2.0.0",
    "terser": "^5.0.0",
    "nodemon": "^2.0.0"
  }
}
```

#### Makefile（オプション）

```makefile
# Another Hour Bangle.js App Makefile

.PHONY: all clean build test deploy

APP_NAME = anotherhour
VERSION = 1.0.0

all: build

clean:
	rm -rf build/
	rm -rf dist/

build:
	mkdir -p build
	# JavaScriptの圧縮
	terser anotherhour.app.js -c -m -o build/anotherhour.app.js
	terser anotherhour.boot.js -c -m -o build/anotherhour.boot.js
	terser anotherhour.wid.js -c -m -o build/anotherhour.wid.js
	cp app.json build/
	# アイコンの生成
	node scripts/generate-icon.js > build/anotherhour-icon.js

test:
	node test/run-tests.js

validate:
	# app.jsonの検証
	node -e "JSON.parse(require('fs').readFileSync('app.json'))"
	# 必須ファイルの確認
	@test -f anotherhour.app.js || (echo "Error: anotherhour.app.js not found" && exit 1)
	@test -f app.json || (echo "Error: app.json not found" && exit 1)

deploy: build
	# BangleAppsへのコピー
	cp -r build/* ../

watch:
	nodemon --watch '*.js' --exec 'make build'
```

### 2.9 トラブルシューティング：開発環境

#### よくある問題と解決方法

**1. Web Bluetoothが使用できない**
```bash
# Chrome/Edgeの設定確認
chrome://flags/#enable-experimental-web-platform-features
# → "Enabled"に設定

# HTTPS or localhostでのみ動作
# 開発時はlocalhostを使用
```

**2. npm installでエラー**
```bash
# node_modulesをクリア
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Python関連のエラー（node-gyp）
# Windows
npm install --global windows-build-tools
# macOS
xcode-select --install
# Linux
sudo apt-get install build-essential
```

**3. Bangle.js2が認識されない**
```javascript
// Bangle.js2側の確認
// Settings > Bluetooth > Programmable: ON
// 一度Bluetoothをオフ→オンにする

// PC側の確認
// Bluetoothが有効か確認
// 他のBluetoothデバイスとの接続を切断
```

**4. エミュレータが起動しない**
```bash
# ポート確認
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# 別のポートで起動
PORT=3000 npm start
```

```json
{
  "id": "anotherhour",
  "name": "Another Hour",
  "shortName": "AH Clock",
  "description": "Redefine your relationship with time",
  "icon": "anotherhour-icon.js",
  "version": "1.0.0",
  "type": "clock",
  "tags": "clock,time,productivity",
  "supports": ["BANGLEJS2"],
  "readme": "README.md",
  "storage": [
    {"name": "anotherhour.app.js", "url": "app.js"},
    {"name": "anotherhour.boot.js", "url": "boot.js"},
    {"name": "anotherhour.wid.js", "url": "widget.js"},
    {"name": "anotherhour.settings.js", "url": "settings.js"},
    {"name": "anotherhour.json", "content": "{\"designedHours\":16,\"active\":false}"}
  ],
  "data": [
    {"wildcard": "anotherhour.data.*"}
  ],
  "sortorder": -10,
  "dependencies": {
    "clock_info": "type"
  },
  "allow_emulator": true
}
```

## 3. アプリケーション構造の詳細設計

### 3.1 状態管理アーキテクチャ

```javascript
// anotherhour.lib.js - 共有ライブラリ
(function() {
  const STATE_FILE = 'anotherhour.json';
  const LOG_FILE = 'anotherhour.log.json';
  
  class AnotherHourState {
    constructor() {
      this.state = this.loadState();
      this.listeners = [];
    }
    
    loadState() {
      const defaultState = {
        designedHours: 16,
        active: false,
        mode: 'designed24', // 'designed24' | 'anotherhour' | 'normal'
        schedule: {
          enabled: false,
          activeHours: {start: 9, end: 17} // 9AM-5PM
        },
        statistics: {
          totalActiveTime: 0,
          lastActivated: null,
          dailyUsage: {}
        }
      };
      
      try {
        const stored = require('Storage').readJSON(STATE_FILE, true);
        return Object.assign(defaultState, stored || {});
      } catch(e) {
        console.log('AH: Error loading state:', e);
        return defaultState;
      }
    }
    
    saveState() {
      try {
        require('Storage').writeJSON(STATE_FILE, this.state);
        this.notifyListeners();
      } catch(e) {
        console.log('AH: Error saving state:', e);
      }
    }
    
    updateState(updates) {
      Object.assign(this.state, updates);
      this.saveState();
    }
    
    addListener(callback) {
      this.listeners.push(callback);
    }
    
    notifyListeners() {
      this.listeners.forEach(cb => {
        try { cb(this.state); } catch(e) {}
      });
    }
    
    // 統計情報の更新
    updateStatistics() {
      const now = new Date();
      const dateKey = now.toISOString().split('T')[0];
      
      if (!this.state.statistics.dailyUsage[dateKey]) {
        this.state.statistics.dailyUsage[dateKey] = 0;
      }
      
      if (this.state.active) {
        this.state.statistics.dailyUsage[dateKey]++;
        this.state.statistics.totalActiveTime++;
      }
      
      // 古いデータの削除（7日以上前）
      const cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      Object.keys(this.state.statistics.dailyUsage).forEach(date => {
        if (new Date(date) < cutoffDate) {
          delete this.state.statistics.dailyUsage[date];
        }
      });
      
      this.saveState();
    }
  }
  
  // グローバルに公開
  global.AnotherHourState = new AnotherHourState();
})();
```

### 3.2 時間計算エンジン

```javascript
// lib/time-calculator.js
(function() {
  class TimeCalculator {
    constructor(designedHours) {
      this.designedHours = designedHours || 16;
      this.scaleFactor = 24 / this.designedHours;
    }
    
    // 実時間からカスタム時間を計算
    calculateCustomTime(realDate) {
      const dayStart = new Date(realDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const msFromDayStart = realDate.getTime() - dayStart.getTime();
      const dayDurationMs = 24 * 60 * 60 * 1000;
      const designedDayDurationMs = this.designedHours * 60 * 60 * 1000;
      
      // Designed 24モードの境界チェック
      if (msFromDayStart >= designedDayDurationMs) {
        // Another Hour期間
        return {
          time: new Date(dayStart.getTime() + msFromDayStart),
          mode: 'anotherhour',
          progress: (msFromDayStart - designedDayDurationMs) / 
                   (dayDurationMs - designedDayDurationMs)
        };
      }
      
      // Designed 24期間
      const scaledMs = msFromDayStart * this.scaleFactor;
      return {
        time: new Date(dayStart.getTime() + scaledMs),
        mode: 'designed24',
        progress: msFromDayStart / designedDayDurationMs
      };
    }
    
    // カスタム時間から実時間を逆算
    calculateRealTime(customDate, mode) {
      const dayStart = new Date(customDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const msFromDayStart = customDate.getTime() - dayStart.getTime();
      
      if (mode === 'anotherhour') {
        return new Date(dayStart.getTime() + msFromDayStart);
      }
      
      // Designed 24モードの逆計算
      const realMs = msFromDayStart / this.scaleFactor;
      return new Date(dayStart.getTime() + realMs);
    }
    
    // 次のモード切り替え時刻を計算
    getNextTransition(realDate) {
      const dayStart = new Date(realDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const designedDayEndMs = dayStart.getTime() + 
                               (this.designedHours * 60 * 60 * 1000);
      
      if (realDate.getTime() < designedDayEndMs) {
        return {
          time: new Date(designedDayEndMs),
          nextMode: 'anotherhour'
        };
      }
      
      // 次の日のDesigned 24開始まで
      const nextDayStart = new Date(dayStart);
      nextDayStart.setDate(nextDayStart.getDate() + 1);
      
      return {
        time: nextDayStart,
        nextMode: 'designed24'
      };
    }
  }
  
  global.TimeCalculator = TimeCalculator;
})();
```

## 4. コア機能の実装

### 4.1 メインアプリケーション

```javascript
// anotherhour.app.js
(function() {
  // ライブラリの読み込み
  eval(require('Storage').read('anotherhour.lib.js'));
  
  const state = global.AnotherHourState;
  const calculator = new global.TimeCalculator(state.state.designedHours);
  
  // UI要素の定義
  const UI = {
    colors: {
      designed24: {
        bg: '#1a1a2e',
        fg: '#eee',
        accent: '#16d9d9'
      },
      anotherhour: {
        bg: '#0f0f0f',
        fg: '#ccc',
        accent: '#ff6b6b'
      },
      normal: {
        bg: g.theme.bg,
        fg: g.theme.fg,
        accent: g.theme.fg2
      }
    },
    fonts: {
      time: 'Vector:50',
      date: '6x8:2',
      mode: '6x8:2',
      small: '6x8:1'
    }
  };
  
  // 描画関数
  function draw() {
    const now = new Date();
    const result = state.state.active ? 
                  calculator.calculateCustomTime(now) : 
                  {time: now, mode: 'normal', progress: 0};
    
    const colors = UI.colors[result.mode];
    
    // 背景のクリア
    g.reset();
    g.setBgColor(colors.bg);
    g.clear();
    
    // 時刻の描画
    g.setColor(colors.fg);
    g.setFont(UI.fonts.time);
    g.setFontAlign(0, 0);
    
    const hours = result.time.getHours();
    const minutes = result.time.getMinutes();
    const timeStr = hours + ':' + ('0' + minutes).substr(-2);
    
    g.drawString(timeStr, g.getWidth()/2, g.getHeight()/2 - 10);
    
    // 秒の描画（小さく）
    if (state.state.active) {
      g.setFont(UI.fonts.small);
      const seconds = result.time.getSeconds();
      g.drawString(':' + ('0' + seconds).substr(-2), 
                   g.getWidth()/2 + 55, g.getHeight()/2 - 5);
    }
    
    // モード表示
    if (result.mode !== 'normal') {
      g.setColor(colors.accent);
      g.setFont(UI.fonts.mode);
      const modeText = result.mode === 'designed24' ? 
                      'DESIGNED TIME' : 'ANOTHER HOUR';
      g.drawString(modeText, g.getWidth()/2, g.getHeight()/2 + 30);
      
      // プログレスバー
      drawProgressBar(result.progress, colors.accent);
    }
    
    // 日付の描画
    g.setColor(colors.fg);
    g.setFont(UI.fonts.date);
    const dateStr = result.time.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    g.drawString(dateStr, g.getWidth()/2, g.getHeight() - 30);
    
    // バッテリーインジケーター
    drawBattery(colors.fg);
  }
  
  // プログレスバーの描画
  function drawProgressBar(progress, color) {
    const width = 120;
    const height = 4;
    const x = (g.getWidth() - width) / 2;
    const y = g.getHeight() / 2 + 45;
    
    g.setColor(g.theme.bg2);
    g.fillRect(x, y, x + width, y + height);
    
    g.setColor(color);
    g.fillRect(x, y, x + (width * progress), y + height);
  }
  
  // バッテリーインジケーターの描画
  function drawBattery(color) {
    const battery = E.getBattery();
    const x = g.getWidth() - 30;
    const y = 10;
    
    g.setColor(color);
    g.drawRect(x, y, x + 20, y + 10);
    g.fillRect(x + 20, y + 3, x + 22, y + 7);
    
    const fillWidth = Math.floor(18 * battery / 100);
    g.fillRect(x + 1, y + 1, x + 1 + fillWidth, y + 9);
  }
  
  // 更新ロジック
  let updateInterval;
  let lastMinute = -1;
  
  function startUpdates() {
    // 既存のインターバルをクリア
    if (updateInterval) clearInterval(updateInterval);
    
    // 効率的な更新間隔の設定
    updateInterval = setInterval(() => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      
      // 分が変わったか、カスタムモードでは秒も更新
      if (currentMinute !== lastMinute || 
          (state.state.active && Bangle.isLCDOn())) {
        lastMinute = currentMinute;
        draw();
        
        // 統計情報の更新（1分ごと）
        if (currentMinute !== lastMinute) {
          state.updateStatistics();
        }
      }
    }, state.state.active ? 1000 : 5000); // カスタムモードでは1秒更新
  }
  
  // タッチイベントの処理
  let touchStartTime = 0;
  
  Bangle.on('touch', (button, xy) => {
    const touchDuration = Date.now() - touchStartTime;
    
    if (button === 1) { // タッチ開始
      touchStartTime = Date.now();
    } else if (button === 2) { // タッチ終了
      if (touchDuration < 500) {
        // 短いタップ：モード切り替え
        state.updateState({active: !state.state.active});
        startUpdates();
        draw();
      } else if (touchDuration < 2000) {
        // 長押し：設定画面を開く
        load('anotherhour.settings.js');
      }
    }
  });
  
  // ボタンイベントの処理
  setWatch(() => {
    // ボタン押下：通常の時計アプリに戻る
    load();
  }, BTN, {edge: 'falling', debounce: 50, repeat: false});
  
  // スワイプでモード詳細表示
  Bangle.on('swipe', (direction) => {
    if (direction === 1 || direction === -1) { // 左右スワイプ
      showModeDetails();
    }
  });
  
  // モード詳細の表示
  function showModeDetails() {
    g.clear();
    g.setFont(UI.fonts.date);
    g.setFontAlign(0, -1);
    
    const lines = [
      'Another Hour Mode',
      '',
      `Designed Hours: ${state.state.designedHours}h`,
      `Scale Factor: ${calculator.scaleFactor.toFixed(2)}x`,
      '',
      'Tap: Toggle Mode',
      'Hold: Settings',
      'Button: Exit'
    ];
    
    lines.forEach((line, i) => {
      g.drawString(line, g.getWidth()/2, 20 + i * 20);
    });
    
    // 3秒後に通常表示に戻る
    setTimeout(draw, 3000);
  }
  
  // アプリケーションの初期化
  function init() {
    // 画面設定
    g.clear();
    Bangle.setLCDTimeout(state.state.active ? 30 : 10);
    Bangle.setLCDPower(true);
    
    // 初回描画
    draw();
    
    // 更新開始
    startUpdates();
    
    // メモリ使用量のモニタリング（デバッグ用）
    if (process.env.VERSION) {
      setInterval(() => {
        const mem = process.memory();
        console.log(`AH: Memory usage: ${mem.usage}/${mem.total}`);
      }, 30000);
    }
  }
  
  // クリーンアップ
  E.on('kill', () => {
    if (updateInterval) clearInterval(updateInterval);
    state.updateStatistics();
  });
  
  // 初期化実行
  init();
})();
```

### 4.2 ブートモジュール

```javascript
// anotherhour.boot.js
(function() {
  // ブート時にライブラリを読み込む
  eval(require('Storage').read('anotherhour.lib.js'));
  
  const BOOT_FILE = 'anotherhour.boot.json';
  
  // ブート設定の読み込み
  let bootConfig = require('Storage').readJSON(BOOT_FILE, true) || {
    interceptSystemTime: false,
    globalTimeOverride: false
  };
  
  // システム時間のインターセプト（実験的機能）
  if (bootConfig.interceptSystemTime && global.AnotherHourState.state.active) {
    const originalGetTime = Date.prototype.getTime;
    const calculator = new global.TimeCalculator(
      global.AnotherHourState.state.designedHours
    );
    
    // Date.prototype.getTimeをオーバーライド
    Date.prototype.getTime = function() {
      const realTime = originalGetTime.call(this);
      
      // Another Hour計算を適用
      if (global.AnotherHourState.state.active) {
        const result = calculator.calculateCustomTime(new Date(realTime));
        return result.time.getTime();
      }
      
      return realTime;
    };
    
    // 元の関数への参照を保持
    global._originalGetTime = originalGetTime;
  }
  
  // グローバルAPIの提供
  global.AnotherHour = {
    getCustomTime: function(date) {
      if (!global.AnotherHourState.state.active) return date;
      
      const calculator = new global.TimeCalculator(
        global.AnotherHourState.state.designedHours
      );
      return calculator.calculateCustomTime(date || new Date());
    },
    
    getRealTime: function(customDate) {
      const calculator = new global.TimeCalculator(
        global.AnotherHourState.state.designedHours
      );
      return calculator.calculateRealTime(customDate, 
        global.AnotherHourState.state.mode);
    },
    
    isActive: function() {
      return global.AnotherHourState.state.active;
    },
    
    getState: function() {
      return global.AnotherHourState.state;
    }
  };
  
  // 他のアプリからの呼び出しを可能にする
  if (global.WIDGETS) {
    global.WIDGETS.anotherhour_api = {
      area: "none",
      getTime: global.AnotherHour.getCustomTime,
      getState: global.AnotherHour.getState
    };
  }
  
  console.log('Another Hour: Boot module loaded');
})();
```

## 5. UI/UXの実装

### 5.1 設定画面

```javascript
// anotherhour.settings.js
(function(back) {
  const state = global.AnotherHourState;
  const settings = state.state;
  
  // メニュー項目
  const menu = {
    '': {'title': 'Another Hour Settings'},
    
    '< Back': () => back(),
    
    'Active': {
      value: settings.active,
      onchange: v => {
        settings.active = v;
        state.saveState();
      }
    },
    
    'Designed Hours': {
      value: settings.designedHours,
      min: 1,
      max: 23,
      step: 1,
      onchange: v => {
        settings.designedHours = v;
        state.saveState();
      }
    },
    
    'Schedule': {
      value: settings.schedule.enabled,
      onchange: v => {
        settings.schedule.enabled = v;
        state.saveState();
      }
    },
    
    'Schedule Start': {
      value: settings.schedule.activeHours.start,
      min: 0,
      max: 23,
      format: v => v + ':00',
      onchange: v => {
        settings.schedule.activeHours.start = v;
        state.saveState();
      }
    },
    
    'Schedule End': {
      value: settings.schedule.activeHours.end,
      min: 0,
      max: 23,
      format: v => v + ':00',
      onchange: v => {
        settings.schedule.activeHours.end = v;
        state.saveState();
      }
    },
    
    'Statistics': () => showStatistics(),
    
    'Reset Stats': () => {
      E.showPrompt('Reset all statistics?').then(result => {
        if (result) {
          settings.statistics = {
            totalActiveTime: 0,
            lastActivated: null,
            dailyUsage: {}
          };
          state.saveState();
          E.showMessage('Statistics reset', 'Another Hour');
          setTimeout(() => E.showMenu(menu), 1500);
        }
      });
    },
    
    'About': () => {
      E.showMessage(
        'Another Hour v1.0.0\n\n' +
        'Redefine your\nrelationship\nwith time\n\n' +
        'by Another Hour Team',
        'About'
      );
      setTimeout(() => E.showMenu(menu), 3000);
    }
  };
  
  // 統計情報の表示
  function showStatistics() {
    const stats = settings.statistics;
    const totalHours = Math.floor(stats.totalActiveTime / 60);
    const totalMinutes = stats.totalActiveTime % 60;
    
    // 過去7日間の使用状況
    const last7Days = {};
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      last7Days[dateKey] = stats.dailyUsage[dateKey] || 0;
    }
    
    // 平均使用時間
    const avgMinutes = Object.values(last7Days).reduce((a, b) => a + b, 0) / 7;
    
    const statsMenu = {
      '': {'title': 'Statistics'},
      '< Back': () => E.showMenu(menu),
      'Total Time': {
        value: `${totalHours}h ${totalMinutes}m`
      },
      'Average Daily': {
        value: `${Math.floor(avgMinutes)}m`
      },
      'Last 7 Days': () => showDailyGraph(last7Days)
    };
    
    E.showMenu(statsMenu);
  }
  
  // 日別使用グラフ
  function showDailyGraph(data) {
    g.clear();
    g.setFont('6x8:1');
    
    const dates = Object.keys(data).sort();
    const values = dates.map(d => data[d]);
    const maxValue = Math.max(...values, 1);
    
    const graphHeight = 100;
    const graphWidth = 140;
    const startX = 20;
    const startY = 40;
    
    // グラフの描画
    g.drawRect(startX, startY, startX + graphWidth, startY + graphHeight);
    
    dates.forEach((date, i) => {
      const x = startX + (i + 0.5) * (graphWidth / dates.length);
      const height = (values[i] / maxValue) * graphHeight;
      const y = startY + graphHeight - height;
      
      g.fillRect(x - 5, y, x + 5, startY + graphHeight);
      
      // 日付ラベル（短縮）
      const day = new Date(date).getDate();
      g.drawString(day, x, startY + graphHeight + 5);
    });
    
    g.drawString('Daily Usage (minutes)', g.getWidth()/2, 20);
    
    // タッチで戻る
    Bangle.once('touch', () => showStatistics());
  }
  
  // メニュー表示
  E.showMenu(menu);
})(load);
```

### 5.2 ウィジェット

```javascript
// anotherhour.wid.js
(() => {
  if (!global.AnotherHourState) return; // ブートモジュールが未読み込み
  
  const WIDGET_WIDTH = 40;
  const WIDGET_HEIGHT = 24;
  
  function draw() {
    if (!this.width) return; // ウィジェットが非表示
    
    const state = global.AnotherHourState.state;
    
    g.reset();
    g.setFont('6x8:1');
    
    if (state.active) {
      // アクティブ時の表示
      const calculator = new global.TimeCalculator(state.designedHours);
      const result = calculator.calculateCustomTime(new Date());
      
      // 背景
      g.setColor(result.mode === 'designed24' ? '#16d9d9' : '#ff6b6b');
      g.fillRect(this.x, this.y, this.x + this.width - 1, 
                 this.y + this.height - 1);
      
      // テキスト
      g.setColor('#000');
      g.drawString('AH', this.x + 2, this.y + 2);
      
      // 時間表示（小さく）
      const time = result.time.getHours() + ':' + 
                  ('0' + result.time.getMinutes()).substr(-2);
      g.drawString(time, this.x + 2, this.y + 12);
    } else {
      // 非アクティブ時
      g.setColor(g.theme.fg);
      g.drawString('AH', this.x + 2, this.y + 8);
    }
  }
  
  // ウィジェットタッチで設定画面
  function onTouch() {
    load('anotherhour.settings.js');
  }
  
  // ウィジェット登録
  WIDGETS['anotherhour'] = {
    area: 'tl',
    width: WIDGET_WIDTH,
    draw: draw,
    touch: onTouch
  };
  
  // 状態変更の監視
  global.AnotherHourState.addListener(() => {
    WIDGETS['anotherhour'].draw();
  });
})();
```

## 6. Bluetooth通信の詳細実装

### 6.1 BLEサービスの実装

```javascript
// lib/ble-service.js
(function() {
  const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  const CHAR_SETTINGS = '12345678-1234-1234-1234-123456789abd';
  const CHAR_TIME = '12345678-1234-1234-1234-123456789abe';
  const CHAR_SYNC = '12345678-1234-1234-1234-123456789abf';
  
  class BLEService {
    constructor() {
      this.isAdvertising = false;
      this.connectedDevice = null;
      this.syncQueue = [];
    }
    
    start() {
      const state = global.AnotherHourState;
      
      NRF.setServices({
        [SERVICE_UUID]: {
          [CHAR_SETTINGS]: {
            readable: true,
            writable: true,
            notify: true,
            value: new Uint8Array(this.encodeSettings(state.state)),
            maxLen: 100,
            onWrite: (evt) => this.handleSettingsWrite(evt)
          },
          [CHAR_TIME]: {
            readable: true,
            notify: true,
            value: new Uint8Array(8), // 64-bit timestamp
            onRead: () => this.handleTimeRead()
          },
          [CHAR_SYNC]: {
            readable: true,
            writable: true,
            notify: true,
            value: new Uint8Array(1),
            onWrite: (evt) => this.handleSyncCommand(evt)
          }
        }
      }, {
        uart: false, // UARTサービスを無効化してメモリ節約
        advertise: [SERVICE_UUID]
      });
      
      // 接続イベントの監視
      NRF.on('connect', (addr) => {
        this.connectedDevice = addr;
        console.log('AH: BLE connected:', addr);
        this.processSyncQueue();
      });
      
      NRF.on('disconnect', () => {
        this.connectedDevice = null;
        console.log('AH: BLE disconnected');
      });
      
      // 定期的なアドバタイジング
      this.startAdvertising();
    }
    
    encodeSettings(settings) {
      // 設定をバイナリ形式にエンコード
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      
      view.setUint8(0, 1); // プロトコルバージョン
      view.setUint8(1, settings.active ? 1 : 0);
      view.setUint8(2, settings.designedHours);
      view.setUint8(3, settings.schedule.enabled ? 1 : 0);
      view.setUint8(4, settings.schedule.activeHours.start);
      view.setUint8(5, settings.schedule.activeHours.end);
      
      // 統計情報（簡易版）
      view.setUint32(6, settings.statistics.totalActiveTime);
      
      return buffer;
    }
    
    decodeSettings(buffer) {
      const view = new DataView(buffer.buffer);
      
      return {
        active: view.getUint8(1) === 1,
        designedHours: view.getUint8(2),
        schedule: {
          enabled: view.getUint8(3) === 1,
          activeHours: {
            start: view.getUint8(4),
            end: view.getUint8(5)
          }
        }
      };
    }
    
    handleSettingsWrite(evt) {
      try {
        const newSettings = this.decodeSettings(evt.data);
        global.AnotherHourState.updateState(newSettings);
        
        // 確認応答
        this.notifySettingsUpdate();
      } catch(e) {
        console.log('AH: BLE settings write error:', e);
      }
    }
    
    handleTimeRead() {
      // 現在のカスタム時間を返す
      const calculator = new global.TimeCalculator(
        global.AnotherHourState.state.designedHours
      );
      const result = calculator.calculateCustomTime(new Date());
      
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setFloat64(0, result.time.getTime());
      
      return new Uint8Array(buffer);
    }
    
    handleSyncCommand(evt) {
      const command = evt.data[0];
      
      switch(command) {
        case 0x01: // フル同期要求
          this.performFullSync();
          break;
        case 0x02: // 統計リセット
          global.AnotherHourState.updateState({
            statistics: {
              totalActiveTime: 0,
              lastActivated: null,
              dailyUsage: {}
            }
          });
          break;
        case 0x03: // ログ送信要求
          this.sendLogs();
          break;
      }
    }
    
    notifySettingsUpdate() {
      if (!this.connectedDevice) return;
      
      try {
        NRF.updateServices({
          [SERVICE_UUID]: {
            [CHAR_SETTINGS]: {
              value: new Uint8Array(
                this.encodeSettings(global.AnotherHourState.state)
              ),
              notify: true
            }
          }
        });
      } catch(e) {
        console.log('AH: BLE notify error:', e);
      }
    }
    
    startAdvertising() {
      if (this.isAdvertising) return;
      
      this.isAdvertising = true;
      
      NRF.setAdvertising([
        {}, // デフォルトのアドバタイジングデータ
        {
          0x07: [SERVICE_UUID], // Complete list of 128-bit UUIDs
          0x09: 'AH Watch'      // Complete local name
        }
      ], {
        interval: 1000,
        connectable: true,
        scannable: true
      });
      
      // 30秒後に省電力モードへ
      setTimeout(() => {
        if (!this.connectedDevice) {
          this.stopAdvertising();
        }
      }, 30000);
    }
    
    stopAdvertising() {
      this.isAdvertising = false;
      NRF.sleep();
    }
    
    // 同期処理
    performFullSync() {
      // 大きなデータの分割送信
      const syncData = {
        settings: global.AnotherHourState.state,
        logs: this.collectLogs(),
        version: '1.0.0'
      };
      
      const json = JSON.stringify(syncData);
      const chunks = this.createChunks(json, 20); // 20バイトチャンク
      
      chunks.forEach((chunk, index) => {
        this.syncQueue.push({
          index: index,
          total: chunks.length,
          data: chunk
        });
      });
      
      this.processSyncQueue();
    }
    
    createChunks(data, chunkSize) {
      const chunks = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
      }
      return chunks;
    }
    
    processSyncQueue() {
      if (!this.connectedDevice || this.syncQueue.length === 0) return;
      
      const chunk = this.syncQueue.shift();
      
      // チャンクヘッダーの作成
      const header = new Uint8Array(4);
      header[0] = 0xFF; // 同期データマーカー
      header[1] = chunk.index;
      header[2] = chunk.total;
      header[3] = chunk.data.length;
      
      const payload = new Uint8Array(header.length + chunk.data.length);
      payload.set(header, 0);
      payload.set(new TextEncoder().encode(chunk.data), header.length);
      
      try {
        NRF.updateServices({
          [SERVICE_UUID]: {
            [CHAR_SYNC]: {
              value: payload,
              notify: true
            }
          }
        });
        
        // 次のチャンクを送信
        setTimeout(() => this.processSyncQueue(), 100);
      } catch(e) {
        console.log('AH: Sync error:', e);
        this.syncQueue = []; // キューをクリア
      }
    }
    
    collectLogs() {
      // 最近のログエントリを収集
      try {
        const logs = require('Storage').readJSON('anotherhour.log.json', true) || [];
        return logs.slice(-50); // 最新50件
      } catch(e) {
        return [];
      }
    }
  }
  
  // グローバルに公開
  global.AnotherHourBLE = new BLEService();
})();
```

### 6.2 コンパニオンアプリとの通信プロトコル

```javascript
// 通信プロトコル仕様
const Protocol = {
  version: 1,
  
  commands: {
    GET_SETTINGS: 0x01,
    SET_SETTINGS: 0x02,
    GET_TIME: 0x03,
    SYNC_REQUEST: 0x04,
    RESET_STATS: 0x05,
    GET_LOGS: 0x06,
    FIRMWARE_UPDATE: 0x07 // 将来の拡張用
  },
  
  responses: {
    ACK: 0x80,
    NACK: 0x81,
    DATA: 0x82,
    ERROR: 0x83
  },
  
  errors: {
    INVALID_COMMAND: 0x01,
    INVALID_PARAMETER: 0x02,
    MEMORY_FULL: 0x03,
    NOT_READY: 0x04
  }
};

// メッセージフォーマット
const MessageFormat = {
  header: {
    version: 1,     // 1 byte
    command: 1,     // 1 byte
    length: 2,      // 2 bytes
    checksum: 2     // 2 bytes
  },
  maxPayloadSize: 244  // 250 - 6 (header)
};
```

## 7. 電力管理とパフォーマンス最適化

### 7.1 電力プロファイル管理

```javascript
// lib/power-manager.js
(function() {
  class PowerManager {
    constructor() {
      this.profile = 'balanced'; // 'efficiency' | 'balanced' | 'performance'
      this.batteryLevel = E.getBattery();
      this.lastActivity = Date.now();
    }
    
    setProfile(profile) {
      this.profile = profile;
      this.applyProfile();
    }
    
    applyProfile() {
      switch(this.profile) {
        case 'efficiency':
          this.applyEfficiencyProfile();
          break;
        case 'performance':
          this.applyPerformanceProfile();
          break;
        default:
          this.applyBalancedProfile();
      }
    }
    
    applyEfficiencyProfile() {
      // 最大限の省電力設定
      Bangle.setLCDTimeout(5);           // 5秒でLCDオフ
      Bangle.setPollInterval(1600);      // 0.625Hz
      Bangle.setHRMPower(false);         // 心拍センサーオフ
      Bangle.setCompassPower(false);     // コンパスオフ
      Bangle.setBarometerPower(false);   // 気圧計オフ
      Bangle.setGPSPower(false);         // GPSオフ
      
      // BLE省電力設定
      NRF.setConnectionInterval(2000);   // 2秒間隔
      NRF.setTxPower(-8);               // 送信出力最小
      
      // 画面輝度調整
      Bangle.setLCDBrightness(0.3);
      
      console.log('AH: Efficiency profile applied');
    }
    
    applyBalancedProfile() {
      // バランス重視の設定
      Bangle.setLCDTimeout(10);          // 10秒でLCDオフ
      Bangle.setPollInterval(800);       // 1.25Hz
      Bangle.setHRMPower(false);
      Bangle.setCompassPower(false);
      Bangle.setBarometerPower(false);
      Bangle.setGPSPower(false);
      
      // BLE標準設定
      NRF.setConnectionInterval(1000);   // 1秒間隔
      NRF.setTxPower(0);                // 標準出力
      
      // 画面輝度調整
      Bangle.setLCDBrightness(0.5);
      
      console.log('AH: Balanced profile applied');
    }
    
    applyPerformanceProfile() {
      // パフォーマンス重視
      Bangle.setLCDTimeout(30);          // 30秒でLCDオフ
      Bangle.setPollInterval(80);        // 12.5Hz
      
      // BLE高速設定
      NRF.setConnectionInterval(50);     // 50ms間隔
      NRF.setTxPower(4);                // 最大出力
      
      // 画面輝度最大
      Bangle.setLCDBrightness(1);
      
      console.log('AH: Performance profile applied');
    }
    
    // 適応的電力管理
    adaptivePowerManagement() {
      const battery = E.getBattery();
      const inactive = Date.now() - this.lastActivity > 300000; // 5分間操作なし
      
      // バッテリー残量に応じた自動調整
      if (battery < 20) {
        this.setProfile('efficiency');
      } else if (battery < 50 && inactive) {
        this.setProfile('efficiency');
      } else if (inactive) {
        this.setProfile('balanced');
      }
      
      this.batteryLevel = battery;
    }
    
    // アクティビティ記録
    recordActivity() {
      this.lastActivity = Date.now();
      
      // アクティブ時は通常プロファイルに戻す
      if (this.profile === 'efficiency' && this.batteryLevel > 20) {
        this.setProfile('balanced');
      }
    }
    
    // メモリ最適化
    optimizeMemory() {
      // 不要な変数のクリア
      delete global._unusedVars;
      
      // ガベージコレクションの強制実行
      if (global.gc) global.gc();
      
      // ストレージの圧縮
      require('Storage').compact();
      
      const mem = process.memory();
      console.log(`AH: Memory optimized: ${mem.usage}/${mem.total}`);
      
      return mem;
    }
    
    // 定期的な最適化タスク
    startOptimizationTask() {
      // 5分ごとに実行
      setInterval(() => {
        this.adaptivePowerManagement();
        
        // メモリ使用率が80%を超えたら最適化
        const mem = process.memory();
        if (mem.usage / mem.total > 0.8) {
          this.optimizeMemory();
        }
      }, 300000);
    }
  }
  
  global.PowerManager = new PowerManager();
})();
```

### 7.2 レンダリング最適化

```javascript
// 効率的な描画システム
const RenderOptimizer = {
  // ダーティフラグシステム
  dirtyRegions: [],
  lastFrame: null,
  
  markDirty: function(x, y, w, h) {
    this.dirtyRegions.push({x, y, w, h});
  },
  
  // 差分描画
  renderDiff: function(newFrame) {
    if (!this.lastFrame) {
      // 初回は全画面描画
      g.drawImage(newFrame);
      this.lastFrame = newFrame;
      return;
    }
    
    // 変更箇所のみ更新
    this.dirtyRegions.forEach(region => {
      g.setClipRect(region.x, region.y, 
                   region.x + region.w, 
                   region.y + region.h);
      g.drawImage(newFrame);
    });
    
    g.setClipRect(0, 0, g.getWidth(), g.getHeight());
    this.dirtyRegions = [];
    this.lastFrame = newFrame;
  },
  
  // フレームスキップ
  frameSkip: function(targetFPS) {
    const frameTime = 1000 / targetFPS;
    let lastFrameTime = 0;
    
    return function(drawFunc) {
      const now = Date.now();
      if (now - lastFrameTime >= frameTime) {
        drawFunc();
        lastFrameTime = now;
      }
    };
  }
};
```

## 8. テストとデバッグ

### 8.1 ユニットテスト

```javascript
// test/time-calculator.test.js
function runTests() {
  const testResults = [];
  
  // テスト1: 基本的な時間計算
  function testBasicCalculation() {
    const calc = new TimeCalculator(16);
    const realTime = new Date('2024-01-01T08:00:00');
    const result = calc.calculateCustomTime(realTime);
    
    const expected = new Date('2024-01-01T12:00:00');
    const passed = result.time.getTime() === expected.getTime();
    
    return {
      name: 'Basic time calculation',
      passed: passed,
      expected: expected.toString(),
      actual: result.time.toString()
    };
  }
  
  // テスト2: モード切り替え境界
  function testModeBoundary() {
    const calc = new TimeCalculator(16);
    const boundaryTime = new Date('2024-01-01T16:00:00');
    const result = calc.calculateCustomTime(boundaryTime);
    
    const passed = result.mode === 'anotherhour';
    
    return {
      name: 'Mode boundary detection',
      passed: passed,
      expected: 'anotherhour',
      actual: result.mode
    };
  }
  
  // テスト3: 逆計算
  function testReverseCalculation() {
    const calc = new TimeCalculator(16);
    const customTime = new Date('2024-01-01T12:00:00');
    const realTime = calc.calculateRealTime(customTime, 'designed24');
    
    const expected = new Date('2024-01-01T08:00:00');
    const passed = Math.abs(realTime.getTime() - expected.getTime()) < 1000;
    
    return {
      name: 'Reverse time calculation',
      passed: passed,
      expected: expected.toString(),
      actual: realTime.toString()
    };
  }
  
  // テスト実行
  testResults.push(testBasicCalculation());
  testResults.push(testModeBoundary());
  testResults.push(testReverseCalculation());
  
  // 結果表示
  console.log('=== Another Hour Test Results ===');
  testResults.forEach(result => {
    console.log(`${result.passed ? '✓' : '✗'} ${result.name}`);
    if (!result.passed) {
      console.log(`  Expected: ${result.expected}`);
      console.log(`  Actual: ${result.actual}`);
    }
  });
  
  const passed = testResults.filter(r => r.passed).length;
  console.log(`\nTotal: ${passed}/${testResults.length} passed`);
  
  return testResults;
}

// エミュレータでの実行
if (process.env.EMULATOR) {
  runTests();
}
```

### 8.2 デバッグユーティリティ

```javascript
// lib/debug-utils.js
const Debug = {
  enabled: false,
  logBuffer: [],
  maxLogs: 100,
  
  log: function(...args) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const message = args.join(' ');
    const entry = `[${timestamp}] ${message}`;
    
    console.log(entry);
    
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxLogs) {
      this.logBuffer.shift();
    }
  },
  
  // パフォーマンス計測
  measure: function(name, func) {
    const start = Date.now();
    const result = func();
    const duration = Date.now() - start;
    
    this.log(`Performance: ${name} took ${duration}ms`);
    return result;
  },
  
  // メモリプロファイリング
  memoryProfile: function() {
    const mem = process.memory();
    const usage = Math.round(mem.usage / mem.total * 100);
    
    this.log(`Memory: ${mem.usage}/${mem.total} (${usage}%)`);
    
    // 詳細なメモリ使用状況
    if (global.gc) {
      global.gc();
      const afterGC = process.memory();
      const freed = mem.usage - afterGC.usage;
      this.log(`GC freed: ${freed} bytes`);
    }
  },
  
  // エラートラッキング
  trackError: function(error, context) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: error.toString(),
      stack: error.stack,
      context: context
    };
    
    // エラーログをストレージに保存
    try {
      let errors = require('Storage').readJSON('anotherhour.errors.json', true) || [];
      errors.push(errorEntry);
      
      // 最新10件のみ保持
      if (errors.length > 10) {
        errors = errors.slice(-10);
      }
      
      require('Storage').writeJSON('anotherhour.errors.json', errors);
    } catch(e) {
      console.log('Failed to save error log:', e);
    }
  },
  
  // 画面にデバッグ情報表示
  showDebugOverlay: function() {
    const mem = process.memory();
    const battery = E.getBattery();
    const state = global.AnotherHourState.state;
    
    g.setFont('6x8:1');
    g.setColor(1, 1, 1);
    g.fillRect(0, 0, 176, 60);
    g.setColor(0, 0, 0);
    
    const info = [
      `Mem: ${Math.round(mem.usage/1024)}/${Math.round(mem.total/1024)}KB`,
      `Bat: ${battery}% Mode: ${state.active ? 'ON' : 'OFF'}`,
      `DH: ${state.designedHours}h BLE: ${NRF.getSecurityStatus().connected ? 'CON' : 'DIS'}`,
      `FW: ${process.version}`
    ];
    
    info.forEach((line, i) => {
      g.drawString(line, 2, 2 + i * 10);
    });
  }
};

// デバッグモードの切り替え
global.enableDebug = function() {
  Debug.enabled = true;
  console.log('Another Hour: Debug mode enabled');
};

global.disableDebug = function() {
  Debug.enabled = false;
  console.log('Another Hour: Debug mode disabled');
};
```

## 9. デプロイメントと配布

### 9.1 ビルドスクリプト

```bash
#!/bin/bash
# build.sh - Another Hourアプリのビルドスクリプト

# 変数定義
APP_NAME="anotherhour"
VERSION="1.0.0"
BUILD_DIR="build"
DIST_DIR="dist"

# ビルドディレクトリの作成
mkdir -p $BUILD_DIR $DIST_DIR

# JavaScriptの最小化
echo "Minifying JavaScript..."
for file in *.js lib/*.js; do
  if [ -f "$file" ]; then
    npx terser $file -c -m --toplevel -o $BUILD_DIR/$(basename $file)
  fi
done

# アイコンの生成
echo "Generating icon..."
node scripts/generate-icon.js > $BUILD_DIR/$APP_NAME-icon.js

# メタデータの更新
echo "Updating metadata..."
cat app.json | jq ".version = \"$VERSION\"" > $BUILD_DIR/app.json

# パッケージの作成
echo "Creating package..."
cd $BUILD_DIR
zip -r ../$DIST_DIR/$APP_NAME-$VERSION.zip *
cd ..

# サイズの確認
echo "Package size:"
du -h $DIST_DIR/$APP_NAME-$VERSION.zip

# 検証
echo "Validating package..."
node scripts/validate-package.js $DIST_DIR/$APP_NAME-$VERSION.zip

echo "Build complete!"
```

### 9.2 アイコン生成スクリプト

```javascript
// scripts/generate-icon.js
const ICON_SIZE = 48;

// Another Hourのロゴ（簡易版）
const iconData = `
  WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW
  WBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBW
  WBBBBBBBBBBBBBBBBBBBWWWWWWBBBBBBBBBBBBBBBBBBBBBBBW
  WBBBBBBBBBBBBBBBBWWWWWWWWWWWWBBBBBBBBBBBBBBBBBBBBW
  WBBBBBBBBBBBBBWWWWWWWWWWWWWWWWWWBBBBBBBBBBBBBBBBBW
  WBBBBBBBBBBBBWWWWWWBBBBBBBBWWWWWWBBBBBBBBBBBBBBBBW
  WBBBBBBBBBBBWWWWWBBBBBBBBBBBBBWWWWWBBBBBBBBBBBBBBBW
  WBBBBBBBBBBWWWWWBBBBBBBBBBBBBBBBWWWWWBBBBBBBBBBBBW
  WBBBBBBBBBWWWWWBBBBBBBBBBBBBBBBBBWWWWWBBBBBBBBBBBW
  WBBBBBBBBWWWWWBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBBBBBW
  WBBBBBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBBBBW
  WBBBBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBBBW
  WBBBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBBW
  WBBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBW
  WBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBW
  WBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBW
  WBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBW
  WWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBW
  WWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWWBW
  WBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBW
  WBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBW
  WBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBW
  WBBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBW
  WBBBBBWWWWWBBBBBBBBBBBBBBBBBBBBBBBBBBWWWWWBBBBBBBW
`;

// バイナリ形式に変換
function generateIcon() {
  const lines = iconData.trim().split('\n');
  const pixels = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    for (let i = 0; i < trimmed.length; i++) {
      pixels.push(trimmed[i] === 'W' ? 1 : 0);
    }
  });
  
  // Espruino形式のイメージ文字列に変換
  const imageString = require('heatshrink').compress(
    new Uint8Array(pixels)
  );
  
  return `require("heatshrink").decompress(atob("${btoa(
    String.fromCharCode.apply(null, imageString)
  )}"))`;
}

console.log(generateIcon());
```

### 9.3 App Loaderへの登録

```javascript
// apps.json への追加エントリ
{
  "id": "anotherhour",
  "name": "Another Hour",
  "shortName": "AH Clock",
  "description": "Redefine your relationship with time - transform 24 hours into your designed day",
  "icon": "anotherhour.png",
  "type": "clock",
  "tags": "clock,time,productivity,tool",
  "supports": ["BANGLEJS2"],
  "readme": "README.md",
  "interface": "interface.html",
  "allow_emulator": true,
  "storage": [
    {"name":"anotherhour.app.js","url":"app.js"},
    {"name":"anotherhour.boot.js","url":"boot.js"}, 
    {"name":"anotherhour.wid.js","url":"widget.js"},
    {"name":"anotherhour.settings.js","url":"settings.js"},
    {"name":"anotherhour.lib.js","url":"lib.js"}
  ],
  "sortorder": -10,
  "version": "1.0.0",
  "files": "anotherhour.app.js,anotherhour.boot.js,anotherhour.wid.js,anotherhour.settings.js,anotherhour.lib.js"
}
```

## 10. トラブルシューティング

### 10.1 一般的な問題と解決策

```javascript
// トラブルシューティングヘルパー
const Troubleshoot = {
  // メモリ不足エラー
  handleLowMemory: function() {
    console.log('AH: Low memory detected, cleaning up...');
    
    // 不要な変数をクリア
    delete global._tempVars;
    delete global._cache;
    
    // ウィジェットの再読み込み
    if (global.WIDGETS) {
      Bangle.loadWidgets();
    }
    
    // ガベージコレクション
    if (global.gc) global.gc();
    
    // ストレージの圧縮
    require('Storage').compact();
    
    // 簡易モードに切り替え
    global.AnotherHourState.updateState({
      simpleMode: true
    });
    
    E.showMessage('Memory optimized\nSwitched to\nsimple mode', 'Another Hour');
  },
  
  // BLE接続問題
  handleBLEIssue: function() {
    console.log('AH: BLE connection issue, resetting...');
    
    // BLEリセット
    NRF.disconnect();
    NRF.restart();
    
    // サービスの再登録
    setTimeout(() => {
      if (global.AnotherHourBLE) {
        global.AnotherHourBLE.start();
      }
    }, 1000);
  },
  
  // 時間計算エラー
  handleTimeError: function(error) {
    console.log('AH: Time calculation error:', error);
    
    // デフォルト設定にリセット
    global.AnotherHourState.updateState({
      active: false,
      designedHours: 16
    });
    
    E.showMessage('Time error\nReset to default', 'Another Hour');
  },
  
  // 設定の破損
  handleCorruptSettings: function() {
    console.log('AH: Settings corrupted, restoring defaults...');
    
    // バックアップから復元を試みる
    try {
      const backup = require('Storage').readJSON('anotherhour.backup.json');
      if (backup) {
        require('Storage').writeJSON('anotherhour.json', backup);
        return true;
      }
    } catch(e) {}
    
    // デフォルト設定を復元
    const defaultSettings = {
      designedHours: 16,
      active: false,
      mode: 'designed24',
      schedule: {
        enabled: false,
        activeHours: {start: 9, end: 17}
      },
      statistics: {
        totalActiveTime: 0,
        lastActivated: null,
        dailyUsage: {}
      }
    };
    
    require('Storage').writeJSON('anotherhour.json', defaultSettings);
    return false;
  }
};

// エラーハンドラーの登録
process.on('uncaughtException', (e) => {
  console.log('AH: Uncaught exception:', e);
  
  if (e.message && e.message.includes('Low Memory')) {
    Troubleshoot.handleLowMemory();
  } else if (e.message && e.message.includes('BLE')) {
    Troubleshoot.handleBLEIssue();
  } else {
    // エラーログに記録
    if (global.Debug) {
      global.Debug.trackError(e, 'uncaught');
    }
  }
});
```

### 10.2 診断ツール

```javascript
// anotherhour.diag.js - 診断ツール
(function() {
  const Diagnostics = {
    runFullDiagnostics: function() {
      const results = {
        timestamp: new Date().toISOString(),
        system: this.checkSystem(),
        memory: this.checkMemory(),
        storage: this.checkStorage(),
        ble: this.checkBLE(),
        settings: this.checkSettings(),
        performance: this.checkPerformance()
      };
      
      this.generateReport(results);
      return results;
    },
    
    checkSystem: function() {
      return {
        firmware: process.version,
        uptime: getTime(),
        battery: E.getBattery(),
        temperature: E.getTemperature()
      };
    },
    
    checkMemory: function() {
      const before = process.memory();
      if (global.gc) global.gc();
      const after = process.memory();
      
      return {
        total: before.total,
        used: before.usage,
        usedPercent: Math.round(before.usage / before.total * 100),
        gcFreed: before.usage - after.usage,
        stackFree: before.stackEndAddress - E.getSizeOf(global)
      };
    },
    
    checkStorage: function() {
      const storage = require('Storage');
      const list = storage.list();
      const ahFiles = list.filter(f => f.startsWith('anotherhour'));
      
      let totalSize = 0;
      ahFiles.forEach(file => {
        const info = storage.list(file)[0];
        if (info) totalSize += info.size;
      });
      
      return {
        totalFiles: list.length,
        ahFiles: ahFiles.length,
        ahSize: totalSize,
        freeSpace: storage.getFree()
      };
    },
    
    checkBLE: function() {
      const status = NRF.getSecurityStatus();
      const advertising = NRF.getAdvertising ? NRF.getAdvertising() : {};
      
      return {
        connected: status.connected,
        advertising: advertising.enabled || false,
        connectionInterval: advertising.interval,
        txPower: NRF.getTxPower ? NRF.getTxPower() : 0,
        address: NRF.getAddress()
      };
    },
    
    checkSettings: function() {
      try {
        const settings = require('Storage').readJSON('anotherhour.json', true);
        const valid = settings && 
                     typeof settings.designedHours === 'number' &&
                     typeof settings.active === 'boolean';
        
        return {
          valid: valid,
          settings: settings,
          backupExists: require('Storage').list('anotherhour.backup.json').length > 0
        };
      } catch(e) {
        return {
          valid: false,
          error: e.toString()
        };
      }
    },
    
    checkPerformance: function() {
      const tests = [];
      
      // 時間計算パフォーマンス
      const calc = new global.TimeCalculator(16);
      const start1 = getTime();
      for (let i = 0; i < 100; i++) {
        calc.calculateCustomTime(new Date());
      }
      const calcTime = (getTime() - start1) * 10; // 100回の平均（ms）
      tests.push({name: 'Time calculation (ms)', value: calcTime.toFixed(2)});
      
      // 描画パフォーマンス
      const start2 = getTime();
      g.clear();
      g.setFont('Vector:50');
      g.drawString('12:34', 88, 88);
      const drawTime = (getTime() - start2) * 1000; // ms
      tests.push({name: 'Draw time (ms)', value: drawTime.toFixed(2)});
      
      // ストレージ読み込み
      const start3 = getTime();
      require('Storage').readJSON('anotherhour.json', true);
      const readTime = (getTime() - start3) * 1000; // ms
      tests.push({name: 'Storage read (ms)', value: readTime.toFixed(2)});
      
      return tests;
    },
    
    generateReport: function(results) {
      const report = [
        '=== Another Hour Diagnostics ===',
        `Date: ${results.timestamp}`,
        '',
        '-- System --',
        `FW: ${results.system.firmware}`,
        `Battery: ${results.system.battery}%`,
        `Temp: ${results.system.temperature}°C`,
        '',
        '-- Memory --',
        `Used: ${results.memory.usedPercent}% (${results.memory.used}/${results.memory.total})`,
        `GC freed: ${results.memory.gcFreed} bytes`,
        '',
        '-- Storage --',
        `AH files: ${results.storage.ahFiles} (${results.storage.ahSize} bytes)`,
        `Free: ${results.storage.freeSpace} bytes`,
        '',
        '-- BLE --',
        `Connected: ${results.ble.connected}`,
        `Address: ${results.ble.address}`,
        '',
        '-- Settings --',
        `Valid: ${results.settings.valid}`,
        `Backup: ${results.settings.backupExists}`,
        '',
        '-- Performance --'
      ];
      
      results.performance.forEach(test => {
        report.push(`${test.name}: ${test.value}`);
      });
      
      // レポートを表示
      E.showScroller({
        h: 40,
        c: report.length,
        draw: (i, r) => {
          g.clearRect(r.x, r.y, r.x + r.w - 1, r.y + r.h - 1);
          g.setFont('6x8:1');
          g.drawString(report[i], r.x, r.y);
        }
      });
      
      // ログファイルに保存
      const logEntry = {
        timestamp: results.timestamp,
        results: results
      };
      
      try {
        let logs = require('Storage').readJSON('anotherhour.diag.json', true) || [];
        logs.push(logEntry);
        if (logs.length > 5) logs.shift(); // 最新5件のみ保持
        require('Storage').writeJSON('anotherhour.diag.json', logs);
      } catch(e) {
        console.log('Failed to save diagnostic log:', e);
      }
    }
  };
  
  // グローバルに公開
  global.AnotherHourDiag = Diagnostics;
  
  // 診断の実行
  Diagnostics.runFullDiagnostics();
})();
```

### 10.3 リカバリーモード

```javascript
// anotherhour.recovery.js - リカバリーモード
(function() {
  E.showMessage('Another Hour\nRecovery Mode', 'Recovery');
  
  const menu = {
    '': {title: 'Recovery Mode'},
    'Reset Settings': () => {
      require('Storage').erase('anotherhour.json');
      E.showMessage('Settings reset', 'Done');
    },
    'Clear Cache': () => {
      const files = require('Storage').list();
      files.forEach(f => {
        if (f.startsWith('anotherhour.cache')) {
          require('Storage').erase(f);
        }
      });
      E.showMessage('Cache cleared', 'Done');
    },
    'Reinstall': () => {
      // すべてのAnother Hour関連ファイルを削除
      const files = require('Storage').list();
      files.forEach(f => {
        if (f.startsWith('anotherhour')) {
          require('Storage').erase(f);
        }
      });
      E.showMessage('Uninstalled\nReinstall from\nApp Loader', 'Done');
      setTimeout(load, 2000);
    },
    'Diagnostics': () => {
      load('anotherhour.diag.js');
    },
    'Exit': () => load()
  };
  
  E.showMenu(menu);
})();
```

## まとめ

この詳細な実装ガイドにより、以下が実現可能です：

1. **完全に機能するAnother Hour時計アプリ**
   - Designed 24とAnother Hourモードの切り替え
   - カスタム時間の正確な計算と表示
   - 既存のBangle.js2機能との共存

2. **Bluetooth経由でのスマートフォン連携**
   - 設定の同期
   - 統計情報の共有
   - リモート制御

3. **3日～1週間のバッテリー持続**
   - 適応的電力管理
   - 効率的な更新アルゴリズム
   - メモリ最適化

4. **堅牢なエラーハンドリング**
   - 自動リカバリー機能
   - 診断ツール
   - デバッグサポート

このドキュメントを使用して、段階的に実装を進めることができます。各セクションは独立して実装可能で、MVPから始めて徐々に機能を追加していくことができます。