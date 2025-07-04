# Wake-Based Mode: A Deep Dive

## 📋 概要 (Overview)

Wake-Based Mode（起床時間基準モード）は、**「今日の活動は、起きてから寝るまで」**というシンプルな考えに基づいた、非常にユニークな時間設計モードです。

カレンダー上の深夜0時を1日の区切りとするのではなく、**あなたが起きた瞬間から、その日の終わり（深夜24時）までを「あなたの今日」**として再設計します。

### コアコンセプト：ずれる時計を、毎朝リセットする

このモードの使い心地は、まるで**「少しずつ進みが速くなるアナログ時計を、毎朝起きた時に時刻合わせする」**感覚に似ています。

- **朝、起きる**: 今日の活動時間が決まります。
- **夜、Another Hourを決める**: 「今日は何時に活動を終えたいか」を決めます。
- **日中を過ごす**: あとは、少しだけ速く進む時間の中で生活するだけです。

このモードは、日々の活動開始時刻の変動に柔軟に対応しつつ、一日の終わりには必ず集中やリラックスのための「Another Hour」を確保することを目指します。

## 💡 基本的な考え方 (The Core Idea)

このモードを理解する鍵は、3つの「時間」を区別することです。

1.  **活動可能時間 (Total Activity Time)**
    - あなたが起きてから、その日の終わり（深夜24時）までの時間。
    - **例**: 朝`07:00`に起きると、活動可能時間は**17時間**です。
    - これが、その日にデザインされるべき**時間の総量**、つまり`Designed 17`のベースとなります。

2.  **Another Hour (X時間)**
    - 活動の最後に確保したい、あなただけの時間。長さは自由に設定できます。
    - **例**: **2時間**のAnother Hourを確保したい、と設定します。

3.  **Designed Time**
    - 「活動可能時間」から「Another Hour」を引いた、残りの時間。
    - **例**: 17時間の活動可能時間のうち、2時間をAnother Hourにしたので、Designed Timeは**15時間**となります。

### 「時間の魔法」：スケーリング

ここが最も重要なポイントです。
**15時間**という現実の時間を使って、**17時間分**の価値がある時間を進めます。

- **進めるべき時間**: `活動可能時間`（17時間）
- **使える現実の時間**: `Designed Time`の長さ（15時間）

この差を埋めるために、`Designed Time`の間だけ、時間の進む速度（スケールファクター）が少し速くなります。

## ⚙️ 計算の仕組み (The Formula)

数式で見てみましょう。

### 1. 活動可能時間の計算
\[
\text{活動可能時間} = 24:00 - \text{起床時刻}
\]

### 2. Designed Time（現実時間）の計算
\[
\text{Designed Timeの現実時間} = \text{活動可能時間} - \text{Another Hourの長さ(X)}
\]

### 3. スケールファクターの計算
\[
\text{スケールファクター} = \frac{\text{活動可能時間}}{\text{Designed Timeの現実時間}}
\]

このスケールファクターが`1.0`より大きくなることで、`Designed Time`の期間は時間が速く進みます。

---

## 🚶‍♀️ 具体的なシナリオ (A Walkthrough)

**事前の設定**:
- **確保したいAnother Hour**: **3時間** (これは一度設定したら、あまり変更しません)

---

### とある朝 (A Day in the Life)

#### ステップ1: 「起きたよ」と時計に伝える

あなたは**朝 08:00**に目を覚ましました。
アプリを開き、起床したよ、とボタンを押します。**毎朝の操作はこれだけです。**

#### ステップ2: 時計が自動で「今日の時間」を計算する

入力された起床時刻と、事前に設定された`Another Hour`（3時間）に基づき、時計が残りの計算をすべて自動で行います。

1.  **活動可能時間の計算**:
    - `24:00 - 08:00 = 16時間`
    - 今日のあなたの時間は**「Designed 16」**に決まります。

2.  **期間の分割**:
    - **Another Hour**: `24:00`から`3時間`を逆算し、**`21:00`～`24:00`**に自動設定されます。
    - **Designed Time**: `08:00`から`21:00`まで。現実の時間は**13時間**となります。

3.  **スケールファクターの計算**:
    - `進めるべき時間(16時間) ÷ 使える現実の時間(13時間) ≒ 1.23`
    - `Designed Time`中は、時間が**約1.23倍速**で進むことが決まります。

#### ステップ3: 1日を過ごす

- **`08:00`～`21:00` (Designed Time)**
  - 時間は**約1.23倍速**で進みます。
  - 時計は`08:00`を`00:00`としてスタートし、13時間の間に16時間分を進みます。

- **`21:00`～`24:00` (Another Hour)**
  - `21:00`になると、時間は自動で**1.0倍速**に戻ります。
  - 時計の表示は、深夜`24:00`までの**カウントダウン**に切り替わります。（例: `03:00:00`）

## 🎨 UI/UX Guidelines

- **起床時刻**: ユーザーが毎朝、今日の起床時刻を入力します。これが唯一の必須な日次操作です。
- **Another Hour Duration**: スライダー等で、確保したい時間を設定します。この設定は保存され、通常は頻繁に変更しません。
- **表示**:
  - `Designed Time`中は、スケールされた時刻と、現在のスケールファクターを明確に表示します。
  - `Another Hour`中は、カウントダウン表示に切り替え、モードが変わったことを体感できるようにします。

このモードは、あなたのユニークな一日に合わせて、時間が柔軟に形を変える、まさに「生きている時計」なのです。

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

### 日付の扱い

Wake-Based Mode でも1日の区切りは通常どおり`00:00`です。起床時刻は「Designed Day」
の開始を示すだけで、日付そのものは深夜に切り替わります。

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