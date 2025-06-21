import { WakeBasedMode } from '../src/modes/WakeBasedMode.js';
import { TimeDesignMode, DEFAULT_VALUES } from '../src/types/time-modes.js';

describe('WakeBasedMode', () => {
    let mode: WakeBasedMode;

    const defaultConfig = {
        mode: TimeDesignMode.WakeBased,
        parameters: {
            defaultWakeTime: '07:00',
            anotherHourDuration: 60,
            maxScaleFactor: 2.0,
        },
        userSettings: {
            userId: 'test-user',
            dayStartTime: '00:00', // Not used in this mode, but part of the user settings
            defaultTimezone: 'Asia/Tokyo',
            preferredMode: TimeDesignMode.WakeBased
        }
    };

    beforeEach(() => {
        mode = new WakeBasedMode(defaultConfig);
    });

    describe('Constructor and Validation', () => {
        it('should create an instance with valid config', () => {
            expect(mode).toBeInstanceOf(WakeBasedMode);
            expect(mode.getDefaultWakeTime()).toBe('07:00');
            expect(mode.getAnotherHourDuration()).toBe(60);
            expect(mode.getMaxScaleFactor()).toBe(2.0);
            expect(mode.getWakeTime()).toBe(420); // 07:00 in minutes
        });

        it('should use todayWakeTime if provided', () => {
            const configWithTodayWake = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    todayWakeTime: '08:30'
                }
            };
            const customMode = new WakeBasedMode(configWithTodayWake);
            expect(customMode.getWakeTime()).toBe(510); // 08:30 in minutes
        });

        it('should throw error for invalid anotherHourDuration', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: { ...defaultConfig.parameters, anotherHourDuration: 800 }
            };
            expect(() => new WakeBasedMode(invalidConfig)).toThrow('Another Hour Duration must be between 0 and 12 hours.');
        });

        it('should throw error for invalid maxScaleFactor', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: { ...defaultConfig.parameters, maxScaleFactor: 0.5 }
            };
            expect(() => new WakeBasedMode(invalidConfig)).toThrow('Max Scale Factor must be between 1.0 and 5.0.');
        });
    });

    describe('Phase Detection', () => {
        it('should detect Night phase', () => {
            const time = new Date('2025-01-15T06:00:00'); // Before 07:00 wake time
            const phase = mode.getCurrentPhase(time);
            expect(phase.name).toBe('Night');
        });

        it('should detect Designed Day phase', () => {
            const time = new Date('2025-01-15T12:00:00'); // After wake time and before Another Hour
            const phase = mode.getCurrentPhase(time);
            expect(phase.name).toBe('Designed Day');
        });

        it('should detect Another Hour phase', () => {
            const time = new Date('2025-01-15T23:30:00'); // Within the last hour
            const phase = mode.getCurrentPhase(time);
            expect(phase.name).toBe('Another Hour');
        });
    });

    describe('Scale Factor Calculation', () => {
        it('should calculate scale factor based on spec example', () => {
            // wakeTime = "07:00" (420 min), anotherHourDuration = 60 min
            // totalActivityMinutes = 1440 - 420 = 1020 min
            // designedRealDuration = 1020 - 60 = 960 min
            // scaleFactor = 1020 / 960 = 1.0625
            const time = new Date('2025-01-15T12:00:00'); // During Designed Day
            const scale = mode.calculateScaleFactor(time);
            expect(scale).toBeCloseTo(1.0625);
        });

        it('should cap the scale factor at maxScaleFactor', () => {
            // wakeTime = "04:00" (240), anotherHourDuration = 60
            // totalActivity = 1200, designedReal = 1140, scale = 1200/1140 = 1.05
            // Let's force a higher scale:
            // wakeTime = "12:00" (720), anotherHourDuration = 60
            // totalActivity = 720, designedReal = 660, scale = 720/660 = 1.09
            // Let's use a very short day
            const config = {
                ...defaultConfig,
                parameters: { ...defaultConfig.parameters, defaultWakeTime: '22:00', maxScaleFactor: 1.5 } // wake at 22:00
            };
            const aggressiveMode = new WakeBasedMode(config);
            // totalActivity = 1440 - 1320 = 120 min. designedReal = 120-60 = 60 min.
            // scale = 120/60 = 2.0. Should be capped at 1.5
            const scale = aggressiveMode.calculateScaleFactor(new Date('2025-01-15T22:30:00'));
            expect(scale).toBe(1.5);
        });

        it('should be 1.0 during Night and Another Hour phases', () => {
            const nightTime = new Date('2025-01-15T04:00:00');
            const ahTime = new Date('2025-01-15T23:30:00');
            expect(mode.calculateScaleFactor(nightTime)).toBe(1.0);
            expect(mode.calculateScaleFactor(ahTime)).toBe(1.0);
        });
    });

    describe('Time Calculation and Conversion', () => {
        it('should calculate scaled time correctly in Designed Day', () => {
            const realTime = new Date('2025-01-15T17:00:00'); // 10 hours (600 min) after 07:00 wake time
            const ahTime = mode.calculateAnotherHourTime(realTime);
            // elapsed real = 600 min
            // elapsed ah = 600 * 1.0625 = 637.5 min = 10h 37m 30s
            // ah time = 07:00 + 10h 37m 30s = 17:37:30
            expect(ahTime.getHours()).toBe(17);
            expect(ahTime.getMinutes()).toBe(37);
        });

        it('should handle time in Another Hour segment', () => {
            const realTime = new Date('2025-01-15T23:30:00');
            const ahTime = mode.calculateAnotherHourTime(realTime);
            // designed day AH duration = 960 * 1.0625 = 1020 min
            // AH time starts at wakeTime + designedDayAHDuration = 420 + 1020 = 1440 min from day start.
            // This is AH midnight.
            // elapsed in AH = 30 min.
            // Total AH minutes = 1440 + 30 = 1470.
            // 1470 min / 60 = 24.5h = 00:30 on next day in AH time.
            const totalAhMinutes = (1440 - 420) + 30; // total activity minutes + elapsed in AH
            const hours = Math.floor(totalAhMinutes / 60); // This logic seems complex. Let's re-verify.
            // Display time should just be the elapsed time in the AH world.
            // The AH world starts at 07:00.
            // The total duration of the AH world's "day" is 1020 minutes.
            // So at 23:00 real time, AH time is 07:00 + 1020m = 07:00 + 17h = 24:00, which is next day 00:00.
            // At 23:30 real time, it's 30 mins into the AH period, so 00:30 AH time.
            expect(ahTime.getHours()).toBe(0);
            expect(ahTime.getMinutes()).toBe(30);
        });

        it('should convert time back and forth correctly', () => {
            const realTime = new Date('2025-01-15T15:00:00');
            const ahTime = mode.calculateAnotherHourTime(realTime);
            const convertedBack = mode.convertToRealTime(ahTime);
            expect(convertedBack.getHours()).toBe(realTime.getHours());
            expect(convertedBack.getMinutes()).toBe(realTime.getMinutes());
        });
    });
}); 