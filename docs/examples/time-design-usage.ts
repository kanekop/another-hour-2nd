import { TimeDesignManager } from './TimeDesignManager.js';
import { ClassicMode } from './modes/ClassicMode.js';
import { TimeDesignMode } from './types/time-modes.js';

/**
 * Time Design Modes の使用例
 */

// 1. マネージャーの初期化
const manager = TimeDesignManager.getInstance();

// 2. モードの登録
manager.registerMode(TimeDesignMode.Classic, ClassicMode);
// 将来: manager.registerMode(TimeDesignMode.CoreTime, CoreTimeMode);
// 将来: manager.registerMode(TimeDesignMode.WakeBased, WakeBasedMode);
// 将来: manager.registerMode(TimeDesignMode.Solar, SolarMode);

// 3. ユーザー設定の更新
manager.updateUserSettings({
    defaultTimezone: 'Asia/Tokyo',
    dayStartTime: '04:00',  // 朝4時から一日を開始
    preferredMode: TimeDesignMode.Classic
});

// 4. 初期化（保存された設定を読み込み）
await manager.initialize();

// 5. Classic Mode の設定
manager.setMode(TimeDesignMode.Classic, {
    parameters: {
        designed24Duration: 1380  // 23時間
    }
});

// 6. 現在の時間を取得
const now = new Date();
const ahTime = manager.calculateAnotherHourTime(now);
const scaleFactor = manager.getScaleFactor(now);
const phase = manager.getCurrentPhase(now);

console.log('=== Time Design Status ===');
console.log(`Real Time: ${now.toLocaleTimeString()}`);
console.log(`Another Hour Time: ${ahTime.toLocaleTimeString()}`);
console.log(`Current Phase: ${phase.name}`);
console.log(`Progress: ${(phase.progress * 100).toFixed(1)}%`);
console.log(`Scale Factor: ${scaleFactor.toFixed(2)}x`);

// 7. 時計の角度を取得（アナログ時計用）
const angles = manager.getClockAngles(now);
console.log(`\n=== Clock Angles ===`);
console.log(`Hour Hand: ${angles.hours.toFixed(1)}°`);
console.log(`Minute Hand: ${angles.minutes.toFixed(1)}°`);
console.log(`Second Hand: ${angles.seconds.toFixed(1)}°`);

// 8. イベントリスナーの設定
manager.addEventListener('mode-changed', (data) => {
    console.log(`\n[Event] Mode changed to: ${data.mode}`);
});

// 9. デバッグ情報
console.log('\n=== Debug Info ===');
console.log(JSON.stringify(manager.getDebugInfo(), null, 2));

// 10. 時間シミュレーション
console.log('\n=== Time Simulation ===');
const simulateTimes = [
    new Date('2025-01-15T06:00:00'),  // 朝6時
    new Date('2025-01-15T12:00:00'),  // 正午
    new Date('2025-01-15T18:00:00'),  // 夕方6時
    new Date('2025-01-15T23:00:00'),  // 夜11時
];

simulateTimes.forEach(time => {
    const ahTime = manager.calculateAnotherHourTime(time);
    const phase = manager.getCurrentPhase(time);
    const scale = manager.getScaleFactor(time);

    console.log(`\nReal: ${time.toLocaleTimeString()}`);
    console.log(`  → AH: ${ahTime.toLocaleTimeString()}`);
    console.log(`  → Phase: ${phase.name} (${(phase.progress * 100).toFixed(1)}%)`);
    console.log(`  → Scale: ${scale.toFixed(2)}x`);
});