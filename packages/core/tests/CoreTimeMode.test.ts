import { CoreTimeMode } from '../src/modes/CoreTimeMode';
import { TimeDesignMode, DEFAULT_VALUES } from '../src/types/time-modes';

describe('CoreTimeMode', () => {
    let mode: CoreTimeMode;

    const defaultConfig = {
        mode: TimeDesignMode.CoreTime,
        parameters: {
            coreTimeStart: '07:00',
            coreTimeEnd: '22:00',
            minCoreHours: 6
        },
        userSettings: {
            userId: 'test-user',
            dayStartTime: '00:00',
            defaultTimezone: 'Asia/Tokyo',
            preferredMode: TimeDesignMode.CoreTime
        }
    };

    beforeEach(() => {
        mode = new CoreTimeMode(defaultConfig);
    });

    describe('Constructor and Validation', () => {
        it('should create instance with valid config', () => {
            expect(mode).toBeInstanceOf(CoreTimeMode);
            expect(mode.coreTimeStartStr).toBe('07:00');
            expect(mode.coreTimeEndStr).toBe('22:00');
            expect(mode.minCoreHours).toBe(6);
        });

        it('should use default values when parameters are missing', () => {
            const minimalConfig = {
                mode: TimeDesignMode.CoreTime,
                parameters: {},
                userSettings: defaultConfig.userSettings
            };

            const minimalMode = new CoreTimeMode(minimalConfig);
            expect(minimalMode.coreTimeStartStr).toBe(DEFAULT_VALUES.coreTime.coreTimeStart);
            expect(minimalMode.coreTimeEndStr).toBe(DEFAULT_VALUES.coreTime.coreTimeEnd);
            expect(minimalMode.minCoreHours).toBe(DEFAULT_VALUES.coreTime.minCoreHours);
        });

        it('should throw error for core time less than minCoreHours', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    coreTimeStart: '09:00',
                    coreTimeEnd: '14:00', // 5 hours duration
                }
            };
            expect(() => new CoreTimeMode(invalidConfig)).toThrow('Core Time must be at least 6 hours');
        });

        it('should respect custom minCoreHours', () => {
            const customConfig = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    coreTimeStart: '09:00',
                    coreTimeEnd: '13:00', // 4 hours duration
                    minCoreHours: 4
                }
            };
            // This should not throw an error because minCoreHours is met
            expect(() => new CoreTimeMode(customConfig)).not.toThrow();

            const invalidCustomConfig = {
                ...customConfig,
                parameters: {
                    ...customConfig.parameters,
                    coreTimeEnd: '12:00' // 3 hours duration
                }
            };
            expect(() => new CoreTimeMode(invalidCustomConfig)).toThrow('Core Time must be at least 4 hours');
        });

        it('should throw error if total Another Hour exceeds 12 hours', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    coreTimeStart: '10:00',
                    coreTimeEnd: '21:00', // 11 hours duration, so 13 hours of AH
                    anotherHourAllocation: undefined
                }
            };
            expect(() => new CoreTimeMode(invalidConfig)).toThrow('Total Another Hour cannot exceed 12 hours');
        });

        it('should throw error for invalid anotherHourAllocation', () => {
            const invalidConfig = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    anotherHourAllocation: 1000 // > 720 minutes
                }
            };
            expect(() => new CoreTimeMode(invalidConfig)).toThrow('AnotherHourAllocation must be between 0 and 12 hours');
        });
    });

    describe('Phase Detection', () => {
        it('should detect Morning AH phase', () => {
            const testTime = new Date('2025-01-15T04:00:00'); // Before Core Time
            const phase = mode.getCurrentPhase(testTime);
            expect(phase.name).toBe('Morning AH');
        });

        it('should detect Core Time phase', () => {
            const testTime = new Date('2025-01-15T12:00:00'); // During Core Time
            const phase = mode.getCurrentPhase(testTime);
            expect(phase.name).toBe('Core Time');
        });

        it('should detect Evening AH phase', () => {
            const testTime = new Date('2025-01-15T23:00:00'); // After Core Time
            const phase = mode.getCurrentPhase(testTime);
            expect(phase.name).toBe('Evening AH');
        });
    });

    describe('Scale Factor Calculation', () => {
        it('should return 1.0 when anotherHourAllocation is not provided', () => {
            const config = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    anotherHourAllocation: null,
                }
            };
            const mode = new CoreTimeMode(config);
            const scale = mode.calculateScaleFactor(new Date('2025-01-15T12:00:00'));
            expect(scale).toBe(1.0);
        });

        it('should calculate correct scale factor with anotherHourAllocation', () => {
            // Real Core Time: 15 hours (07:00 to 22:00) = 900 minutes
            // Target AH Allocation: 6 hours = 360 minutes
            // Target Core Duration (in AH space): 24h - 6h = 18h = 1080 minutes
            // Scale Factor: 1080 / 900 = 1.2
            const config = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    anotherHourAllocation: 360,
                }
            };
            const mode = new CoreTimeMode(config);
            const scale = mode.calculateScaleFactor(new Date('2025-01-15T12:00:00'));
            expect(scale).toBe(1.2);
        });
    });

    describe('Time Calculations', () => {
        it('should compress time within Core Time with anotherHourAllocation', () => {
            const config = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    coreTimeStart: '07:00',
                    coreTimeEnd: '22:00', // 15 hours real core time
                    anotherHourAllocation: 360, // 6 hours total AH
                }
            };
            const modeWithCompression = new CoreTimeMode(config);
            const scale = 1.2;

            // Test point: 12:00 real time (5 hours into core time)
            const realTime = new Date('2025-01-15T12:00:00');
            const ahTime = modeWithCompression.calculateAnotherHourTime(realTime);

            // Morning AH (real duration) = 7 hours = 420 mins
            // Elapsed in Core (real) = 12:00 - 07:00 = 5 hours = 300 mins
            // Elapsed in Core (AH) = 300 * 1.2 = 360 mins = 6 hours
            // Total AH minutes = 420 (Morning AH) + 360 (Scaled Core) = 780 mins
            // 780 mins = 13 hours (13:00)
            expect(ahTime.getHours()).toBe(13);
            expect(ahTime.getMinutes()).toBe(0);
        });

        it('should not compress time when allocation is null', () => {
            const realTime = new Date('2025-01-15T12:00:00'); // 5h into core
            const ahTime = mode.calculateAnotherHourTime(realTime);
            // Morning AH (real) = 7h. Elapsed (real) = 5h.
            // AH time = 7h + 5h = 12h
            expect(ahTime.getHours()).toBe(12);
        });
    });

    describe('Reverse Time Conversion', () => {
        it('should convert compressed AH time back to real time', () => {
            const config = {
                ...defaultConfig,
                parameters: {
                    ...defaultConfig.parameters,
                    coreTimeStart: '07:00',
                    coreTimeEnd: '22:00',
                    anotherHourAllocation: 360,
                }
            };
            const modeWithCompression = new CoreTimeMode(config);

            const realTime = new Date('2025-01-15T12:00:00');
            const ahTime = modeWithCompression.calculateAnotherHourTime(realTime);
            const convertedBack = modeWithCompression.convertToRealTime(ahTime);

            expect(convertedBack.getHours()).toBe(realTime.getHours());
            expect(convertedBack.getMinutes()).toBe(realTime.getMinutes());
        });
    });

    describe('Debug Information', () => {
        it('should provide comprehensive debug info', () => {
            const testTime = new Date('2025-01-15T12:00:00');
            const debugInfo = mode.getDebugInfo(testTime);

            expect(debugInfo).toHaveProperty('mode', TimeDesignMode.CoreTime);
            expect(debugInfo).toHaveProperty('scaleFactor');
            expect(debugInfo).toHaveProperty('currentPhase');
            expect(debugInfo).toHaveProperty('coreTimeStart', '07:00');
            expect(debugInfo).toHaveProperty('coreTimeEnd', '22:00');
            expect(debugInfo).toHaveProperty('durations');
            expect(debugInfo.durations.coreTime).toBe(900); // 15 hours
        });
    });
}); 