
import {
    getCustomAhAngles,
    convertToAHTime,
    getTimeScalingFactor,
    isInDesigned24,
    ClockAngles,
    AHTime
} from '../src/time-calculation';

describe('Time Calculation Module', () => {
    const d24StartTime = new Date('2025-06-14T06:00:00');
    const designed24Duration = 16; // 16 hours

    describe('getCustomAhAngles', () => {
        test('should calculate correct angles at start of Designed 24', () => {
            const currentTime = new Date('2025-06-14T06:00:00');
            const angles: ClockAngles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);

            expect(angles.hourAngle).toBe(0);
            expect(angles.minuteAngle).toBe(0);
        });

        test('should calculate correct angles midway through Designed 24', () => {
            const currentTime = new Date('2025-06-14T14:00:00'); // 8 hours later
            const angles: ClockAngles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);

            // 8 hours elapsed, scale factor = 24/16 = 1.5
            // Scaled hours = 8 * 1.5 = 12
            // Hour angle = 12 * 30 = 360 % 360 = 0
            expect(angles.hourAngle).toBe(0);
            expect(angles.minuteAngle).toBe(0);
        });

        test('should calculate correct angles in Another Hour period', () => {
            const currentTime = new Date('2025-06-14T23:00:00'); // 17 hours later
            const angles: ClockAngles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);

            // 17 hours elapsed, 1 hour into AH period
            // Hour angle = 1 * 30 = 30
            expect(angles.hourAngle).toBe(30);
            expect(angles.minuteAngle).toBe(0);
        });
    });

    describe('convertToAHTime', () => {
        test('should convert time at start of Designed 24', () => {
            const realTime = new Date('2025-06-14T06:00:00');
            const ahTime: AHTime = convertToAHTime(realTime, designed24Duration, d24StartTime);

            expect(ahTime.hours).toBe(0);
            expect(ahTime.minutes).toBe(0);
        });

        test('should convert time with scaling in Designed 24', () => {
            const realTime = new Date('2025-06-14T10:00:00'); // 4 hours later
            const ahTime: AHTime = convertToAHTime(realTime, designed24Duration, d24StartTime);

            // 4 hours * 1.5 scale = 6 AH hours
            expect(ahTime.hours).toBe(6);
            expect(ahTime.minutes).toBe(0);
        });

        test('should convert time with minutes', () => {
            const realTime = new Date('2025-06-14T10:30:00'); // 4.5 hours later
            const ahTime: AHTime = convertToAHTime(realTime, designed24Duration, d24StartTime);

            // 4.5 hours * 1.5 scale = 6.75 AH hours = 6h 45m
            expect(ahTime.hours).toBe(6);
            expect(ahTime.minutes).toBe(45);
        });
    });

    describe('getTimeScalingFactor', () => {
        test('should return correct scaling factor', () => {
            expect(getTimeScalingFactor(24)).toBe(1);
            expect(getTimeScalingFactor(12)).toBe(2);
            expect(getTimeScalingFactor(8)).toBe(3);
            expect(getTimeScalingFactor(0)).toBe(1); // Edge case
        });
    });

    describe('isInDesigned24', () => {
        test('should return true during Designed 24', () => {
            const duringD24 = new Date('2025-06-14T14:00:00');
            expect(isInDesigned24(duringD24, designed24Duration, d24StartTime)).toBe(true);
        });

        test('should return false during Another Hour', () => {
            const duringAH = new Date('2025-06-14T23:00:00');
            expect(isInDesigned24(duringAH, designed24Duration, d24StartTime)).toBe(false);
        });

        test('should handle edge case at transition', () => {
            const atTransition = new Date('2025-06-14T22:00:00'); // Exactly 16 hours
            expect(isInDesigned24(atTransition, designed24Duration, d24StartTime)).toBe(false);
        });
    });
});
