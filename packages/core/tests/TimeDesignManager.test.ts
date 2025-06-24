import { TimeDesignManager } from '../src/TimeDesignManager';
import { ClassicMode } from '../src/modes/ClassicMode';
import { TimeDesignMode, DEFAULT_VALUES } from '../src/types/time-modes';

// LocalStorage のモック
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('TimeDesignManager', () => {
    let manager: TimeDesignManager;

    beforeEach(() => {
        // LocalStorageをクリア
        localStorageMock.clear();
        // シングルトンインスタンスをリセット
        (TimeDesignManager as any).instance = null;
        manager = TimeDesignManager.getInstance();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = TimeDesignManager.getInstance();
            const instance2 = TimeDesignManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Mode Registration', () => {
        it('should register a mode successfully', () => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            const availableModes = manager.getAvailableModes();
            expect(availableModes).toContain(TimeDesignMode.Classic);
        });

        it('should throw error for invalid mode class', () => {
            class InvalidMode {}
            expect(() => {
                manager.registerMode('invalid', InvalidMode as any);
            }).toThrow('Mode class must extend BaseMode');
        });
    });

    describe('Mode Management', () => {
        beforeEach(() => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
        });

        it('should set mode with valid configuration', () => {
            const config = {
                parameters: {
                    designed24Duration: 1380 // 23時間
                }
            };

            manager.setMode(TimeDesignMode.Classic, config);
            const currentMode = manager.getCurrentMode();

            expect(currentMode).toBeDefined();
            expect(currentMode?.config.mode).toBe(TimeDesignMode.Classic);
        });

        it('should throw error for unregistered mode', () => {
            expect(() => {
                manager.setMode('unknown-mode', {});
            }).toThrow("Mode 'unknown-mode' is not registered");
        });

        it('should update user preferred mode when setting mode', () => {
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            const userSettings = (manager as any).userSettings;
            expect(userSettings.preferredMode).toBe(TimeDesignMode.Classic);
        });
    });

    describe('Time Calculations', () => {
        beforeEach(() => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });
        });

        it('should calculate Another Hour time', () => {
            const testTime = new Date('2025-01-15T12:00:00');
            const ahTime = manager.calculateAnotherHourTime(testTime);

            expect(ahTime).toBeInstanceOf(Date);
            expect(ahTime.getTime()).not.toBe(testTime.getTime());
        });

        it('should get scale factor', () => {
            const scaleFactor = manager.getScaleFactor();
            expect(typeof scaleFactor).toBe('number');
            expect(scaleFactor).toBeGreaterThan(0);
        });

        it('should get current phase', () => {
            const phase = manager.getCurrentPhase();
            expect(phase).toHaveProperty('name');
            expect(phase).toHaveProperty('progress');
            expect(phase.progress).toBeGreaterThanOrEqual(0);
            expect(phase.progress).toBeLessThanOrEqual(1);
        });

        it('should get clock angles', () => {
            const angles = manager.getClockAngles();
            expect(angles).toHaveProperty('hours');
            expect(angles).toHaveProperty('minutes');
            expect(angles).toHaveProperty('seconds');
        });

        it('should throw error when no mode is set', () => {
            (manager as any).currentMode = null;
            expect(() => {
                manager.calculateAnotherHourTime();
            }).toThrow('No mode is currently set');
        });
    });

    describe('User Settings', () => {
        it('should load default user settings', () => {
            const settings = (manager as any).userSettings;
            expect(settings.dayStartTime).toBe(DEFAULT_VALUES.user.dayStartTime);
            expect(settings.defaultTimezone).toBe(DEFAULT_VALUES.user.defaultTimezone);
        });

        it('should update user settings', () => {
            manager.updateUserSettings({
                dayStartTime: '04:00',
                defaultTimezone: 'America/New_York'
            });

            const settings = (manager as any).userSettings;
            expect(settings.dayStartTime).toBe('04:00');
            expect(settings.defaultTimezone).toBe('America/New_York');
        });

        it('should persist user settings', () => {
            manager.updateUserSettings({
                dayStartTime: '04:00'
            });

            // 新しいインスタンスを作成
            (TimeDesignManager as any).instance = null;
            const newManager = TimeDesignManager.getInstance();
            const settings = (newManager as any).userSettings;

            expect(settings.dayStartTime).toBe('04:00');
        });
    });

    describe('Event System', () => {
        it('should add and notify event listeners', () => {
            const mockCallback = jest.fn();
            manager.addEventListener('mode-changed', mockCallback);

            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            expect(mockCallback).toHaveBeenCalled();
            expect(mockCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    mode: TimeDesignMode.Classic
                })
            );
        });

        it('should remove event listeners', () => {
            const mockCallback = jest.fn();
            manager.addEventListener('mode-changed', mockCallback);
            manager.removeEventListener('mode-changed', mockCallback);

            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should handle errors in event listeners gracefully', () => {
            const errorCallback = jest.fn(() => {
                throw new Error('Test error');
            });
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            manager.addEventListener('mode-changed', errorCallback);
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);

            expect(() => {
                manager.setMode(TimeDesignMode.Classic, {
                    parameters: { designed24Duration: 1380 }
                });
            }).not.toThrow();

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Configuration Persistence', () => {
        beforeEach(() => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
        });

        it('should save mode configuration', () => {
            const config = {
                parameters: { designed24Duration: 1200 }
            };

            manager.setMode(TimeDesignMode.Classic, config);

            const savedConfig = localStorageMock.getItem('another-hour-mode-classic');
            expect(savedConfig).toBeDefined();

            const parsed = JSON.parse(savedConfig!);
            expect(parsed.parameters.designed24Duration).toBe(1200);
        });

        it('should restore saved configuration on initialization', async () => {
            // 設定を保存
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1200 }
            });

            // 新しいインスタンスを作成
            (TimeDesignManager as any).instance = null;
            const newManager = TimeDesignManager.getInstance();
            newManager.registerMode(TimeDesignMode.Classic, ClassicMode);

            await newManager.initialize();

            const currentMode = newManager.getCurrentMode();
            expect(currentMode?.config.parameters.designed24Duration).toBe(1200);
        });
    });

    describe('Debug Information', () => {
        it('should provide comprehensive debug info', () => {
            manager.registerMode(TimeDesignMode.Classic, ClassicMode);
            manager.setMode(TimeDesignMode.Classic, {
                parameters: { designed24Duration: 1380 }
            });

            const debugInfo = manager.getDebugInfo();

            expect(debugInfo).toHaveProperty('userSettings');
            expect(debugInfo).toHaveProperty('availableModes');
            expect(debugInfo).toHaveProperty('currentMode');
            expect(debugInfo).toHaveProperty('currentModeDebug');
            expect(debugInfo).toHaveProperty('listeners');
        });
    });
});