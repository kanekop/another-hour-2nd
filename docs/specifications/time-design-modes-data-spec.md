# Time Design Modes 統合仕様書

## 1. 概要

Time Design Modesは、Another Hourプロジェクトの中核機能であり、ユーザーが自分のライフスタイルに合わせて時間の流れ方をカスタマイズできる革新的なシステムです。

## 2. 基本概念

### 2.1 Time Segment（時間セグメント）

時間セグメントは、1日（1440分）を複数の期間に分割する基本単位です。

```typescript
interface TimeSegment {
  id: string;                    // 一意識別子
  type: 'designed' | 'another';  // セグメントタイプ
  startTime: number;             // 開始時刻（分）0-1440
  endTime: number;               // 終了時刻（分）0-1440
  scaleFactor: number;           // 時間スケーリング係数
  label?: string;                // 表示ラベル（オプション）
}
```

### 2.2 Segment Types（セグメントタイプ）

#### 2.2.1 Designed Segment（デザインセグメント）
- **定義**: ユーザーが定義した概念的な時間が流れる期間
- **特徴**: scaleFactor ≠ 1.0（時間が速くまたは遅く流れる）
- **表示**: 設定されたスケールで進む時計

#### 2.2.2 Another Hour Segment（アナザーアワーセグメント）
- **定義**: Designed期間の外側にある、自然な速度で流れる時間
- **特徴**: scaleFactor = 1.0（実時間と同じ速度）
- **表示**: 0:00:00から始まる独立した時計（詳細は後述）

## 3. Another Hour 詳細仕様

### 3.1 基本定義

Another Hour（アナザーアワー）は、Designed 24期間が終了した後の残り時間を表す、Another Hourプロジェクト独自の時間概念です。

### 3.2 時間の定義
- **開始**: Designed期間が終了した時点で、Another Hourは **0:00:00** から開始
- **独立した時間軸**: 現実の時刻とは切り離された、概念的な時間として扱う
- **進行速度**: 常に1.0倍速（実時間と同じ速度）で進行

### 3.3 表示形式

#### デジタル表示
```
HH:MM:SS/HH:MM:SS
```
- **左側**: 現在のAnother Hour時間（0:00:00から開始）
- **右側**: 本日のAnother Hour総時間（固定値）
- **例**: `01:30:00/02:00:00` （2時間のAnother Hourのうち1時間30分が経過）

### 3.4 計算ロジック

```javascript
// Another Hour期間の時間計算
if (segment.type === 'another') {
    // セグメント開始からの経過時間（分）
    const elapsedMinutes = currentMinutes - segment.startTime;
    
    // Another Hour時間として表示（0時起点）
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = Math.floor(elapsedMinutes % 60);
    const seconds = Math.floor((elapsedMinutes * 60) % 60);
    
    return {
        hours: hours,          // 0から始まる
        minutes: minutes,
        seconds: seconds,
        scaleFactor: 1.0,
        isAnotherHour: true,
        // 表示用の追加情報
        totalMinutes: segment.duration,
        elapsedMinutes: elapsedMinutes
    };
}
```

### 3.5 UI/UX ガイドライン

1. **視覚的な区別**
   - Another Hour期間は温かい色調（黄色、オレンジ系）で表示
   - Designed期間とは明確に区別される配色

2. **ラベル表示**
   - "Another Hour" または "AH" のラベルを付与
   - モードによって "Morning AH", "Evening AH" などの修飾も可能

3. **プログレス表示**
   - プログレスバーやビジュアルインジケーターで進捗を表現
   - パーセンテージ表示は補助的に使用

## 4. Time Design Modes

### 4.1 利用可能なモード

#### 4.1.1 Classic Mode（クラシックモード）
- **概要**: 従来のAnother Hour体験（1日の終わりにAnother Hour期間）
- **セグメント構成**:
  - Designed 24: 0:00 → 設定時刻
  - Another Hour: 設定時刻 → 24:00

#### 4.1.2 Core Time Mode（コアタイムモード）
- **概要**: 中心となる活動時間の前後にAnother Hour期間を配置
- **セグメント構成**:
  - Morning AH: 0:00 → コア開始時刻
  - Core Time: コア開始 → コア終了時刻
  - Evening AH: コア終了 → 24:00

#### 4.1.3 Wake-Based Mode（起床ベースモード）
- **概要**: 起床時刻から始まる動的な24時間
- **セグメント構成**:
  - Sleep Time: 0:00 → 起床時刻
  - Activity Period: 起床時刻 → AH開始時刻
  - Another Hour: AH開始時刻 → 24:00

#### 4.1.4 Solar Mode（太陽時モード）
- **概要**: 日の出と日の入りに基づく自然のリズム
- **セグメント構成**:
  - Night (前半): 0:00 → 日の出
  - Day: 日の出 → 日の入り
  - Night (後半): 日の入り → 24:00

### 4.2 モード設定データ構造

```typescript
interface ModeConfiguration {
  mode: TimeDesignMode;          // モード識別子
  version: number;               // スキーマバージョン
  segments: TimeSegment[];       // 順序付きセグメント配列
  metadata: {
    created: Date;
    modified: Date;
    timezone?: string;
  };
}
```

## 5. 実装要件

### 5.1 境界処理
- Designed期間からAnother Hour期間への遷移は瞬時に行う
- 遷移時にAnother Hourは必ず0:00:00から開始
- セグメント間の遷移でジャンプや不連続性がないことを保証

### 5.2 日付をまたぐ場合の処理
- Another Hour期間が深夜0時をまたぐ場合も、表示は継続
- 内部的には適切に処理するが、ユーザーには連続した時間として見せる
- 1440分を超える計算は、モジュロ演算で適切に処理

### 5.3 精度要件
- 時間計算: ミリ秒単位の精度
- 表示更新: 100ms〜1000ms間隔（設定可能）
- スケールファクター: 小数点第6位まで

### 5.4 パフォーマンス要件
- 時間計算: < 10ms
- UI更新: 60fps維持
- メモリ使用: < 50MB増加

## 6. バリデーション規則

### 6.1 セグメント検証
```javascript
function validateSegments(segments) {
  // 1. 24時間をカバーしているか
  const totalDuration = segments.reduce((sum, seg) => 
    sum + (seg.endTime - seg.startTime), 0);
  if (totalDuration !== 1440) {
    return { valid: false, error: 'Segments must cover exactly 24 hours' };
  }
  
  // 2. オーバーラップがないか
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].endTime > segments[i + 1].startTime) {
      return { valid: false, error: 'Segments cannot overlap' };
    }
  }
  
  // 3. 連続性があるか
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].endTime !== segments[i + 1].startTime) {
      return { valid: false, error: 'Segments must be continuous' };
    }
  }
  
  return { valid: true };
}
```

### 6.2 モード固有の検証
各モードは独自の検証ルールを実装：
- Classic Mode: exactly 2 segments
- Core Time Mode: exactly 3 segments, core time ≥ 12 hours
- Wake-Based Mode: wake time validation
- Solar Mode: location validation

## 7. ストレージ仕様

### 7.1 LocalStorage キー
```javascript
const STORAGE_KEYS = {
  CURRENT_MODE: 'time-design-current-mode',
  MODE_CONFIGS: 'time-design-mode-configs',
  MIGRATION_VERSION: 'time-design-migration-version'
};
```

### 7.2 データ構造
```typescript
interface StorageSchema {
  version: 2;
  currentMode: string;
  configurations: {
    [modeId: string]: ModeConfiguration;
  };
  preferences: {
    defaultMode: string;
    autoSwitch: boolean;
    displayFormat: 'digital' | 'analog';
  };
}
```

## 8. 移行戦略

### 8.1 後方互換性
- 既存のClassic Mode設定を自動的に新形式に変換
- レガシーAPIのシム実装
- 段階的な機能追加

### 8.2 データ移行
```javascript
// レガシー設定から新形式への変換
function migrateFromV1(legacyConfig) {
  return {
    mode: 'classic',
    version: 2,
    segments: [
      {
        id: 'designed-main',
        type: 'designed',
        startTime: 0,
        endTime: legacyConfig.designed24Duration,
        scaleFactor: 1440 / legacyConfig.designed24Duration
      },
      {
        id: 'another-hour',
        type: 'another',
        startTime: legacyConfig.designed24Duration,
        endTime: 1440,
        scaleFactor: 1.0
      }
    ],
    metadata: {
      created: new Date(),
      modified: new Date(),
      timezone: legacyConfig.timezone
    }
  };
}
```

## 9. テスト要件

### 9.1 単体テスト
- 各モードの計算ロジック
- セグメント検証
- 境界値テスト

### 9.2 統合テスト
- モード間の切り替え
- データ永続性
- UI同期

### 9.3 E2Eテスト
- ユーザーフロー全体
- パフォーマンス測定
- 異常系処理

## 10. 今後の拡張

### 10.1 計画中の機能
- カスタムモード作成
- モードの共有機能
- AIによるモード推奨
- チーム同期機能

### 10.2 プラグインアーキテクチャ
```typescript
interface TimeDesignPlugin {
  id: string;
  name: string;
  modes?: ModeDefinition[];
  calculators?: CalculatorExtension[];
  validators?: ValidatorExtension[];
}
```

---

## 変更履歴
- 2025-01-15: Another Hour仕様を統合
- 2025-01-14: 初版作成