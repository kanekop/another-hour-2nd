# Core Time Mode 
# Core Time Mode

## 📋 Overview

Core Time Mode（コアタイムモード）は、一日の中心となる活動時間を定義し、その前後に「Another Hour」期間を配置する時間設計モードです。朝と夜の両方に余白の時間を確保することで、より柔軟でバランスの取れた一日を実現します。

## 🎯 Concept

従来のClassic Modeでは、一日の終わりにのみAnother Hour期間を設定していました。しかし、多くの人にとって、朝の時間も夜と同じくらい大切です。Core Time Modeは、この両方の時間を「自分のための時間」として確保します。

### 時間の構成

```
0:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 24:00
     ↑                    ↑                      ↑
  Morning AH           Core Time              Evening AH
  (朝のAH)         (コアタイム/Designed 24)     (夜のAH)
```

## 💡 Use Cases

### 1. ワークライフバランスを重視する会社員
- **Morning AH (5:00-7:00)**: 朝の運動、瞑想、読書
- **Core Time (7:00-22:00)**: 通勤、仕事、家事など
- **Evening AH (22:00-24:00)**: 趣味、家族との時間

### 2. クリエイティブワーカー
- **Morning AH (0:00-6:00)**: 深夜の創作活動
- **Core Time (6:00-20:00)**: 睡眠、日常業務、打ち合わせ
- **Evening AH (20:00-24:00)**: インプット、アイデア整理

### 3. 子育て中の親
- **Morning AH (4:00-6:00)**: 自分だけの静かな時間
- **Core Time (6:00-21:00)**: 育児、家事、仕事
- **Evening AH (21:00-24:00)**: パートナーとの時間、趣味

## ⚙️ Settings

### 基本設定項目

1. **Morning AH Start Time**: 朝のAnother Hour開始時刻（0:00-12:00）
2. **Morning AH Duration**: 朝のAnother Hour期間（0-6時間）
3. **Evening AH Duration**: 夜のAnother Hour期間（0-6時間）
4. **Evening AH End Time**: 夜のAnother Hour終了時刻（12:00-24:00）

### 制約条件

- Morning AH + Evening AH の合計は最大12時間まで
- Core Time（Designed 24）は最低12時間必要
- 各期間は連続している必要がある

## 🎨 Visual Representation

### アナログ時計での表示

```
        12
    AH  |  AH
  ━━━━━━━━━━━━━
9 ━━━       ━━━ 3
  ━━━  Core  ━━━
    ━━━━━━━━━
        6
```

- **薄い色のセクター**: Another Hour期間
- **通常の文字盤**: Core Time期間
- **境界線**: 期間の切り替わりを示す

### デジタル表示

```
Morning AH: 5:00 - 7:00 (2h)
Core Time: 7:00 - 22:00 (15h → Designed 24h)
Evening AH: 22:00 - 24:00 (2h)

Current: Core Time 18:34 (Real: 17:15)
```

## 🔧 Technical Details

### 時間計算

1. **Another Hour期間中**
   - Scale Factor = 1.0（通常速度）
   - 実時間 = 表示時間

2. **Core Time期間中**
   - Scale Factor = 24 / CoreTimeHours
   - 例：15時間のCore Timeの場合、1.6倍速（24/15）

### 遷移タイミング

- Morning AH → Core Time: 朝のAnother Hour終了時
- Core Time → Evening AH: Core Timeで24時間分が経過した時点
- Evening AH → Morning AH: 24:00（翌0:00）

## 📱 UI/UX Guidelines

### 設定画面

```
┌─────────────────────────────────────┐
│        Core Time Settings           │
├─────────────────────────────────────┤
│ Morning Another Hour                │
│ Start: [05:00] ▼  Duration: [2h] ▼ │
│                                     │
│ Evening Another Hour                │
│ Duration: [2h] ▼  End: [24:00] ▼   │
│                                     │
│ Core Time (Designed 24)             │
│ 07:00 - 22:00 (15 hours → 24h)     │
│ Speed: 1.6x                         │
└─────────────────────────────────────┘
```

### インタラクティブプレビュー

- スライダーで各期間を調整
- リアルタイムでグラフが更新
- 現在時刻での体感を表示

## 🚀 Implementation Priority

Core Time Modeは、Time Design Modesの中で最初に実装すべきモードです：

1. **実装が比較的シンプル** - 固定的な時間区分
2. **ユーザーに理解しやすい** - 明確な3つの期間
3. **既存コードからの拡張が容易** - Classic Modeの自然な発展

## 🎯 Success Metrics

- ユーザーが直感的に設定を完了できる
- 期間の切り替わりがスムーズ
- 各期間の目的が明確に区別できる

## 📝 Notes

Core Time Modeは、Another Hourの哲学である「時間の主導権を取り戻す」を最も分かりやすく体現するモードです。仕事や義務的な活動（Core Time）と、自分のための時間（Another Hour）を明確に分離することで、メリハリのある生活を実現します。

---

*Next: [Wake-Based Mode →](wake-based-mode.md)*