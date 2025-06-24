# Solar Time Formatter テストガイド

## 概要
SolarTimeFormatterは、Solar Modeで日の出・日の入り時刻を正しく現地時間で表示するための専用モジュールです。

## テストケース

### 1. 基本的な時刻フォーマット
```javascript
// テスト: 東京の日の出時刻
const tokyoSunrise = new Date('2025-06-14T20:30:00Z'); // UTC
const formatted = SolarTimeFormatter.formatTime(tokyoSunrise, 'Asia/Tokyo');
// 期待値: "05:30:00" (東京時間)
```

### 2. 異なるタイムゾーン
```javascript
// テスト: ニューヨークの日の入り時刻
const nySunset = new Date('2025-06-14T23:30:00Z'); // UTC
const formatted = SolarTimeFormatter.formatTime(nySunset, 'America/New_York');
// 期待値: "19:30:00" (ニューヨーク時間)
```

### 3. エラーハンドリング
```javascript
// テスト: 無効な入力
SolarTimeFormatter.formatTime(null, 'Asia/Tokyo'); // "--:--:--"
SolarTimeFormatter.formatTime('invalid', 'Asia/Tokyo'); // "--:--:--"
```

## トラブルシューティング

### 問題: 日本時間で表示される
**原因**: タイムゾーンが正しく渡されていない
**解決策**: 
```javascript
// ❌ 間違い
const formatted = date.toLocaleTimeString();

// ✅ 正しい
const formatted = SolarTimeFormatter.formatTime(date, location.tz);
```

### 問題: location.timezoneとlocation.tzの不一致
**原因**: プロパティ名の不統一
**解決策**: SolarTimeFormatter.getTimezone()を使用
```javascript
const timezone = SolarTimeFormatter.getTimezone(location);
```

### デバッグ方法
```javascript
// コンソールで詳細情報を確認
SolarTimeFormatter.debug(config, solarInfo);
```

## チェックリスト

都市を変更した時に確認すること：
- [ ] 日の出時刻が現地時間で表示されている
- [ ] 日の入り時刻が現地時間で表示されている
- [ ] タイムゾーンが正しく適用されている
- [ ] エラーが発生していない（コンソールを確認）

## 実装場所

- **モジュール**: `/js/utils/SolarTimeFormatter.js`
- **使用箇所**: `/js/ui/ConfigPanel.js`
- **仕様書**: `/docs/ui-specifications/time-design-test-ui-spec.md` 