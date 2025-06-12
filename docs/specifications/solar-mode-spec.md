# Solar Mode Complete Specification
**Another Hour Project - Solar Mode v2.0**

## 🌞 Core Concept

Solar Modeは、太陽の動きに基づいて時間を再定義するモードです。**南中時刻（太陽が最も高い位置にある時刻）を常に正午12:00として固定**し、昼夜の長さを個人の好みに合わせて調整できます。

### 基本原則

1. **南中時刻 = 12:00** （不変）
2. **南中時刻 = (日の出時刻 + 日の入り時刻) ÷ 2**
3. 昼と夜の時間を独立してスケーリング
4. 実際の太陽の位置と時計の関係を保持

## 📐 Mathematical Foundation

### 1. 南中時刻の計算

```
solar_noon_real = (sunrise_time + sunset_time) / 2
```

例：東京の6月21日
- 日の出: 04:26
- 日の入り: 19:00
- 南中時刻（実時間）: 11:43

### 2. 時刻のマッピング

実時間からAnother Hour時間への変換式：

```
if (real_time < sunrise_time):
    # 深夜〜日の出（夜の後半）
    ah_time = map_night_time(real_time, previous_sunset, sunrise_time)
    
elif (real_time < sunset_time):
    # 日の出〜日の入り（昼）
    ah_time = map_day_time(real_time, sunrise_time, sunset_time)
    
else:
    # 日の入り〜深夜（夜の前半）
    ah_time = map_night_time(real_time, sunset_time, next_sunrise)
```

### 3. 昼間のマッピング関数

```
map_day_time(real_time, sunrise, sunset):
    solar_noon_real = (sunrise + sunset) / 2
    
    if (real_time <= solar_noon_real):
        # 午前：日の出から南中まで
        progress = (real_time - sunrise) / (solar_noon_real - sunrise)
        ah_time = 6:00 + (6 * progress)  # 6:00 → 12:00
    else:
        # 午後：南中から日の入りまで
        progress = (real_time - solar_noon_real) / (sunset - solar_noon_real)
        ah_time = 12:00 + (6 * progress)  # 12:00 → 18:00
```

### 4. 夜間のマッピング関数

```
map_night_time(real_time, start_time, end_time):
    # start_time: 日の入り時刻 or 0:00
    # end_time: 0:00 or 日の出時刻
    
    night_duration_real = end_time - start_time
    night_duration_ah = 12 hours  # デフォルト値
    
    if (start_time == sunset):
        # 夜の前半：18:00 → 0:00
        progress = (real_time - start_time) / night_duration_real
        ah_time = 18:00 + (6 * progress)
    else:
        # 夜の後半：0:00 → 6:00
        progress = (real_time - start_time) / night_duration_real
        ah_time = 0:00 + (6 * progress)
```

## 🎚️ Customization Parameters

### デフォルト設定
- **昼の長さ**: 実際の昼の長さ（日の出〜日の入り）を12時間にマッピング
- **夜の長さ**: 実際の夜の長さ（日の入り〜翌日の出）を12時間にマッピング
- **南中時刻**: 常に12:00で固定

### カスタマイズ可能な要素

1. **Day Hours (昼の時間)**
   - 範囲: 1〜23時間
   - デフォルト: その日の実際の昼の長さ（時間単位で丸め）
   - 効果: 昼の体感時間を調整

2. **Night Hours (夜の時間)**
   - 自動計算: 24 - Day Hours
   - 効果: 夜の体感時間を調整

### カスタマイズ時の制約

**重要**: カスタマイズしても以下は保持される
- 南中時刻は必ず12:00
- 日の出時刻は必ず6:00付近（±調整値）
- 日の入り時刻は必ず18:00付近（±調整値）

## 🌍 Location-Based Calculations

### サポート都市（初期実装）

| 都市 | 緯度 | 経度 | タイムゾーン |
|------|------|------|-------------|
| Tokyo | 35.6762 | 139.6503 | Asia/Tokyo |
| Kumamoto | 32.8032 | 130.7079 | Asia/Tokyo |
| New York | 40.7128 | -74.0060 | America/New_York |
| London | 51.5074 | -0.1278 | Europe/London |
| Singapore | 1.3521 | 103.8198 | Asia/Singapore |
| Sydney | -33.8688 | 151.2093 | Australia/Sydney |

### 太陽時刻の計算

SunCalc.jsライブラリを使用：
```javascript
const times = SunCalc.getTimes(date, latitude, longitude);
const sunrise = times.sunrise;
const sunset = times.sunset;
const solarNoon = times.solarNoon;
```

## 🔄 Time Scale Factors

### Scale Factor計算

昼のScale Factor:
```
day_scale_factor = designed_day_hours / actual_day_hours
```

夜のScale Factor:
```
night_scale_factor = designed_night_hours / actual_night_hours
```

### 制限事項
- 最小Scale Factor: 0.1x（10倍遅い）
- 最大Scale Factor: 10.0x（10倍速い）
- 推奨範囲: 0.5x〜2.0x

## 🖼️ UI/UX Specifications

### 設定画面

```
┌─────────────────────────────────────┐
│ Solar Mode Configuration            │
├─────────────────────────────────────┤
│ Location: [Tokyo      ▼]            │
│                                     │
│ Today's Solar Information:          │
│ • Sunrise: 04:26                    │
│ • Sunset:  19:00                    │
│ • Daylight: 14h 34m                 │
│ • Solar Noon: 11:43 → 12:00 AH      │
│                                     │
│ Day Hours: [14.5 ▼] hours           │
│ ├──────────────┤ (current: 14h 34m) │
│ 1             12              23     │
│                                     │
│ Time Scaling:                       │
│ • Day: 0.82x (slower)               │
│ • Night: 1.28x (faster)             │
│                                     │
│ [Reset to Actual] [Apply]           │
└─────────────────────────────────────┘
```

### 時計表示

アナログ時計での表現：
- 12:00の位置に太陽のアイコン
- 昼間（6:00-18:00）: 明るい背景
- 夜間（18:00-6:00）: 暗い背景
- 現在の太陽位置インジケーター

## 📊 Example Scenarios

### シナリオ1: 東京の夏至
- 実際の昼: 14時間34分
- 設定: Day Hours = 12時間
- 結果: 昼は0.82倍速（ゆっくり）、夜は1.28倍速（速い）

### シナリオ2: ロンドンの冬至
- 実際の昼: 7時間49分
- 設定: Day Hours = 12時間
- 結果: 昼は1.53倍速（速い）、夜は0.67倍速（ゆっくり）

### シナリオ3: 赤道直下（シンガポール）
- 実際の昼: 12時間（年間ほぼ一定）
- 設定: Day Hours = 12時間
- 結果: 昼夜ともに1.0倍速（通常速度）

## 🔧 Implementation Requirements

### 必須ライブラリ
- SunCalc.js - 太陽位置計算
- Moment.js or date-fns - 時刻処理
- GeolocationAPI - 位置情報取得（オプション）

### データ更新頻度
- 太陽時刻: 1日1回（深夜0時）
- 時刻計算: リアルタイム（10-100ms間隔）
- 位置情報: アプリ起動時 or 手動変更時

### エラーハンドリング
- 位置情報取得失敗 → デフォルト都市（東京）を使用
- 極地での白夜/極夜 → 特別モード or 警告表示
- ネットワークエラー → キャッシュされた太陽時刻を使用

## 🧪 Test Cases

### 基本機能テスト
1. 各都市での太陽時刻取得
2. 南中時刻が12:00になることの確認
3. Scale Factor計算の正確性
4. 日付変更時の動作

### エッジケーステスト
1. 白夜地域（夏のストックホルム）
2. 極夜地域（冬のトロムソ）
3. 日付変更線付近
4. サマータイム切り替え時

### パフォーマンステスト
1. 1秒間に100回の時刻計算
2. 複数タブでの同時動作
3. 長時間動作時のメモリリーク

## 📝 Future Enhancements

### Phase 2
- 月の満ち欠けとの連動
- 潮汐情報の統合
- 天候による体感時間の調整

### Phase 3
- AIによる最適なDay Hours提案
- 健康データとの連携
- チーム間での太陽時刻共有

## 🎯 Success Criteria

1. **精度**: 南中時刻の誤差±1分以内
2. **パフォーマンス**: 時刻計算<1ms
3. **使いやすさ**: 3クリック以内で設定完了
4. **安定性**: 24時間連続動作でエラーなし