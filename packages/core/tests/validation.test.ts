// tests/validation.test.ts
import { validateTimeConfig, validateModeParameters } from '../src/validation';
import { AHTimeConfig, TimeDesignMode, ClassicModeParams, CoreTimeModeParams, WakeBasedModeParams, SolarModeParams } from '../src/types';

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
            designed24Duration: 8,
            d24StartTime: new Date(),
        };
        const result = validateModeParameters(TimeDesignMode.Classic, params);
        expect(result.isValid).toBe(true);
    });

    it('should validate core-time mode parameters successfully', () => {
        const params: CoreTimeModeParams = {
            coreStartTime: new Date(),
            coreEndTime: new Date(),
            designed24Duration: 8,
        };
        const result = validateModeParameters(TimeDesignMode.CoreTime, params);
        expect(result.isValid).toBe(true);
    });

    it('should validate wake-based mode parameters successfully', () => {
        const params: WakeBasedModeParams = {
            wakeUpTime: new Date(),
            designed24Duration: 8,
        };
        const result = validateModeParameters(TimeDesignMode.WakeBased, params);
        expect(result.isValid).toBe(true);
    });

    it('should validate solar mode parameters successfully', () => {
        const params: SolarModeParams = {
            latitude: 0,
            longitude: 0,
            designed24Duration: 8,
        };
        const result = validateModeParameters(TimeDesignMode.Solar, params);
        expect(result.isValid).toBe(true);
    });

    it('should return error for unknown mode', () => {
        const params: ClassicModeParams = {
            designed24Duration: 8,
            d24StartTime: new Date(),
        };
        const result = validateModeParameters('unknown-mode' as any, params);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors?.[0].code).toBe('UNKNOWN_MODE');
    });
}); 