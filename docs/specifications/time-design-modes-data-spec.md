# Time Design Modes データ仕様書

## 📋 概要

Another Hour プロジェクトの Time Design Modes システムで必要となるデータ構造の仕様書です。各モードがユーザーに時間を表示するために必要な情報を定義しています。

## 👤 User（ユーザー）データ

```yaml
User:
  - User ID                 # ユーザー識別子
  - Default Timezone        # デフォルトタイムゾーン
  - Default Location        # デフォルト位置情報（Solar Mode用：都市/緯度経度）
  - Day Start Time          # 一日の開始時刻（デフォルト: 00:00）
  - Preferred Mode          # 優先使用モード
```

### 備考
- **Day Start Time**: 一日がいつ始まるかの設定。デフォルトは00:00を推奨。変更は上級者向けオプションとして提供。

## 🎨 各モードの必要データ

### Classic Mode（クラシックモード）
```yaml
Classic Mode:
  - Designed 24 Duration    # Designed 24の長さ（分単位、例：1380 = 23時間）
```

### Core Time Mode（コアタイムモード）
```yaml
Core Time Mode:
  - Core Time Start         # コアタイム開始時刻（例：07:00）
  - Core Time End           # コアタイム終了時刻（例：22:00）
  - Min Core Hours          # 最低コアタイム時間（時間単位、デフォルト: 6）
  - AnotherHourAllocation   # Morning/Evening AHに割り当てる合計時間（分）。省略時はCore Time以外の実時間。
  # Morning AH と Evening AH の配分は、Day Start Time に基づいて自動計算
```

### Wake-Based Mode（起床ベースモード）
```yaml
Wake-Based Mode:
  - Default Wake Time       # デフォルト起床時刻
  - Today's Wake Time       # 今日の実際の起床時刻
  - Another Hour Duration   # Another Hour期間の長さ（分単位）
  - Max Scale Factor        # 最大圧縮率（例：2.0）
```

**⚠️ UX設計の注意**: `Default Wake Time` と `Today's Wake Time` の両方を保持しますが、ユーザーへの表示方法は慎重に検討する必要があります。両方を同時に見せると混乱を招く可能性があるため、適切なUXデザインが必要です。

### Solar Mode（太陽時モード）
```yaml
Solar Mode:
  - Location                # 位置情報（ユーザーのデフォルトを上書き可能）
  - Day Hours Target        # 昼を何時間にしたいか（デフォルト：12）
  - Seasonal Adjustment     # 季節による微調整（true/false）
  # Night Hours は自動計算（24 - Day Hours）
```

## 🔄 データ同期アーキテクチャ

```
┌─────────────────┐
│   Web/Mobile    │ ← 設定の入力・変更
│      App        │
└────────┬────────┘
         │ 
         ▼ API/Sync
┌─────────────────┐
│   Cloud/Local   │ ← 設定の永続化
│    Storage      │
└────────┬────────┘
         │
         ▼ One-way sync (初期実装)
┌─────────────────┐
│   Watch App     │ ← 表示専用（読み取り専用）
│  (Read Only)    │
└─────────────────┘
```

### 同期の方針
- **初期実装**: Web/Mobileアプリからウォッチアプリへの一方向同期
- **将来拡張**: よりスマートなウォッチアプリが実装された場合、双方向同期を検討

## 🛡️ バリデーションルール

### Core Time Mode
```javascript
// Core Time の検証
function validateCoreTimeMode(config) {
  const start = parseTime(config.coreTimeStart);
  const end = parseTime(config.coreTimeEnd);
  const minCoreHours = config.minCoreHours || 6; // デフォルトは6時間
  const coreHours = (end - start) / 60;

  // Core Timeは最低でも設定された時間を確保する
  if (coreHours < minCoreHours) {
    throw new Error(`Core Time must be at least ${minCoreHours} hours`);
  }

  // anotherHourAllocation が指定されている場合、その値が妥当か検証
  if (config.anotherHourAllocation !== undefined) {
    if (config.anotherHourAllocation < 0 || config.anotherHourAllocation > 720) {
        throw new Error('AnotherHourAllocation must be between 0 and 12 hours');
    }
  } else {
    // 指定されていない場合、Core Time以外の時間が12時間を超えていないか検証
    const totalAH = 24 - coreHours;
    if (totalAH > 12) {
      throw new Error('Total Another Hour cannot exceed 12 hours');
    }
  }
}
```

### Wake-Based Mode
```javascript
// Wake-Based の検証
function validateWakeBasedMode(config) {
  // Another Hour Duration は0〜12時間
  if (config.anotherHourDuration < 0 || config.anotherHourDuration > 720) {
    throw new Error('Another Hour Duration must be between 0-12 hours');
  }

  // Max Scale Factor は1.0〜5.0
  if (config.maxScaleFactor < 1.0 || config.maxScaleFactor > 5.0) {
    throw new Error('Max Scale Factor must be between 1.0-5.0');
  }
}
```

## 💾 デフォルト値

```javascript
const MODE_DEFAULTS = {
  user: {
    dayStartTime: '00:00',
    defaultTimezone: 'Asia/Tokyo',
    preferredMode: 'classic'
  },

  classic: {
    designed24Duration: 1380  // 23時間
  },

  coreTime: {
    coreTimeStart: '07:00',
    coreTimeEnd: '22:00',
    minCoreHours: 6,
    anotherHourAllocation: null // デフォルトは未指定（null）
  },

  wakeBased: {
    defaultWakeTime: '07:00',
    anotherHourDuration: 60,  // 1時間
    maxScaleFactor: 2.0
  },

  solar: {
    dayHoursTarget: 12,
    seasonalAdjustment: false
  }
};
```

## 🔮 将来の拡張性

### カスタムモード（将来実装）
```yaml
Custom Mode:
  - Time Blocks: 
    - {start: "00:00", end: "06:00", scaleFactor: 1.0}
    - {start: "06:00", end: "22:00", scaleFactor: 1.2}
    - {start: "22:00", end: "24:00", scaleFactor: 0.8}
  - Repeat Pattern: daily/weekly/custom
```

### チーム同期（将来実装）
```yaml
Team Sync:
  - Shared Mode ID          # 共有モードの識別子
  - Team Timezone Override  # チーム共通のタイムゾーン
  - Sync Permissions        # 同期権限の設定
```

## 📝 実装上の注意事項

1. **プライバシー**: 位置情報や起床時刻などの個人情報は適切に保護する
2. **パフォーマンス**: 時間計算は頻繁に行われるため、効率的な実装が必要
3. **エラーハンドリング**: 不正な設定値に対する適切なフォールバック
4. **国際化**: タイムゾーンと日付フォーマットの適切な処理

---

*このドキュメントは Another Hour Time Design Modes システムの実装ガイドとして使用されます。実装の進行に応じて更新される可能性があります。*