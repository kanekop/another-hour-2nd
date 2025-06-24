import { ClassicMode } from '../src/modes/ClassicMode';
import { TimeDesignMode, DEFAULT_VALUES } from '../src/types/time-modes';

describe('ClassicMode', () => {
    let mode: ClassicMode;

    const defaultConfig = {
        mode: TimeDesignMode.Classic,
        parameters: {
            designed24Duration: 1380 // 23時間
        },
        userSettings: {
            userId: 'test-user',
            dayStartTime: '00:00',
            defaultTimezone: 'Asia/Tokyo',
            preferredMode: TimeDesignMode.Classic
        }
    };

    beforeEach(() => {
        mode = new ClassicMode(defaultConfig);
    });

    describe('Constructor and Validation', () => {
        it('should create instance with valid config', () => {
            expect(mode).toBeInstanceOf(ClassicMode);
            expect((mode as any).designed24Duration).toBe(1380);
        });

        it('should use default values when parameters are missing', () => {
            const minimalConfig = {
                mode: TimeDesignMode.Classic,
                parameters: {}
            };

            const minimalMode = new ClassicMode(minimalConfig);
            expect((minimalMode as any).designed24Duration).toBe(DEFAULT_VALUES.classic.designed24Duration);
        });

        it('should throw error for invalid duration', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: {
                    designed24Duration: -100
                }
            };

            expect(() => new ClassicMode(invalidConfig)).toThrow('Designed 24 duration must be between 0 and 24 hours');
        });

        it('should throw error for duration exceeding 24 hours', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: {
                    designed24Duration: 1500 // 25時間
                }
            };

            expect(() => new ClassicMode(invalidConfig)).toThrow('Designed 24 duration must be between 0 and 24 hours');
        });
    });

    describe('Day Start Time', () => {
        it('should parse day start time correctly', () => {
            const customConfig = {
                ...defaultConfig,
                userSettings: {
                    ...defaultConfig.userSettings,
                    dayStartTime: '04:30'
                }
            };

            const customMode = new ClassicMode(customConfig);
            expect((customMode as any).dayStartTime).toBe(270); // 4.5 * 60
        });

        it('should handle day start at midnight', () => {
            expect((mode as any).dayStartTime).toBe(0);
        });
    });

    describe('Scale Factor Calculation', () => {
        it('should calculate correct scale factor in Designed 24 period', () => {
            const testTime = new Date('2025-01-15T12:00:00');
            const scaleFactor = mode.calculateScaleFactor(testTime);

            // 23時間のDesigned 24 → 24/23 ≈ 1.043
            expect(scaleFactor).toBeCloseTo(24 / 23, 3);
        });

        it('should return 1.0 for Another Hour period', () => {
            // Designed 24の終了時刻以降の時間を設定
            const testTime = new Date('2025-01-15T23:30:00');
            const scaleFactor = mode.calculateScaleFactor(testTime);

            expect(scaleFactor).toBe(1.0);
        });

        it('should handle edge case of 24-hour Designed 24', () => {
            const fullDayConfig = {
                ...defaultConfig,
                parameters: {
                    designed24Duration: 1440 // 24時間
                }
            };

            const fullDayMode = new ClassicMode(fullDayConfig);
            const scaleFactor = fullDayMode.calculateScaleFactor(new Date());

            expect(scaleFactor).toBe(1.0);
        });
    });

    describe('Phase Detection', () => {
        it('should detect Designed 24 phase correctly', () => {
            const testTime = new Date('2025-01-15T12:00:00');
            const phase = mode.getCurrentPhase(testTime);

            expect(phase.name).toBe('Designed 24');
            expect(phase.progress).toBeGreaterThanOrEqual(0);
            expect(phase.progress).toBeLessThan(1);
            expect((phase as any).remainingMinutes).toBeGreaterThan(0);
        });

        it('should detect Another Hour phase correctly', () => {
            const testTime = new Date('2025-01-15T23:30:00');
            const phase = mode.getCurrentPhase(testTime);

            expect(phase.name).toBe('Another Hour');
            expect(phase.progress).toBeGreaterThanOrEqual(0);
            expect(phase.progress).toBeLessThanOrEqual(1);
        });

        it('should calculate progress correctly at phase boundaries', () => {
            // Designed 24の開始時
            const startTime = new Date('2025-01-15T00:00:00');
            const startPhase = mode.getCurrentPhase(startTime);
            expect(startPhase.progress).toBeCloseTo(0, 3);

            // Designed 24の終了直前
            const endTime = new Date('2025-01-15T23:00:00');
            const endPhase = mode.getCurrentPhase(endTime);
            expect(endPhase.name).toBe('Designed 24');
            expect(endPhase.progress).toBeCloseTo(1, 1);
        });
    });

    describe('Time Calculations', () => {
        it('should calculate Another Hour time in Designed 24 period', () => {
            const realTime = new Date('2025-01-15T12:00:00');
            const ahTime = mode.calculateAnotherHourTime(realTime);

            // 12時間後は、スケーリングにより約12.52時間後になるはず
            const expectedHours = 12 * (24 / 23);
            const actualHours = ahTime.getHours() + ahTime.getMinutes() / 60;

            expect(actualHours).toBeCloseTo(expectedHours, 1);
        });

        it('should calculate Another Hour time in Another Hour period', () => {
            const realTime = new Date('2025-01-15T23:30:00');
            const ahTime = mode.calculateAnotherHourTime(realTime);

            // Another Hour期間は通常速度なので、時刻は変わらないはず
            expect(ahTime.getHours()).toBe(23);
            expect(ahTime.getMinutes()).toBe(30);
        });

        it('should handle custom day start time', () => {
            const customConfig = {
                ...defaultConfig,
                userSettings: {
                    ...defaultConfig.userSettings,
                    dayStartTime: '04:00' // 4時開始
                }
            };

            const customMode = new ClassicMode(customConfig);
            const realTime = new Date('2025-01-15T04:00:00');
            const ahTime = customMode.calculateAnotherHourTime(realTime);

            // 一日の開始時刻なので、AH時間も4:00であるべき
            expect(ahTime.getHours()).toBe(4);
            expect(ahTime.getMinutes()).toBe(0);
        });
    });

    describe('Clock Angles', () => {
        it('should calculate correct clock angles', () => {
            const testTime = new Date('2025-01-15T15:30:45');
            const angles = mode.getClockAngles(testTime);

            expect(angles).toHaveProperty('hours');
            expect(angles).toHaveProperty('minutes');
            expect(angles).toHaveProperty('seconds');

            // 角度は0-360の範囲
            expect(angles.hours).toBeGreaterThanOrEqual(0);
            expect(angles.hours).toBeLessThan(360);
            expect(angles.minutes).toBeGreaterThanOrEqual(0);
            expect(angles.minutes).toBeLessThan(360);
            expect(angles.seconds).toBeGreaterThanOrEqual(0);
            expect(angles.seconds).toBeLessThan(360);
        });

        it('should include milliseconds in second hand calculation', () => {
            const time1 = new Date('2025-01-15T12:00:00.000');
            const time2 = new Date('2025-01-15T12:00:00.500');

            const angles1 = mode.getClockAngles(time1);
            const angles2 = mode.getClockAngles(time2);

            // 500ミリ秒の差は秒針の角度に反映されるべき
            expect(angles2.seconds - angles1.seconds).toBeCloseTo(3, 1); // 0.5秒 * 6度/秒
        });
    });

    describe('Reverse Time Conversion', () => {
        it('should convert Another Hour time back to real time', () => {
            const realTime = new Date('2025-01-15T12:00:00');
            const ahTime = mode.calculateAnotherHourTime(realTime);
            const convertedBack = mode.convertToRealTime(ahTime);

            // 変換を往復しても元の時刻に戻るべき
            expect(convertedBack.getHours()).toBe(realTime.getHours());
            expect(convertedBack.getMinutes()).toBe(realTime.getMinutes());
        });
    });

    describe('Debug Information', () => {
        it('should provide comprehensive debug info', () => {
            const testTime = new Date('2025-01-15T12:00:00');
            const debugInfo = mode.getDebugInfo(testTime);

            expect(debugInfo).toHaveProperty('mode', TimeDesignMode.Classic);
            expect(debugInfo).toHaveProperty('scaleFactor');
            expect(debugInfo).toHaveProperty('phase');
            expect(debugInfo).toHaveProperty('ahTime');
            expect(debugInfo).toHaveProperty('designed24Duration', 1380);
            expect(debugInfo).toHaveProperty('dayStartTime', '0:00');
            expect(debugInfo).toHaveProperty('designed24Hours', 23);
            expect(debugInfo).toHaveProperty('anotherHourDuration', 60);
            expect(debugInfo).toHaveProperty('currentPhase');
        });
    });

    describe('Edge Cases', () => {
        it('should handle midnight crossing', () => {
            const beforeMidnight = new Date('2025-01-15T23:59:00');
            const afterMidnight = new Date('2025-01-16T00:01:00');

            const phaseBefore = mode.getCurrentPhase(beforeMidnight);
            const phaseAfter = mode.getCurrentPhase(afterMidnight);

            // 日付が変わってもフェーズ計算は正しく動作すべき
            expect(phaseBefore.name).toBe('Another Hour');
            expect(phaseAfter.name).toBe('Designed 24');
        });

        it('should handle zero duration Designed 24', () => {
            const zeroConfig = {
                ...defaultConfig,
                parameters: {
                    designed24Duration: 0
                }
            };

            const zeroMode = new ClassicMode(zeroConfig);
            const phase = zeroMode.getCurrentPhase(new Date());

            // すべてがAnother Hour期間になるべき
            expect(phase.name).toBe('Another Hour');
            expect(zeroMode.calculateScaleFactor(new Date())).toBe(1.0);
        });
    });
});