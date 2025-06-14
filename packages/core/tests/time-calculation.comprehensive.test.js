// packages/core/tests/time-calculation.comprehensive.test.js
const {
    getCustomAhAngles,
    convertToAHTime,
    getTimeScalingFactor,
    isInDesigned24
} = require('../src/time-calculation');

describe('Comprehensive Time Calculation Tests', () => {

    describe('Edge Cases and Boundary Conditions', () => {

        describe('Zero Duration Designed 24', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 0;

            test('should handle zero duration correctly', () => {
                const currentTime = new Date('2025-06-14T12:00:00');
                const angles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);

                // Should immediately be in Another Hour period
                expect(angles).toBeDefined();
                expect(isInDesigned24(currentTime, designed24Duration, d24StartTime)).toBe(false);
            });

            test('should return scaling factor of 1 for zero duration', () => {
                expect(getTimeScalingFactor(0)).toBe(1);
            });
        });

        describe('24-Hour Duration (No Another Hour)', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 24;

            test('should always be in Designed 24', () => {
                const times = [
                    new Date('2025-06-14T06:00:00'),
                    new Date('2025-06-14T18:00:00'),
                    new Date('2025-06-15T05:59:59')
                ];

                times.forEach(time => {
                    expect(isInDesigned24(time, designed24Duration, d24StartTime)).toBe(true);
                });
            });

            test('should have 1:1 time scaling', () => {
                expect(getTimeScalingFactor(24)).toBe(1);

                const realTime = new Date('2025-06-14T12:00:00'); // 6 hours later
                const ahTime = convertToAHTime(realTime, designed24Duration, d24StartTime);

                expect(ahTime.hours).toBe(6);
                expect(ahTime.minutes).toBe(0);
            });
        });

        describe('Very Short Designed 24 (< 1 hour)', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 0.5; // 30 minutes

            test('should handle extreme time compression', () => {
                const scaleFactor = getTimeScalingFactor(designed24Duration);
                expect(scaleFactor).toBe(48); // 24 / 0.5

                // 15 minutes real time = 12 AH hours
                const realTime = new Date('2025-06-14T06:15:00');
                const ahTime = convertToAHTime(realTime, designed24Duration, d24StartTime);

                expect(ahTime.hours).toBe(12);
            });

            test('should transition to Another Hour after 30 minutes', () => {
                const beforeAH = new Date('2025-06-14T06:29:00');
                const afterAH = new Date('2025-06-14T06:31:00');

                expect(isInDesigned24(beforeAH, designed24Duration, d24StartTime)).toBe(true);
                expect(isInDesigned24(afterAH, designed24Duration, d24StartTime)).toBe(false);
            });
        });

        describe('Fractional Hours and Minutes', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 7.25; // 7 hours 15 minutes

            test('should handle fractional designed 24 duration', () => {
                const scaleFactor = getTimeScalingFactor(designed24Duration);
                expect(scaleFactor).toBeCloseTo(3.31, 2);

                // At end of Designed 24
                const endTime = new Date('2025-06-14T13:15:00');
                expect(isInDesigned24(endTime, designed24Duration, d24StartTime)).toBe(false);
            });

            test('should calculate minutes precisely', () => {
                const realTime = new Date('2025-06-14T07:30:30'); // 1h 30m 30s later
                const ahTime = convertToAHTime(realTime, designed24Duration, d24StartTime);

                // 1.5 hours * 3.31 ≈ 4.965 hours = 4h 58m
                expect(ahTime.hours).toBe(4);
                expect(ahTime.minutes).toBeGreaterThanOrEqual(57);
                expect(ahTime.minutes).toBeLessThanOrEqual(59);
            });
        });

        describe('Cross-Day Scenarios', () => {
            const d24StartTime = new Date('2025-06-14T22:00:00'); // 10 PM start
            const designed24Duration = 8;

            test('should handle midnight crossing in Designed 24', () => {
                const beforeMidnight = new Date('2025-06-14T23:59:00');
                const afterMidnight = new Date('2025-06-15T01:00:00');

                expect(isInDesigned24(beforeMidnight, designed24Duration, d24StartTime)).toBe(true);
                expect(isInDesigned24(afterMidnight, designed24Duration, d24StartTime)).toBe(true);
            });

            test('should calculate correct AH time across days', () => {
                const nextDay = new Date('2025-06-15T02:00:00'); // 4 hours later
                const ahTime = convertToAHTime(nextDay, designed24Duration, d24StartTime);

                // 4 hours * (24/8) = 12 AH hours
                expect(ahTime.hours).toBe(12);
            });
        });

        describe('Negative Time Differences', () => {
            const d24StartTime = new Date('2025-06-14T12:00:00');
            const designed24Duration = 12;

            test('should handle time before D24 start', () => {
                const earlierTime = new Date('2025-06-14T06:00:00'); // 6 hours before
                const angles = getCustomAhAngles(earlierTime, designed24Duration, d24StartTime);

                // Should handle gracefully, possibly wrapping around
                expect(angles).toBeDefined();
                expect(angles.hourAngle).toBeDefined();
                expect(angles.minuteAngle).toBeDefined();
            });
        });
    });

    describe('Clock Angle Calculations', () => {
        const d24StartTime = new Date('2025-06-14T00:00:00');
        const designed24Duration = 12;

        test('should calculate correct angles for each hour', () => {
            const testCases = [
                { hours: 0, expectedAngle: 0 },
                { hours: 3, expectedAngle: 180 },
                { hours: 6, expectedAngle: 0 },
                { hours: 9, expectedAngle: 180 },
                { hours: 12, expectedAngle: 0 }, // Full rotation
            ];

            testCases.forEach(({ hours, expectedAngle }) => {
                const time = new Date(d24StartTime.getTime() + hours * 60 * 60 * 1000);
                const angles = getCustomAhAngles(time, designed24Duration, d24StartTime);

                expect(angles.hourAngle).toBe(expectedAngle % 360);
            });
        });

        test('should handle minute angles correctly', () => {
            const time = new Date('2025-06-14T01:30:00'); // 1.5 hours
            const angles = getCustomAhAngles(time, designed24Duration, d24StartTime);

            // 1.5 hours * 2 scale = 3 AH hours
            // Minute angle should be 0 (no fractional hour)
            expect(angles.minuteAngle).toBe(0);
        });
    });

    describe('Performance Tests', () => {
        test('should handle rapid calculations efficiently', () => {
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 16;
            const iterations = 10000;

            const startPerf = Date.now();

            for (let i = 0; i < iterations; i++) {
                const currentTime = new Date(d24StartTime.getTime() + i * 1000);
                getCustomAhAngles(currentTime, designed24Duration, d24StartTime);
            }

            const endPerf = Date.now();
            const avgTime = (endPerf - startPerf) / iterations;

            // Should complete 10k calculations in under 100ms (avg < 0.01ms per calc)
            expect(endPerf - startPerf).toBeLessThan(100);
            expect(avgTime).toBeLessThan(0.01);
        });
    });

    describe('Input Validation', () => {
        test('should handle invalid inputs gracefully', () => {
            const validTime = new Date();
            const validDuration = 12;
            const validStart = new Date();

            // Test with null/undefined values
            expect(() => getCustomAhAngles(null, validDuration, validStart)).not.toThrow();
            expect(() => getCustomAhAngles(validTime, null, validStart)).not.toThrow();
            expect(() => getCustomAhAngles(validTime, validDuration, null)).not.toThrow();

            // Test with invalid types
            expect(() => getCustomAhAngles('invalid', validDuration, validStart)).not.toThrow();
            expect(() => getCustomAhAngles(validTime, 'invalid', validStart)).not.toThrow();

            // Test with negative duration
            const result = getTimeScalingFactor(-10);
            expect(result).toBeDefined();
        });
    });
});

describe('Time Design Mode Integration Tests', () => {
    // These tests prepare for future Time Design Modes implementation

    describe('Mode-Specific Calculations', () => {
        test('Classic Mode behavior', () => {
            // Classic mode uses standard D24 + AH
            const d24StartTime = new Date('2025-06-14T06:00:00');
            const designed24Duration = 16;

            const morningTime = new Date('2025-06-14T08:00:00');
            const eveningTime = new Date('2025-06-14T23:00:00');

            expect(isInDesigned24(morningTime, designed24Duration, d24StartTime)).toBe(true);
            expect(isInDesigned24(eveningTime, designed24Duration, d24StartTime)).toBe(false);
        });

        test('Placeholder for Core Time Mode', () => {
            // TODO: Implement when Core Time Mode is added
            expect(true).toBe(true);
        });

        test('Placeholder for Wake-Based Mode', () => {
            // TODO: Implement when Wake-Based Mode is added
            expect(true).toBe(true);
        });

        test('Placeholder for Solar Mode', () => {
            // TODO: Implement when Solar Mode is added
            expect(true).toBe(true);
        });
    });
});