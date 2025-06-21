# Another Hour 実装指示書

## 1. 実装対象ファイル

以下のファイルでAnother Hour期間の表示ロジックを修正する必要があります：

### 1.1 コアロジック
- `packages/scheduler-web/public/js/time-design/modes/BaseMode.js`
- `dev-tools/time-design-test/js/time-design/modes/BaseMode.js`

### 1.2 各モード実装
- `ClassicMode.js`
- `CoreTimeMode.js`
- `WakeBasedMode.js`
- `SolarMode.js`

### 1.3 UI表示
- `dev-tools/time-design-test/js/ui/TimeDisplay.js`
- `packages/scheduler-web/public/js/scheduler-ui.js`

## 2. 修正内容

### 2.1 BaseMode.js の calculate メソッド修正

#### 現在の問題
Another Hour期間で「残り時間」を表示している箇所を、「0から始まる時間」に修正する。

#### 修正前（誤った実装）
```javascript
if (activeSegment.type === 'another') {
    const remainingTotalSeconds = remaining * 60;
    displayHours = Math.floor(remainingTotalSeconds / 3600);
    displayMinutes = Math.floor((remainingTotalSeconds % 3600) / 60);
    displaySeconds = Math.floor(remainingTotalSeconds % 60);
}
```

#### 修正後（正しい実装）
```javascript
if (activeSegment.type === 'another') {
    // Another Hour期間の経過時間を計算（0から開始）
    const segmentElapsed = minutes - activeSegment.startTime;
    
    // 0時起点の時間として計算
    displayHours = Math.floor(segmentElapsed / 60);
    displayMinutes = Math.floor(segmentElapsed % 60);
    displaySeconds = Math.floor((segmentElapsed * 60) % 60);
}
```

### 2.2 segmentInfo の拡張

calculate メソッドの戻り値に、Another Hour表示用の情報を追加：

```javascript
return {
    hours: displayHours,
    minutes: displayMinutes,
    seconds: displaySeconds,
    scaleFactor: activeSegment.scaleFactor,
    isAnotherHour: activeSegment.type === 'another',
    segmentInfo: {
        type: activeSegment.type,
        label: activeSegment.label,
        progress,
        remaining,
        duration: activeSegment.duration,
        // Another Hour用の追加情報
        elapsed: activeSegment.type === 'another' ? segmentElapsed : undefined,
        total: activeSegment.type === 'another' ? activeSegment.duration : undefined,
        displayFormat: activeSegment.type === 'another' ? 'fraction' : 'normal'
    }
};
```

### 2.3 各モードの実装確認

各モードファイルで、Another Hour期間の計算が正しく実装されているか確認：

#### ClassicMode.js
```javascript
// _buildSegmentsメソッドで、Another Hourセグメントが正しく定義されているか確認
const anotherSegment = this.createSegment('another', anotherHourStart, 1440, 1.0, 'Another Hour');
```

#### CoreTimeMode.js
```javascript
// Morning AHとEvening AHの両方が 'another' タイプで作成されているか確認
segments.push(this.createSegment('another', 0, coreStart, 1.0, 'Morning AH'));
segments.push(this.createSegment('another', coreEnd, 1440, 1.0, 'Evening AH'));
```

## 3. UI表示の実装

### 3.1 TimeDisplay.js の修正

```javascript
// Another Hour期間の表示フォーマット
if (segmentInfo.displayFormat === 'fraction') {
    // HH:MM:SS/HH:MM:SS 形式で表示
    const elapsed = this.formatTime(
        Math.floor(segmentInfo.elapsed / 60),
        Math.floor(segmentInfo.elapsed % 60),
        Math.floor((segmentInfo.elapsed * 60) % 60)
    );
    const total = this.formatTime(
        Math.floor(segmentInfo.total / 60),
        Math.floor(segmentInfo.total % 60),
        0
    );
    
    timeString = `${elapsed}/${total}`;
    periodLabel = segmentInfo.label || 'Another Hour';
} else {
    // 通常の時刻表示
    timeString = this.formatTime(hours, minutes, seconds);
    periodLabel = segmentInfo.label || 'Time';
}
```

### 3.2 視覚的な区別

```css
/* Another Hour期間のスタイリング */
.time-display--another-hour {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #333;
}

.time-display--another-hour .time-display__value {
    font-weight: 600;
}

.time-display--another-hour .time-display__label {
    color: #555;
}
```

## 4. テストケース

### 4.1 Classic Mode
```javascript
// 設定: Designed 24 = 22時間（1320分）
// Another Hour = 2時間（120分）

// テスト1: Another Hour開始時（22:00）
// 期待値: "00:00:00/02:00:00"

// テスト2: Another Hour中間（23:00）
// 期待値: "01:00:00/02:00:00"

// テスト3: Another Hour終了直前（23:59:59）
// 期待値: "01:59:59/02:00:00"
```

### 4.2 Core Time Mode
```javascript
// 設定: Morning AH = 2時間、Core = 20時間、Evening AH = 2時間

// テスト1: Morning AH（01:00）
// 期待値: "01:00:00/02:00:00"

// テスト2: Evening AH開始（22:00）
// 期待値: "00:00:00/02:00:00"
```

## 5. 実装チェックリスト

- [ ] BaseMode.js の calculate メソッドで Another Hour 時間を0から開始
- [ ] segmentInfo に elapsed と total を追加
- [ ] 各モードで Another Hour セグメントが正しく定義されている
- [ ] UI で HH:MM:SS/HH:MM:SS 形式の表示が実装されている
- [ ] Another Hour 期間の視覚的な区別（色、ラベル）
- [ ] すべてのモードでテストケースが通過
- [ ] 日付をまたぐ場合の処理が正しい
- [ ] パフォーマンス要件を満たしている（< 10ms）

## 6. 注意事項

1. **後方互換性**: 既存のAPIを壊さないよう、新しいプロパティは追加のみ
2. **エラーハンドリング**: 無効な値の場合はフォールバック処理を実装
3. **一貫性**: すべてのモードで同じ表示ロジックを使用
4. **ドキュメント**: 変更箇所にはコメントで説明を追加

## 7. デバッグ用コード

開発中は以下のデバッグコードを使用して動作確認：

```javascript
// デバッグログ出力
if (window.DEBUG_TIME_DESIGN) {
    console.log('Another Hour Calculation:', {
        segmentType: activeSegment.type,
        elapsedMinutes: segmentElapsed,
        displayTime: `${displayHours}:${displayMinutes}:${displaySeconds}`,
        totalMinutes: activeSegment.duration
    });
}
```

この実装により、Another Hourが仕様通り「0から始まる独立した時間」として表示されるようになります。