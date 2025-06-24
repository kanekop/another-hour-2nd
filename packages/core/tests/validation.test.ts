// tests/validation.test.ts
import { validateTimeConfig, validateModeParameters } from '../src/validation.js';
import { TimeDesignMode, ClassicModeParams, CoreTimeModeParams, WakeBasedModeParams, SolarModeParams } from '../src/types/time-modes.js';

// テスト用の型定義
interface AHTimeConfig {
    designed24Duration: number;
    d24StartTime?: Date;
}

describe('validateTimeConfig', () => {
    it('should validate valid config', () => {
        const config: AHTimeConfig = {
            designed24Duration: 8,
            d24StartTime: new Date('2024-01-01T09:00:00')
        };
        const result = validateTimeConfig(config);
        expect(result.isValid).toBe(true);
    });

    it('should reject negative duration', () => {
        const config: AHTimeConfig = {
            designed24Duration: -1,
            d24StartTime: new Date()
        };
        const result = validateTimeConfig(config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
    });
});

describe('validateModeParameters', () => {
    it('should validate classic mode parameters successfully', () => {
        const params: ClassicModeParams = {
            designed24Duration: 8
        };
        const result = validateModeParameters(TimeDesignMode.Classic, params);
        expect(result.isValid).toBe(true);
    });

    it('should validate core-time mode parameters successfully', () => {
        const params: CoreTimeModeParams = {
            coreTimeStart: '07:00',
            coreTimeEnd: '22:00',
            minCoreHours: 6
        };
        const result = validateModeParameters(TimeDesignMode.CoreTime, params);
        expect(result.isValid).toBe(true);
    });

    it('should validate wake-based mode parameters successfully', () => {
        const params: WakeBasedModeParams = {
            defaultWakeTime: '07:00',
            anotherHourDuration: 60,
            maxScaleFactor: 2.0
        };
        const result = validateModeParameters(TimeDesignMode.WakeBased, params);
        expect(result.isValid).toBe(true);
    });

    it('should validate solar mode parameters successfully', () => {
        const params: SolarModeParams = {
            dayHoursTarget: 12,
            seasonalAdjustment: true
        };
        const result = validateModeParameters(TimeDesignMode.Solar, params);
        expect(result.isValid).toBe(true);
    });

    it('should return error for unknown mode', () => {
        const params: ClassicModeParams = {
            designed24Duration: 8
        };
        const result = validateModeParameters('unknown-mode' as any, params);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0].code).toBe('UNKNOWN_MODE');
    });
}); 