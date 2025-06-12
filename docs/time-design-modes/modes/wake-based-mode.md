# Wake-Based Mode 

# Wake-Based Mode

## 📋 Overview

Wake-Based Mode（起床ベースモード）は、起床時刻を起点として24時間をカウントする動的な時間設計モードです。従来の0時起点ではなく、「あなたの一日はあなたが起きた時から始まる」という哲学に基づいています。

## 🎯 Concept

多くの人にとって、一日は目覚めた瞬間から始まります。しかし従来の時計は、私たちが眠っている深夜0時に勝手に日付を変えてしまいます。Wake-Based Modeは、この不自然さを解消し、個人の生活リズムに合わせた時間体系を提供します。

### 動的な時間スケーリング

```
起床時刻: 6:00（例）
Another Hour: 2時間

0:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 24:00
     ↑                                           ↑
  すでに経過      残り18時間を19時間として使用     AH(2h)
  （捨てる）        （Designed 19）
     
6:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 22:00 ━━ 24:00
 ↑                                         ↑       ↑
起床                               Designed終了    一日の終了
(あなたの0時)                        

スケールファクター: 19/18 ≈ 1.056倍速
```

## 💡 Use Cases

### 1. フリーランサー/リモートワーカー
- **不規則な起床時間に対応**: 7時起床の日も10時起床の日も、それぞれ最適化
- **締切前の時間圧縮**: 遅く起きた日ほど時間が速く流れ、集中力が高まる
- **罪悪感の解消**: 「寝坊」という概念から解放

### 2. シフト勤務者
- **夜勤明け**: 朝帰宅して午後に起床しても、そこから「一日」が始まる
- **早朝勤務**: 3時起床でも、きちんと24時間の枠組みを確保
- **生活リズムの維持**: シフトが変わっても時間設計は一定

### 3. 国際的なビジネスパーソン
- **時差ボケ対応**: 現地時間ではなく、体内時計に合わせた時間管理
- **複数タイムゾーン**: 起床を基準にすることで混乱を回避

## ⚙️ Settings

### 基本設定項目

1. **Wake Time**: 起床時刻（毎日記録/更新）
2. **Another Hour Duration**: Another Hour期間（0-6時間）
3. **Auto-detect Wake Time**: スマートフォン/ウェアラブル連携での自動検出
4. **Default Wake Time**: 起床時刻が不明な場合のデフォルト値

### 高度な設定

- **Minimum Designed Period**: 最低限確保するDesigned時間（例：12時間）
- **Maximum Scale Factor**: 最大スケールファクター（例：2.0倍まで）
- **Wake Time Buffer**: 起床判定の余裕時間（例：±30分）

## 🎨 Visual Representation

### アナログ時計での表示

```
現在時刻: 実際の14:00（起床8:00の場合）

        12(6h)
         |
    ━━━━━━━━━━━
9 ━━━   ⚡   ━━━ 3(9h)
  ━━━  1.12x ━━━
    ━━━━━━━━━
       6(12h)

⚡ = 現在位置（Designed 6:44）
グレーの部分 = すでに経過した時間（使用不可）
```

### デジタル表示

```
Wake Time: 8:00 (Today)
Current: Designed 6:44 (Real: 14:00)
Speed: 1.12x
Time Until AH: 15h 16m

Progress: ████████░░░░░░░░░░░░ 35%
```

## 🔧 Technical Details

### 動的スケールファクター計算

```javascript
function calculateWakeBasedScale(wakeTime, ahDuration) {
  const now = new Date();
  const wakeToday = setTimeToToday(wakeTime);
  
  // 起床前の場合は前日の起床時刻を使用
  if (now < wakeToday) {
    wakeToday.setDate(wakeToday.getDate() - 1);
  }
  
  // 利用可能な実時間
  const hoursAwake = (now - wakeToday) / (1000 * 60 * 60);
  const remainingRealHours = 24 - hoursAwake - ahDuration;
  
  // Designed時間の計算
  const designedHoursNeeded = 24 - getElapsedDesignedHours(wakeToday);
  
  // スケールファクター
  return {
    scaleFactor: designedHoursNeeded / remainingRealHours,
    remainingReal: remainingRealHours,
    remainingDesigned: designedHoursNeeded
  };
}
```

### 日付変更の処理

Wake-Based Modeでは、日付の変更は起床時刻に基づきます：

```javascript
function getWakeBasedDate(realDate, wakeTime) {
  const wakeHour = wakeTime.getHours();
  const currentHour = realDate.getHours();
  
  // 起床時刻より前の場合は「前日」として扱う
  if (currentHour < wakeHour) {
    const adjustedDate = new Date(realDate);
    adjustedDate.setDate(adjustedDate.getDate() - 1);
    return adjustedDate;
  }
  
  return realDate;
}
```

## 📱 UI/UX Guidelines

### 起床時刻の記録

```
┌─────────────────────────────────────┐
│      🌅 Good Morning!               │
├─────────────────────────────────────┤
│  Record your wake time:             │
│                                     │
│     [ 07 : 30 ] AM                  │
│                                     │
│  ○ Use current time (7:32 AM)      │
│  ○ I woke up earlier at: [__:__]   │
│                                     │
│  [Confirm]  [Use default (6:00)]    │
└─────────────────────────────────────┘
```

### リアルタイム情報パネル

```
┌─────────────────────────────────────┐
│  Today's Time Status                │
├─────────────────────────────────────┤
│  Woke up: 8:30 AM (5.5 hours ago)  │
│  Current speed: 1.18x               │
│  AH starts: 9:47 PM (7h 47m)       │
│                                     │
│  Tips: You woke up 2.5 hours later │
│  than yesterday. Time is moving     │
│  18% faster today.                  │
└─────────────────────────────────────┘
```

## 🚀 Implementation Considerations

### 起床時刻の検出

1. **手動入力**: 最もシンプルで確実
2. **デバイス連携**: 
   - スマートフォンの最初のアンロック
   - ウェアラブルデバイスの動き検出
   - スマートホームデバイスとの連携
3. **パターン学習**: 過去のデータから推測

### エッジケース

1. **徹夜した場合**: 
   - 24時間以上起きている場合の処理
   - 仮眠と本睡眠の区別

2. **昼寝の扱い**:
   - 短時間の睡眠は無視
   - 設定可能な最小睡眠時間

3. **時差を超えた移動**:
   - タイムゾーン変更時の処理
   - 体内時計モードの提供

## 🎯 Success Metrics

- 起床時刻の記録率
- スケールファクターの日々の変動
- ユーザーの時間に対する満足度向上
- 「時間が足りない」感覚の減少

## 💭 Philosophy

Wake-Based Modeは、「時間は個人的な体験である」というAnother Hourの核心的な思想を最も強く体現します。社会的な時間の制約から解放され、自分の生活リズムに忠実な時間体系を作ることで、より自然で、より生産的な一日を過ごすことができます。

「遅く起きた日は時間が速く過ぎる」という誰もが感じる感覚を、実際の時計の動きに反映させることで、時間との新しい関係性を築きます。

## 📝 Notes

- Wake-Based Modeは最も「個人的」なモードであり、他者との時間共有には工夫が必要
- 将来的には、チームメンバー間でお互いのWake-Based時間を可視化する機能を検討
- 睡眠の質とスケールファクターの相関分析など、健康面での応用も可能

---

*Next: [Solar Mode →](solar-mode.md)*