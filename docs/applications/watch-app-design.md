# Another Hour Watch App Design Guide

## 📱 Overview

Another Hour Watch は、Another Hour の哲学を腕時計やモバイルアプリとして実現するためのプロダクトです。オフライン環境でも完全に動作し、どこでも自分だけの時間を体験できることを目指します。

## 🎯 Design Principles

### 1. **Offline-First Architecture**
- ネットワーク接続なしで全機能が動作
- データの同期は補助的機能として実装
- ローカルストレージを最大限活用

### 2. **Performance Optimization**
- 最小限のメモリフットプリント
- バッテリー効率を最優先
- 即座の応答性（<100ms）

### 3. **Cross-Platform Compatibility**
- iOS / Android ネイティブアプリ
- Apple Watch / Wear OS 対応
- Web PWA としても動作

## 🌍 Global Location Support Strategy

### オフラインファーストアプローチ

時計アプリにおける位置情報対応は、**オフライン動作を前提**に設計します。

#### 実装方針

```javascript
// Location Service Architecture
class LocationService {
    constructor() {
        // Tier 1: 最頻出20都市（約10KB）
        this.coreCities = {
            tokyo: { lat: 35.6762, lng: 139.6503, names: ["東京", "Tokyo"] },
            newyork: { lat: 40.7128, lng: -74.0060, names: ["New York", "ニューヨーク"] },
            london: { lat: 51.5074, lng: -0.1278, names: ["London", "ロンドン"] },
            // ... 17 more cities
        };
        
        // Tier 2: 拡張都市データ（約50KB）- 遅延ロード
        this.extendedCities = null;
        
        // User's recent locations
        this.recentLocations = this.loadRecentLocations();
    }
}
```

### データ構造の最適化

#### 段階的データロード戦略

**Phase 1: Core Cities (20都市)**
```javascript
const CORE_CITIES = {
    // アジア
    "tokyo": { lat: 35.6762, lng: 139.6503, tz: 9 },
    "singapore": { lat: 1.3521, lng: 103.8198, tz: 8 },
    "beijing": { lat: 39.9042, lng: 116.4074, tz: 8 },
    
    // ヨーロッパ
    "london": { lat: 51.5074, lng: -0.1278, tz: 0 },
    "paris": { lat: 48.8566, lng: 2.3522, tz: 1 },
    
    // アメリカ
    "newyork": { lat: 40.7128, lng: -74.0060, tz: -5 },
    "losangeles": { lat: 34.0522, lng: -118.2437, tz: -8 },
    
    // データサイズ: ~10KB
};
```

**Phase 2: Extended Cities (200都市)**
```javascript
// 必要時のみロード
async function loadExtendedCities() {
    if (!this.extendedCities) {
        this.extendedCities = await import('./extended-cities.js');
    }
    return this.extendedCities;
}
```

**Phase 3: Online Search (オプション)**
```javascript
// ネットワーク利用可能時のみ
async function searchOnline(query) {
    if (!navigator.onLine) {
        throw new Error('Offline - use preset cities');
    }
    // Nominatim API or similar
}
```

### スマートウォッチ最適化

#### Apple Watch / Wear OS 向け軽量実装

```javascript
// Watch-specific implementation
const WATCH_CITIES = {
    // 最重要10都市のみ（~5KB）
    // ユーザーの現在地 + 履歴から動的選択
};

class WatchLocationService {
    constructor() {
        this.cities = this.selectTopCities();
        this.currentLocation = this.detectCurrentLocation();
    }
    
    selectTopCities() {
        // 1. ユーザーの現在地の都市
        // 2. 最近使用した3都市
        // 3. グローバル主要6都市
        return this.optimizeForWatch();
    }
}
```

## 📊 Storage Strategy

### データ永続化の階層

1. **Essential Data** (~1KB)
   - 現在の Time Design Mode
   - 基本設定（Designed 24 duration）
   - 最後に選択した都市

2. **User Preferences** (~5KB)
   - 最近使用した場所（最大10件）
   - カスタムプリセット
   - テーマ設定

3. **Cache Data** (~50KB)
   - 拡張都市リスト
   - 太陽時刻計算結果のキャッシュ

### メモリ使用量の目安

| Platform | Target Memory | Max Memory |
|----------|--------------|------------|
| iOS App | < 50MB | 100MB |
| Android App | < 30MB | 80MB |
| Apple Watch | < 10MB | 20MB |
| Wear OS | < 15MB | 30MB |
| Web PWA | < 5MB | 25MB |

## 🔋 Battery Optimization

### 省電力設計

1. **更新頻度の最適化**
   ```javascript
   // 画面表示時: 100ms更新
   // バックグラウンド: 1秒更新
   // 省電力モード: 10秒更新
   ```

2. **計算の最適化**
   ```javascript
   // 太陽位置計算のキャッシュ
   const solarCache = new Map();
   
   function getSolarTimes(date, location) {
       const key = `${date.toDateString()}-${location.id}`;
       if (solarCache.has(key)) {
           return solarCache.get(key);
       }
       // 計算実行...
   }
   ```

## 🎨 UI/UX Guidelines for Watch Apps

### 小画面での表示優先順位

1. **Primary Display**: Another Hour 時刻
2. **Secondary**: 現在のモードインジケーター
3. **Tertiary**: Scale Factor（必要時のみ）

### インタラクション

- **Tap**: モード情報の表示/非表示
- **Long Press**: 設定画面へ
- **Swipe**: 場所の切り替え（Solar Mode）
- **Digital Crown / Bezel**: Designed 24 時間の調整

## 🚀 Implementation Roadmap

### Phase 1: MVP (3ヶ月)
- [ ] iOS/Android アプリの基本実装
- [ ] 20都市のオフラインサポート
- [ ] Classic Mode のみ

### Phase 2: Watch Support (2ヶ月)
- [ ] Apple Watch 対応
- [ ] Wear OS 対応
- [ ] 省電力最適化

### Phase 3: Advanced Features (3ヶ月)
- [ ] 全 Time Design Modes 対応
- [ ] 200都市への拡張
- [ ] オンライン検索（オプション）

### Phase 4: Global Launch (2ヶ月)
- [ ] 多言語対応
- [ ] App Store / Play Store 公開
- [ ] マーケティングキャンペーン

## 📝 Technical Decisions

### なぜオフラインファーストか？

1. **信頼性**: ネットワーク状況に依存しない安定動作
2. **速度**: 即座の応答でストレスフリー
3. **プライバシー**: 位置情報をサーバーに送信しない
4. **バッテリー**: ネットワーク通信による消費を削減

### 将来の拡張性

- **Progressive Enhancement**: 基本機能はオフライン、追加機能はオンライン
- **Modular Architecture**: 必要な機能だけをロード
- **Backward Compatibility**: 古いデバイスでも動作

## 🔒 Privacy & Security

- 位置情報はローカルにのみ保存
- 同期はエンドツーエンド暗号化
- ユーザーデータの収集は最小限
- GDPR / CCPA 準拠

---

*このドキュメントは Another Hour Watch App の設計指針です。実装の詳細は各プラットフォームのガイドラインに従ってください。*