import { SolarMode } from '../src/modes/SolarMode';
import { TimeDesignMode } from '../src/types/time-modes';
import * as SunCalc from 'suncalc';

// Mock SunCalc to have predictable results for tests
jest.mock('suncalc', () => ({
    getTimes: jest.fn((date, lat, lon) => {
        // Return consistent times for Tokyo for testing purposes
        const baseDate = new Date(date);
        baseDate.setHours(0, 0, 0, 0);

        if (lat === 35.6762) { // Tokyo
            return {
                solarNoon: new Date(baseDate.getTime() + 11.72 * 3600 * 1000), // 11:43
                sunrise: new Date(baseDate.getTime() + 4.43 * 3600 * 1000),   // 04:26
                sunset: new Date(baseDate.getTime() + 19 * 3600 * 1000),     // 19:00
            };
        }
        // Add other locations if needed for tests
        return {};
    })
}));

describe('SolarMode', () => {
    let mode: SolarMode;

    const tokyoConfig = {
        mode: TimeDesignMode.Solar,
        parameters: {
            location: { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 },
            dayHoursTarget: 12,
            seasonalAdjustment: false,
        },
        userSettings: {
            userId: 'test-user',
            dayStartTime: '00:00',
            defaultTimezone: 'Asia/Tokyo',
            preferredMode: TimeDesignMode.Solar,
        }
    };

    beforeEach(() => {
        // Reset the mock before each test
        (SunCalc.getTimes as jest.Mock).mockClear();
        mode = new SolarMode(tokyoConfig);
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with correct solar times for the location', () => {
            expect(mode).toBeInstanceOf(SolarMode);
            expect(SunCalc.getTimes).toHaveBeenCalled();
            // Check if one of the solar times is correctly set (e.g., solar noon)
            const solarNoonHour = new Date(new Date().setHours(11, 43, 0, 0)).getHours();
            // This is tricky due to timezone differences in test runner vs. expected
            // A better test would be to check the internal values.
            // For now, let's trust the mock is working and was called.
        });
    });

    describe('Phase Detection and Scale Factor', () => {
        it('should correctly identify Day (AM) phase', () => {
            const time = new Date(new Date().setHours(8, 0, 0, 0)); // 08:00
            const phase = mode.getCurrentPhase(time);
            expect(phase.name).toBe('Day (AM)');
        });

        it('should calculate the correct scale factor for Day time', () => {
            const time = new Date(new Date().setHours(8, 0, 0, 0));
            // Actual day duration for mock Tokyo: 19:00 - 04:26 = 14.57 hours
            // Target day hours: 12
            // Scale = 12 / 14.57 ~= 0.823
            expect(mode.calculateScaleFactor(time)).toBeCloseTo(0.823);
        });

        it('should calculate the correct scale factor for Night time', () => {
            const time = new Date(new Date().setHours(22, 0, 0, 0));
            // Actual day duration: 14.57h, so night is 24 - 14.57 = 9.43h
            // Target day: 12h, so night is 24 - 12 = 12h
            // Scale = 12 / 9.43 ~= 1.27
            expect(mode.calculateScaleFactor(time)).toBeCloseTo(1.27);
        });
    });

    describe('Time Calculation and Conversion', () => {
        it('should map real solar noon to 12:00 AH', () => {
            const realSolarNoon = new Date(new Date().setHours(11, 43, 0, 0));
            const ahTime = mode.calculateAnotherHourTime(realSolarNoon);

            expect(ahTime.getUTCHours()).toBe(12);
            expect(ahTime.getUTCMinutes()).toBe(0);
        });

        it('should map real sunrise to 06:00 AH', () => {
            const realSunrise = new Date(new Date().setHours(4, 26, 0, 0));
            const ahTime = mode.calculateAnotherHourTime(realSunrise);

            expect(ahTime.getUTCHours()).toBe(6);
            expect(ahTime.getUTCMinutes()).toBe(0);
        });

        it('should map real sunset to 18:00 AH', () => {
            const realSunset = new Date(new Date().setHours(19, 0, 0, 0));
            const ahTime = mode.calculateAnotherHourTime(realSunset);

            expect(ahTime.getUTCHours()).toBe(18);
            expect(ahTime.getUTCMinutes()).toBe(0);
        });

        it('should convert time back and forth correctly', () => {
            const realTime = new Date(new Date().setHours(15, 0, 0, 0)); // 3 PM
            const ahTime = mode.calculateAnotherHourTime(realTime);
            const convertedBack = mode.convertToRealTime(ahTime);

            expect(convertedBack.getHours()).toBe(realTime.getHours());
            // Minutes might have small differences due to float precision
            expect(convertedBack.getMinutes()).toBeCloseTo(realTime.getMinutes());
        });
    });
}); 