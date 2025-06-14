
import {
    getCustomAhAngles,
    convertToAHTime,
    getTimeScalingFactor,
    isInDesigned24,
    ClockAngles,
    AHTime
} from '../src/time-calculation';

describe('Time Calculation Comprehensive Tests', () => {
    describe('Edge Cases and Error Handling', () => {
        const d24StartTime = new Date('2025-06-14T06:00:00');
        
        test('should handle zero designed24Duration', () => {
            const currentTime = new Date('2025-06-14T12:00:00');
            const scaleFactor = getTimeScalingFactor(0);
            expect(scaleFactor).toBe(1);
        });

        test('should handle negative elapsed time', () => {
            const currentTime = new Date('2025-06-14T05:00:00'); // Before start
            const designed24Duration = 16;
            
            const angles: ClockAngles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);
            expect(typeof angles.hourAngle).toBe('number');
            expect(typeof angles.minuteAngle).toBe('number');
        });

        test('should handle very large designed24Duration', () => {
            const designed24Duration = 100; // Larger than 24 hours
            const scaleFactor = getTimeScalingFactor(designed24Duration);
            expect(scaleFactor).toBe(24 / 100);
        });
    });

    describe('Multiple Time Scenarios', () => {
        const testCases = [
            {
                name: '8-hour Designed 24',
                designed24Duration: 8,
                d24StartTime: new Date('2025-06-14T08:00:00'),
                testTime: new Date('2025-06-14T12:00:00'), // 4 hours later
                expectedAHHours: 12, // 4 * 3 = 12
                expectedScaleFactor: 3
            },
            {
                name: '12-hour Designed 24',
                designed24Duration: 12,
                d24StartTime: new Date('2025-06-14T06:00:00'),
                testTime: new Date('2025-06-14T12:00:00'), // 6 hours later
                expectedAHHours: 12, // 6 * 2 = 12
                expectedScaleFactor: 2
            },
            {
                name: '20-hour Designed 24',
                designed24Duration: 20,
                d24StartTime: new Date('2025-06-14T06:00:00'),
                testTime: new Date('2025-06-14T16:00:00'), // 10 hours later
                expectedAHHours: 12, // 10 * 1.2 = 12
                expectedScaleFactor: 1.2
            }
        ];

        testCases.forEach(testCase => {
            test(`should work correctly with ${testCase.name}`, () => {
                const scaleFactor = getTimeScalingFactor(testCase.designed24Duration);
                expect(scaleFactor).toBeCloseTo(testCase.expectedScaleFactor, 5);

                const ahTime: AHTime = convertToAHTime(
                    testCase.testTime, 
                    testCase.designed24Duration, 
                    testCase.d24StartTime
                );
                expect(ahTime.hours).toBe(testCase.expectedAHHours);

                const isD24 = isInDesigned24(
                    testCase.testTime, 
                    testCase.designed24Duration, 
                    testCase.d24StartTime
                );
                expect(isD24).toBe(true);
            });
        });
    });

    describe('Angle Calculations Precision', () => {
        test('should calculate precise angles for fractional hours', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 16;
            // 2.5 hours into Designed 24
            const currentTime = new Date('2025-06-14T08:30:00');
            
            const angles: ClockAngles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);
            
            // 2.5 * (24/16) = 3.75 AH hours
            // Hour angle: 3.75 * 30 = 112.5 degrees
            // Minute angle: 0.75 * 60 = 45 minutes = 45 * 6 = 270 degrees
            expect(angles.hourAngle).toBeCloseTo(112.5, 1);
            expect(angles.minuteAngle).toBeCloseTo(270, 1);
        });

        test('should handle angle wraparound correctly', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 4; // Very short Designed 24
            // 5 hours later (1 hour into Another Hour)
            const currentTime = new Date('2025-06-14T11:00:00');
            
            const angles: ClockAngles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);
            
            // Should be 1 hour in Another Hour
            // Hour angle: 1 * 30 = 30 degrees
            expect(angles.hourAngle).toBe(30);
            expect(angles.minuteAngle).toBe(0);
        });
    });

    describe('Performance Tests', () => {
        test('should handle many calculations efficiently', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 16;
            const iterations = 1000;
            
            const startTime = performance.now();
            
            for (let i = 0; i < iterations; i++) {
                const testTime = new Date(d24StartTime.getTime() + i * 60000); // Each minute
                getCustomAhAngles(testTime, designed24Duration, d24StartTime);
                convertToAHTime(testTime, designed24Duration, d24StartTime);
                isInDesigned24(testTime, designed24Duration, d24StartTime);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Should complete within reasonable time (adjust threshold as needed)
            expect(totalTime).toBeLessThan(100); // 100ms for 1000 iterations
        });
    });
});
