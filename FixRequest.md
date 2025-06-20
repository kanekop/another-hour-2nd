# Another Hour 仕様書

## 概要
Another Hour（アナザーアワー）は、Designed 24期間が終了した後の残り時間を表す、Another Hourプロジェクト独自の時間概念です。

## 基本仕様

### 時間の定義
- **開始**: Designed 24期間が終了した時点で、Another Hourは **0:00:00** から開始される
- **独立した時間軸**: 現実の時刻とは切り離された、概念的な時間として扱う
- **進行速度**: 常に1.0倍速（実時間と同じ速度）で進行する

### 表示形式

#### デジタル表示
```
HH:MM:SS/HH:MM:SS
```
- **左側**: 現在のAnother Hour時間（0:00:00から開始）
- **右側**: 本日のAnother Hour総時間（固定値）
- **例**: `01:30:00/02:00:00` （2時間のAnother Hourのうち1時間30分が経過）

#### 特徴
- 分数表記により進捗が直感的に理解できる
- カウントダウンではなくカウントアップ表示
- 残り時間は視覚的に把握可能（総時間 - 経過時間）

### モード別の扱い

すべてのTime Design Modesにおいて、Another Hour期間は同じ仕様で動作します：

1. **Classic Mode**: Designed 24の後に1つのAnother Hour期間
2. **Core Time Mode**: Morning AHとEvening AHの2つの期間（それぞれ0:00から開始）
3. **Wake-Based Mode**: 活動時間の最後にAnother Hour期間
4. **Solar Mode**: 夜間のAnother Hour期間

### 計算ロジック

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
        // 表示用の追加情報
        totalMinutes: segment.duration,
        elapsedMinutes: elapsedMinutes
    };
}
```

### UI/UX ガイドライン

1. **視覚的な区別**
   - Another Hour期間は温かい色調（黄色、オレンジ系）で表示
   - Designed期間とは明確に区別される配色

2. **ラベル表示**
   - "Another Hour" または "AH" のラベルを付与
   - モードによって "Morning AH", "Evening AH" などの修飾も可能

3. **プログレス表示**
   - プログレスバーやビジュアルインジケーターで進捗を表現
   - パーセンテージ表示は補助的に使用

## 実装における注意点

1. **境界処理**
   - Designed期間からAnother Hour期間への遷移は瞬時に行う
   - 遷移時にAnother Hourは必ず0:00:00から開始

2. **日付をまたぐ場合**
   - Another Hour期間が深夜0時をまたぐ場合も、表示は継続
   - 内部的には適切に処理するが、ユーザーには連続した時間として見せる

3. **精度**
   - 秒単位まで正確に計算・表示
   - リアルタイム更新（100ms〜1000ms間隔）

## 変更履歴
- 2025-01-15: 初版作成
- デジタル表示形式を `HH:MM:SS/HH:MM:SS` に統一
- すべてのモードで同一仕様とすることを明確化