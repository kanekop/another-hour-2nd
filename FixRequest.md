# Time Design Modes コードベース統合ガイド

## 📋 概要

このガイドは、Another HourプロジェクトのTime Design Modes実装を統合するための段階的な指示書です。各ステップをAgentに順番に指示してください。

---

## 📍 ステップ1: 現状分析（所要時間: 10分）

### Agentへの指示:
```markdown
## タスク: Time Design Modes実装の現状分析

以下の2つのディレクトリにあるTime Design Modes実装を分析してください：
- `dev-tools/time-design-test/js/time-design/modes/`
- `packages/scheduler-web/public/js/time-design/modes/`

### 分析項目
1. 各ディレクトリに存在するモードファイルのリスト
2. BaseMode.js の実装の違い（主要メソッドの比較）
3. CoreTimeMode.js の実装の違い（特にvalidateメソッド）
4. 各実装の良い点・改善が必要な点

### 出力形式
分析結果を表形式でまとめてください。
```

**✅ 確認ポイント**: 分析結果を確認し、両実装の違いを理解する

---

## 📍 ステップ2: 基盤作成（所要時間: 15分）

### Agentへの指示:
```markdown
## タスク: 共通パッケージの基盤作成

### 実行内容
1. `packages/@another-hour/time-design-core` ディレクトリを作成
2. 以下の構造でファイルを作成：
   ```
   packages/@another-hour/time-design-core/
   ├── package.json
   ├── src/
   │   ├── index.js
   │   └── modes/
   │       └── BaseMode.js (空ファイルでOK)
   └── README.md
   ```
3. package.json に以下を設定：
   - name: "@another-hour/time-design-core"
   - version: "1.0.0"
   - type: "module"
   - exports設定

### 注意
- まだコードの統合はしない（構造のみ作成）
- monorepoのworkspace設定も更新する
```

**✅ 確認ポイント**: ディレクトリ構造が正しく作成されたか確認

---

## 📍 ステップ3: BaseMode統合（所要時間: 20分）

### Agentへの指示:
```markdown
## タスク: BaseMode.jsの統合実装

### 実行内容
1. 両方のBaseMode.js実装を分析し、最良の部分を組み合わせる
2. `packages/@another-hour/time-design-core/src/modes/BaseMode.js` に統合版を作成
3. 以下を必ず含める：
   - 両実装の良いエラーハンドリング
   - getMinutesSinceMidnight の最も堅牢な実装
   - collectConfigFromUI メソッド（dev-tools版から）
   - 適切なコメントとJSDoc

### 統合の方針
- より包括的なバリデーションを採用
- より詳細なエラーメッセージを採用
- タイムゾーン処理はmoment.jsを使用する版を採用

### 実装後
BaseMode.jsの主要メソッドとその説明をリストで提供してください。
```

**✅ 確認ポイント**: BaseMode.jsが両実装の良い部分を含んでいるか確認

---

## 📍 ステップ4: ClassicMode統合とテスト（所要時間: 25分）

### Agentへの指示:
```markdown
## タスク: ClassicModeの統合と動作確認

### 実行内容
1. ClassicMode.jsを統合（BaseMode同様の方針で）
2. `packages/@another-hour/time-design-core/src/modes/ClassicMode.js` を作成
3. TimeDesignManager.jsも core パッケージに移行
4. index.js からエクスポート設定

### 動作確認
1. dev-tools側の修正：
   - `dev-tools/time-design-test/js/main.js` のimportを更新
   - ClassicModeが正常に動作することを確認
2. 問題があれば修正

### 重要
- localStorageのキー名は変更しない
- designed24Duration（designed24Minutes）の互換性を保つ

### 報告事項
- 変更したファイルのリスト
- 動作確認の結果
- 発生した問題と解決方法
```

**✅ 確認ポイント**: dev-toolsでClassicModeが動作することを実際に確認

---

## 📍 ステップ5: 残りのモード統合（所要時間: 30分）

### Agentへの指示:
```markdown
## タスク: 残りのモードの統合

### 実行内容
以下のモードを順次統合：
1. CoreTimeMode.js
2. SolarMode.js（SunCalc依存に注意）
3. WakeBasedMode.js

### 各モードについて
1. 両実装を比較し、より良い実装を採用
2. core パッケージに統合版を作成
3. 必要な依存関係も確認

### 特別な注意事項
- SolarMode: 都市データとSunCalc連携を確実に
- CoreTimeMode: 24時間またぎの処理を含める
- WakeBasedMode: 睡眠時間の検証ロジックを堅牢に

### 完了後
すべてのモードの統合状況を表で報告してください。
```

**✅ 確認ポイント**: 各モードが正しくエクスポートされているか確認

---

## 📍 ステップ6: scheduler-web側の更新（所要時間: 20分）

### Agentへの指示:
```markdown
## タスク: scheduler-web側のコード更新

### 実行内容
1. `packages/scheduler-web/public/js/time-design/` 内の重複ファイルを削除
2. 以下のファイルのimportを更新：
   - TimeDesignManager.jsを使用している箇所
   - 各モードを直接importしている箇所
3. package.jsonの依存関係を更新

### importの更新例
変更前: import { BaseMode } from './modes/BaseMode.js';
変更後: import { BaseMode } from '@another-hour/time-design-core';

### 注意事項
- 相対パスからパッケージ参照への変更
- 削除前に使用箇所を確認
- clock関連の機能が正常動作することを確認

### 報告
- 削除したファイルのリスト
- 更新したimport文の数
- 動作確認結果
```

**✅ 確認ポイント**: schedulerのクロック機能が正常に動作するか確認

---

## 📍 ステップ7: 最終確認と文書化（所要時間: 15分）

### Agentへの指示:
```markdown
## タスク: 統合作業の最終確認と文書化

### 確認項目
1. 両方のUIでTime Design Modesが動作すること：
   - dev-tools/time-design-test/
   - scheduler-webのクロック機能
2. 各モードの切り替えが正常に動作
3. 設定の保存/読み込みが正常

### 文書作成
`packages/@another-hour/time-design-core/README.md` に以下を記載：
1. パッケージの目的
2. 含まれるモードのリスト
3. 基本的な使用方法
4. import例

### 最終レポート
以下の形式で統合結果をまとめてください：
- 統合前: ファイル数、総行数
- 統合後: ファイル数、総行数
- 削減された重複コード量
- 今後のメンテナンスの利点
```

**✅ 確認ポイント**: 両方のUIですべてのモードが動作することを確認

---

## 🎯 完了後の確認事項

すべてのステップが完了したら、以下を確認してください：

### 1. 動作確認
- http://localhost:3000/dev-tools/time-design-test/ が正常動作
- http://localhost:3000/clock でモード切り替えが可能

### 2. コード品質
- 重複コードが削除されている
- importパスが整理されている

### 3. 将来性
- 新しいモードの追加が容易
- バグ修正が一箇所で完結

---

## ⚠️ トラブルシューティング

### 問題: import エラーが発生する
- パッケージ間の依存関係を確認
- workspace設定が正しいか確認
- `npm install` を実行

### 問題: モードが表示されない
- エクスポート設定を確認
- TimeDesignManagerへの登録を確認

### 問題: 設定が保存されない
- localStorageのキー名が変更されていないか確認
- 後方互換性の処理を確認

---

問題が発生した場合は、そのステップで作業を中断し、状況を報告してください。