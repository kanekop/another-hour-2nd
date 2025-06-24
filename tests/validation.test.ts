import {
    validateParameters,
    validateClassicMode,
    validateCoreTimeMode,
    validateWakeBasedMode,
    validateSolarMode,
} from '../src/validation';
import { TimeDesignMode, ClassicModeParams, CoreTimeModeParams, WakeBasedModeParams, SolarModeParams } from '../src/types/time-modes';

describe('Parameter Validation', () => {
    // ...
    // スキップされたテスト...
    // ...

    describe('validateClassicMode', () => {
        it('should return valid parameters for a valid config', () => {
            const params = { designed24Duration: 1380 };
            expect(validateClassicMode(params)).toEqual(params);
        });

        it('should throw an error for invalid designed24Duration', () => {
            const params = { designed24Duration: -10 };
            expect(() => validateClassicMode(params)).toThrow();
        });

        it('should throw for unknown properties', () => {
            const params = { designed24Duration: 1380, invalidProp: true };
            expect(() => validateClassicMode(params as any)).toThrow('Unknown properties in parameters: invalidProp');
        });
    });

    describe('validateCoreTimeMode', () => {
        it('should return valid parameters for a valid config', () => {
            const params = { coreTimeStart: '08:00', coreTimeEnd: '22:00', minCoreHours: 6 };
            expect(validateCoreTimeMode(params)).toEqual(params);
        });

        it('should throw for invalid time format', () => {
            const params = { coreTimeStart: '8:00', coreTimeEnd: '22:00', minCoreHours: 6 };
            expect(() => validateCoreTimeMode(params)).toThrow();
        });
    });

    describe('validateWakeBasedMode', () => {
        it('should return valid parameters for a valid config', () => {
            const params = { defaultWakeTime: '07:30', anotherHourDuration: 60, maxScaleFactor: 2.0 };
            expect(validateWakeBasedMode(params)).toEqual(params);
        });

        it('should throw for invalid anotherHourDuration', () => {
            const params = { defaultWakeTime: '07:30', anotherHourDuration: 9999, maxScaleFactor: 2.0 };
            expect(() => validateWakeBasedMode(params)).toThrow();
        });
    });

    describe('validateSolarMode', () => {
        it('should return valid parameters for a valid config', () => {
            const params = { dayHoursTarget: 12, seasonalAdjustment: false };
            expect(validateSolarMode(params)).toEqual(params);
        });

        it('should throw for invalid dayHoursTarget', () => {
            const params = { dayHoursTarget: 25, seasonalAdjustment: false };
            expect(() => validateSolarMode(params)).toThrow();
        });
    });
}); 