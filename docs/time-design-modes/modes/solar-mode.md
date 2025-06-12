# Solar Mode
# Solar Mode

## 📋 Overview

Solar Mode（太陽時モード）は、日の出と日の入りに基づいて時間を設計するモードです。自然のリズムに同期し、季節や地理的位置によって動的に変化する、最も「自然」な時間体系を提供します。

## 🎯 Concept

人類は何千年もの間、太陽のリズムに従って生活してきました。しかし現代の機械的な時計は、この自然なリズムを無視し、冬でも夏でも同じ時間配分を強制します。Solar Modeは、この失われた関係性を取り戻し、自然と調和した生活を可能にします。

### 基本的な時間分割

```
日の出 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 日の入り
   ↑                                         ↑
   └────────── 昼の12時間 ──────────┘
   
日の入り ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 翌日の出
    ↑                                         ↑
    └────────── 夜の12時間 ──────────┘
```

### 季節による変化（東京の例）

```
夏至（6月）: 
日の出 4:30 ━━━━━━━━━━━━━━━━━━━━━━━━━ 日の入り 19:00
実際の昼: 14.5時間 → 12時間に圧縮（0.83倍速）
実際の夜: 9.5時間 → 12時間に拡張（1.26倍速）

冬至（12月）:
日の出 6:50 ━━━━━━━━━━━━━━ 日の入り 16:30
実際の昼: 9.7時間 → 12時間に拡張（1.24倍速）
実際の夜: 14.3時間 → 12時間に圧縮（0.84倍速）
```

## 💡 Use Cases

### 1. 農業従事者/ガーデニング愛好家
- **自然光の最大活用**: 日照時間に合わせた作業計画
- **季節労働の最適化**: 夏は長く、冬は短い活動時間を自然に受け入れる
- **生体リズムの同期**: 植物と同じリズムで生活

### 2. アウトドア活動者
- **登山/ハイキング**: 日の出から日没までを有効活用
- **写真家**: ゴールデンアワーを中心とした時間設計
- **マリンスポーツ**: 潮の満ち引きと太陽時の組み合わせ

### 3. リモートワーカー（自然派）
- **季節性情動障害（SAD）対策**: 冬の短い昼間を効率的に使用
- **省エネルギー**: 自然光で作業し、人工照明を最小限に
- **ワークライフバランス**: 夏は活動的に、冬は内省的に

### 4. 宗教的/精神的実践者
- **瞑想実践者**: 日の出前の静寂な時間の活用
- **宗教的慣習**: 太陽の位置に基づく祈りの時間
- **断食実践**: 日の出から日没までの自然な断食

## ⚙️ Settings

### 基本設定項目

1. **Location**: 位置情報（緯度・経度）または都市選択
2. **Day/Night Ratio**: 
   - Balanced (12:12) - デフォルト
   - Custom (例: 10:14, 14:10)
3. **Transition Handling**: 薄明かりの扱い
   - Sharp: 日の出/日の入りで即座に切り替え
   - Twilight: 薄明かりを含めた緩やかな移行
4. **Seasonal Adjustment**: 
   - Dynamic: 毎日更新
   - Fixed: 特定の日付で固定

### 高度な設定

- **Daylight Saving Time**: 夏時間の考慮
- **Altitude Adjustment**: 標高による日の出/日の入り時刻の補正
- **Weather Integration**: 曇天時の仮想太陽時刻
- **Indoor Mode**: 建物内での作業時の調整

## 🎨 Visual Representation

### アナログ時計での表示

```
夏の昼間（Solar Noon = 12:00）:
        ☀️
         |
    ━━━━━━━━━━━
9 ━━━   🌅   ━━━ 3
  ━━━ (0.83x)━━━
    ━━━━━━━━━
         6

🌅 = 日の出位置（動的）
🌆 = 日の入り位置（動的）
```

### デジタル表示

```
Location: Tokyo, Japan (35.6762°N, 139.6503°E)
Date: June 21, 2025 (Summer Solstice)

🌅 Sunrise: 4:26 AM
🌆 Sunset: 7:01 PM
☀️ Daylight: 14h 35m → Solar 12h (0.82x)
🌙 Night: 9h 25m → Solar 12h (1.27x)

Current: Solar Day 8:34 (Real: 2:15 PM)
Phase: ☀️ Daylight (4h 26m until sunset)
```

## 🔧 Technical Details

### 太陽位置の計算

実際の時間計算は、軽量で高精度な`SunCalc.js`ライブラリに依存しています。これにより、複雑な天文計算を自前で実装することなく、正確な日の出・日の入り時刻を取得できます。

```javascript
// SunCalc.jsを使って太陽時刻を取得する例
// (実際のコードは public/js/time-design/modes/SolarMode.js を参照)

function getSunriseSunset(date, lat, lon) {
  // SunCalcライブラリがロードされているか確認
  if (typeof SunCalc === 'undefined') {
    // フォールバックとして固定値を返す
    return { sunrise: 6 * 60, sunset: 18 * 60 };
  }

  // SunCalc.getTimesはUTCの日付オブジェクトを返す
  const times = SunCalc.getTimes(date, lat, lon);
  
  // BaseModeのユーティリティ関数で「分」に変換
  const sunriseMinutes = this.getMinutesSinceMidnight(times.sunrise, 'UTC');
  const sunsetMinutes = this.getMinutesSinceMidnight(times.sunset, 'UTC');
  
  return { sunrise: sunriseMinutes, sunset: sunsetMinutes };
}
```

### 時間スケーリング

```javascript
function calculateSolarScale(currentTime, solarTimes, dayNightRatio) {
  const { sunrise, sunset } = solarTimes;
  const isDaytime = currentTime >= sunrise && currentTime < sunset;
  
  if (isDaytime) {
    const dayLength = sunset - sunrise;
    const dayHours = dayNightRatio.day; // デフォルト: 12
    return {
      scaleFactor: dayHours / dayLength,
      phase: 'day',
      phaseProgress: (currentTime - sunrise) / dayLength
    };
  } else {
    const nightStart = currentTime >= sunset ? sunset : sunset - 24;
    const nightEnd = currentTime >= sunset ? sunrise + 24 : sunrise;
    const nightLength = nightEnd - nightStart;
    const nightHours = dayNightRatio.night; // デフォルト: 12
    return {
      scaleFactor: nightHours / nightLength,
      phase: 'night',
      phaseProgress: (currentTime - nightStart) / nightLength
    };
  }
}
```

## 📱 UI/UX Guidelines

### 位置情報の設定

テストページでは、以下のようなシンプルなUIで主要都市を切り替えられます。

```
┌─────────────────────────────────────┐
│       🌍 Set Your Location          │
├─────────────────────────────────────┤
│  City:                             │
│    [Tokyo, Japan        ▼]         │
│                                     │
│  Daylight Duration (scaled):       │
│  <  1h ------------------ 12h --- 23h > │
└─────────────────────────────────────┘
```

### 季節変化の可視化

```
┌─────────────────────────────────────┐
│     📊 Seasonal Daylight Chart      │
├─────────────────────────────────────┤
│  Hours                              │
│   16 ┤     ╱╲                      │
│   14 ┤   ╱    ╲    Summer          │
│   12 ┤ ─────────── Equal          │
│   10 ┤ ╱        ╲                  │
│    8 ┤╱   Winter  ╲                │
│      └─────────────────────────     │
│      J F M A M J J A S O N D        │
│                                     │
│  Your location: 35.68°N            │
│  Max variation: ±2.5 hours         │
└─────────────────────────────────────┘
```

## 🚀 Implementation Considerations

### 外部依存

1. **太陽計算ライブラリ**:
   - **SunCalc.js**: テストページで実際に使用している軽量で正確なライブラリ。

2. **位置情報サービス**:
   - ブラウザGeolocation API
   - IPアドレスベースの推定
   - 都市データベース

### パフォーマンス最適化

日の出・日の入り時刻は一日に一度計算すれば十分なため、`SolarMode`のインスタンス内で一度計算した結果をキャッシュするなどの最適化が考えられます。現在のテストページの実装では、表示更新ごとに計算していますが、本番環境ではより高度なキャッシュ戦略が推奨されます。

## 🎯 Success Metrics

- 位置情報の設定完了率
- 季節による使用パターンの変化
- 睡眠の質の改善（自己申告）
- 自然光利用時間の増加

## 💭 Philosophy

Solar Modeは、人類が失った「自然との時間的つながり」を回復させます。電気照明が普及する前、人々の生活は太陽とともにありました。このモードは、現代のテクノロジーを使って、その古代の知恵を再解釈します。

「時間は均一ではない」という真実を受け入れることで、私たちは季節の変化を身体で感じ、自然のリズムと調和した生活を送ることができます。夏の長い昼を有効に使い、冬の長い夜を休息と内省の時間として受け入れる—これが Solar Mode の提案する新しい時間との関係です。

## 📝 Notes

- 極地に近い地域では、白夜や極夜の処理が必要
- 都市生活者向けに「仮想太陽」モードの実装も検討
- 将来的には、月の満ち欠けも組み込んだ「Lunar-Solar Mode」への拡張も可能
- 天候データと連携し、「体感日照時間」での計算も検討

---

*Next: [Implementation Guide →](../implementation-guide.md)*