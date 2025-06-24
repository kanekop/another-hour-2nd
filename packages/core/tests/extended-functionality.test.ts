
/**
 * Extended functionality tests for Another Hour Core
 * Tests the new extended time conversion and scaling information functions
 */

import {
    getTimeScalingInfo,
    convertToExtendedAHTime,
    TimeScaling,
    ExtendedAHTime
} from '../src';

describe('Extended Another Hour Functionality', () => {
    const d24StartTime = new Date('2025-06-14T06:00:00');
    const designed24Duration = 16;

    describe('getTimeScalingInfo', () => {
        test('should return correct scaling info during Designed 24', () => {
            const testTime = new Date('2025-06-14T14:00:00'); // 8 hours after start
            const scalingInfo: TimeScaling = getTimeScalingInfo(testTime, designed24Duration, d24StartTime);

            expect(scalingInfo.isInDesigned24).toBe(true);
            expect(scalingInfo.currentPhase).toBe('designed24');
            expect(scalingInfo.scaleFactor).toBe(1.5); // 24/16 = 1.5
        });

        test('should return correct scaling info during Another Hour', () => {
            const testTime = new Date('2025-06-15T00:00:00'); // 18 hours after start (past D24)
            const scalingInfo: TimeScaling = getTimeScalingInfo(testTime, designed24Duration, d24StartTime);

            expect(scalingInfo.isInDesigned24).toBe(false);
            expect(scalingInfo.currentPhase).toBe('another-hour');
            expect(scalingInfo.scaleFactor).toBe(1);
        });
    });

    describe('convertToExtendedAHTime', () => {
        test('should return complete extended AH time object', () => {
            const testTime = new Date('2025-06-14T14:00:00');
            const extendedTime: ExtendedAHTime = convertToExtendedAHTime(testTime, designed24Duration, d24StartTime);

            expect(extendedTime.hours).toBe(12); // 8 * 1.5 = 12
            expect(extendedTime.minutes).toBe(0);
            expect(extendedTime.formatted).toBe('12:00');
            expect(extendedTime.realTime).toEqual(testTime);
            expect(extendedTime.scaling.isInDesigned24).toBe(true);
            expect(extendedTime.scaling.scaleFactor).toBe(1.5);
        });

        test('should format time correctly with leading zeros', () => {
            const testTime = new Date('2025-06-14T06:30:00'); // 30 minutes after start
            const extendedTime: ExtendedAHTime = convertToExtendedAHTime(testTime, designed24Duration, d24StartTime);

            expect(extendedTime.formatted).toBe('00:45'); // 0.5 * 1.5 = 0.75 hours = 45 minutes
        });
    });

    describe('Error Handling', () => {
        test('should throw error for zero designed24Duration', () => {
            const testTime = new Date();
            expect(() => {
                getTimeScalingInfo(testTime, 0, d24StartTime);
            }).toThrow('designed24Duration must be greater than 0');
        });

        test('should throw error for negative designed24Duration', () => {
            const testTime = new Date();
            expect(() => {
                convertToExtendedAHTime(testTime, -5, d24StartTime);
            }).toThrow('designed24Duration must be greater than 0');
        });
    });
});
