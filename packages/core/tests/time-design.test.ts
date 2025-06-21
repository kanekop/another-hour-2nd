import { TimeDesignManager } from '../src/TimeDesignManager.js';
import { ClassicMode } from '../src/modes/ClassicMode.js';
import { TimeDesignMode } from '../src/types/time-modes.js';

// LocalStorage モック
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('Time Design Modes Integration Tests', () => {
    let manager: TimeDesignManager;

    beforeEach(() => {
        localStorageMock.clear();
        (TimeDesignManager as any).instance = null;
        manager = TimeDesignManager.getInstance();
    });

    describe('Complete Workflow', () => {
        it('should handle complete user workflow', async () => {
            // 1. モードの登録
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);

            // 2. ユーザー設定の更新
            manager.updateUserSettings({
                dayStartTime: '05:00',
                defaultTimezone: 'America/New_York',
                preferredMode: TimeDesignMode.Classic
            });

            // 3. モードの設定
            manager.setMode(TimeDesignMode.Classic, {
                parameters: {
                    designed24Duration: 1320 // 22時間
                }
            });

            // 4. 時間計算の実行
            const testTime = new Date('2025-01-15T12:00:00');
            const ahTime = manager.calculateAnotherHourTime(testTime);
            const scaleFactor = manager.getScaleFactor(testTime);
            const phase = manager.getCurrentPhase(testTime);

            // 検証
            expect(ahTime).toBeInstanceOf(Date);
            expect(scaleFactor).toBeCloseTo(24/22, 2);
            expect(phase.name).toBe('Designed 24');

            // 5. 永続化の確認
            const savedUserSettings = localStorageMock.getItem('another-hour-user-settings');
            const savedModeConfig = localStorageMock.getItem('another-hour-mode-classic');

            expect(savedUserSettings).toBeTruthy();
            expect(savedModeConfig).toBeTruthy();

            const parsedSettings = JSON.parse(savedUserSettings!);
            expect(parsedSettings.dayStartTime).toBe('05:00');
        });
    });

    describe('Multiple Modes Simulation', () => {
        it('should switch between modes seamlessly', () => {
            // 複数のモードを登録（将来の実装を想定）
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            // 将来: manager.registerMode(TimeDesignMode.CoreTime, CoreTimeMode);

            // Classic Mode
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            const classicTime = manager.calculateAnotherHourTime(new Date());
            expect(classicTime).toBeInstanceOf(Date);

            // モード切り替えをシミュレート（現在はClassicのみ）
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1200 } // 異なる設定
            });

            const newScaleFactor = manager.getScaleFactor();
            expect(newScaleFactor).toBeCloseTo(24/20, 2);
        });
    });

    describe('Real-world Time Scenarios', () => {
        const testScenarios = [
            {
                name: 'Early Morning',
                time: new Date('2025-01-15T05:00:00'),
                designed24Duration: 1380
            },
            {
                name: 'Noon',
                time: new Date('2025-01-15T12:00:00'),
                designed24Duration: 1380
            },
            {
                name: 'Evening',
                time: new Date('2025-01-15T18:00:00'),
                designed24Duration: 1380
            },
            {
                name: 'Late Night',
                time: new Date('2025-01-15T23:30:00'),
                designed24Duration: 1380
            }
        ];

        testScenarios.forEach(scenario => {
            it(`should handle ${scenario.name} correctly`, () => {
                manager.registerMode(TimeDesignMode.Classic, ClassicMode);
                manager.setMode(TimeDesignMode.Classic, {
                    parameters: { designed24Duration: scenario.designed24Duration }
                });

                const ahTime = manager.calculateAnotherHourTime(scenario.time);
                const phase = manager.getCurrentPhase(scenario.time);
                const angles = manager.getClockAngles(scenario.time);

                // 基本的な検証
                expect(ahTime).toBeInstanceOf(Date);
                expect(phase).toHaveProperty('name');
                expect(phase).toHaveProperty('progress');
                expect(angles).toHaveProperty('hours');
                expect(angles).toHaveProperty('minutes');
                expect(angles).toHaveProperty('seconds');

                // 時間の妥当性チェック
                expect(ahTime.getHours()).toBeGreaterThanOrEqual(0);
                expect(ahTime.getHours()).toBeLessThanOrEqual(23);
                expect(ahTime.getMinutes()).toBeGreaterThanOrEqual(0);
                expect(ahTime.getMinutes()).toBeLessThanOrEqual(59);
            });
        });
    });

    describe('Event System Integration', () => {
        it('should track mode changes through events', () => {
            const modeChanges: string[] = [];

            manager.addEventListener('mode-changed', (data) => {
                modeChanges.push(data.mode);
            });

            manager.registerMode(TimeDesignMode.Classic, ClassicMode);

            // 複数回モードを変更
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1200 }
            });

            expect(modeChanges).toHaveLength(2);
            expect(modeChanges).toEqual([TimeDesignMode.Classic, TimeDesignMode.Classic]);
        });
    });

    describe('Error Handling and Recovery', () => {
        it('should recover from invalid configuration', async () => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);

            // 不正な設定を保存
            localStorageMock.setItem('another-hour-mode-classic', 'invalid-json');

            // 初期化を試みる
            await manager.initialize();

            // デフォルトモードで動作するはず
            const currentMode = manager.getCurrentMode();
            expect(currentMode).toBeDefined();
        });

        it('should handle missing mode gracefully', () => {
            // モードを登録せずに時間計算を試みる
            expect(() => {
                manager.calculateAnotherHourTime();
            }).toThrow('No mode is currently set');
        });
    });

    describe('Performance', () => {
        it('should handle rapid time calculations', () => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            const startTime = Date.now();
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                const testTime = new Date();
                manager.calculateAnotherHourTime(testTime);
                manager.getScaleFactor(testTime);
                manager.getCurrentPhase(testTime);
            }

            const endTime = Date.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / iterations;

            // 平均計算時間は10ms未満であるべき
            expect(avgTime).toBeLessThan(10);
        });
    });

    describe('Data Persistence Across Sessions', () => {
        it('should restore complete state after restart', async () => {
            // セッション1: 設定を行う
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.updateUserSettings({
                dayStartTime: '06:00',
                defaultTimezone: 'Europe/London'
            });
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1260 }
            });

            // セッション2: 新しいインスタンスで復元
            (TimeDesignManager as any).instance = null;
            const newManager = TimeDesignManager.getInstance();
            newManager.registerMode(TimeDesignMode.Classic, ClassicMode);
            await newManager.initialize();

            // 状態が復元されているか確認
            const settings = (newManager as any).userSettings;
            expect(settings.dayStartTime).toBe('06:00');
            expect(settings.defaultTimezone).toBe('Europe/London');

            const currentMode = newManager.getCurrentMode();
            expect(currentMode?.config.parameters.designed24Duration).toBe(1260);
        });
    });

    describe('Compatibility', () => {
        it('should work with existing time calculation functions', () => {
            // 既存のgetCustomAhAngles関数との互換性をテスト
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            const testTime = new Date('2025-01-15T12:00:00');
            const angles = manager.getClockAngles(testTime);

            // 既存の関数と同様の出力形式
            expect(angles).toMatchObject({
                hours: expect.any(Number),
                minutes: expect.any(Number),
                seconds: expect.any(Number)
            });
        });
    });
});