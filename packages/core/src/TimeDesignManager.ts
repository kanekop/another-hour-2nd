import { BaseMode } from './modes/BaseMode.js';
import { TimeDesignMode, UserSettings, DEFAULT_VALUES } from './types/time-modes.js';

/**
 * Time Design Modes の中央管理クラス
 * シングルトンパターンで実装
 */
export class TimeDesignManager {
    private static instance: TimeDesignManager;
    private modes: Map<string, typeof BaseMode> = new Map();
    private currentMode: BaseMode | null = null;
    private listeners: Map<string, Set<Function>> = new Map();
    private userSettings!: UserSettings;

    constructor() {
        if (TimeDesignManager.instance) {
            return TimeDesignManager.instance;
        }

        this.modes = new Map();
        this.currentMode = null;
        this.listeners = new Map();
        this.userSettings = this.loadUserSettings();

        TimeDesignManager.instance = this;
    }

    /**
     * シングルトンインスタンスを取得
     * @returns {TimeDesignManager}
     */
    static getInstance() {
        if (!TimeDesignManager.instance) {
            TimeDesignManager.instance = new TimeDesignManager();
        }
        return TimeDesignManager.instance;
    }

    /**
     * モードを登録
     * @param {string} modeName - モード名
     * @param {typeof BaseMode} ModeClass - モードクラス
     */
    registerMode(modeName: string, ModeClass: typeof BaseMode): void {
        if (!(ModeClass.prototype instanceof BaseMode)) {
            throw new Error('Mode class must extend BaseMode');
        }

        this.modes.set(modeName, ModeClass);
        console.log(`Registered mode: ${modeName}`);
    }

    /**
     * 利用可能なモードのリストを取得
     * @returns {string[]}
     */
    getAvailableModes() {
        return Array.from(this.modes.keys());
    }

    /**
     * 現在のモードを設定
     * @param {string} modeName - モード名
     * @param {Object} config - モード設定
     */
    setMode(modeName: string, config: any = {}): void {
        const ModeClass = this.modes.get(modeName);

        if (!ModeClass) {
            throw new Error(`Mode '${modeName}' is not registered`);
        }

        // 以前のモードをクリーンアップ
        if (this.currentMode) {
            this.notifyListeners('mode-will-change', {
                oldMode: this.currentMode.config.mode,
                newMode: modeName
            });
        }

        // 新しいモードを作成（ユーザー設定を含める）
        const modeConfig = {
            mode: modeName,
            userSettings: this.userSettings,
            ...config
        };

        this.currentMode = new ModeClass(modeConfig);

        // ユーザーの優先モードを更新
        this.userSettings.preferredMode = modeName as any;
        this.saveUserSettings();

        // 設定を保存
        this.saveConfiguration();

        // リスナーに通知
        this.notifyListeners('mode-changed', {
            mode: modeName,
            config: this.currentMode.exportConfig()
        });

        console.log(`Mode changed to: ${modeName}`);
    }

    /**
     * 現在のモードを取得
     * @returns {BaseMode|null}
     */
    getCurrentMode(): BaseMode | null {
        return this.currentMode;
    }

    /**
     * 現在時刻のAnother Hour時間を計算
     * @param {Date} realTime - 実時間
     * @returns {Date}
     */
    calculateAnotherHourTime(realTime: Date = new Date()): Date {
        if (!this.currentMode) {
            throw new Error('No mode is currently set');
        }

        return this.currentMode.calculateAnotherHourTime(realTime);
    }

    /**
     * 現在のスケールファクターを取得
     * @param {Date} currentTime
     * @returns {number}
     */
    getScaleFactor(currentTime: Date = new Date()): number {
        if (!this.currentMode) {
            return 1.0;
        }

        return this.currentMode.calculateScaleFactor(currentTime);
    }

    /**
     * 現在のフェーズを取得
     * @param {Date} currentTime
     * @returns {Object}
     */
    getCurrentPhase(currentTime: Date = new Date()): any {
        if (!this.currentMode) {
            return { name: 'No Mode', progress: 0 };
        }

        return this.currentMode.getCurrentPhase(currentTime);
    }

    /**
     * 時計の角度を取得
     * @param {Date} currentTime
     * @returns {Object}
     */
    getClockAngles(currentTime: Date = new Date()): any {
        if (!this.currentMode) {
            // デフォルトは通常の時計
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const seconds = currentTime.getSeconds();

            return {
                hours: ((hours % 12) + minutes / 60) * 30,
                minutes: (minutes + seconds / 60) * 6,
                seconds: seconds * 6
            };
        }

        return this.currentMode.getClockAngles(currentTime);
    }

    /**
     * イベントリスナーを追加
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    addEventListener(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)?.add(callback);
    }

    /**
     * イベントリスナーを削除
     * @param {string} event
     * @param {Function} callback
     */
    removeEventListener(event: string, callback: Function): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.delete(callback);
        }
    }

    /**
     * リスナーに通知
     * @param {string} event
     * @param {Object} data
     */
    notifyListeners(event: string, data: any): void {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for '${event}':`, error);
                }
            });
        }
    }

    /**
     * ユーザー設定を保存
     */
    saveUserSettings(): void {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('another-hour-user-settings', JSON.stringify(this.userSettings));
        }
    }

    /**
     * ユーザー設定を読み込み
     * @returns {UserSettings}
     */
    loadUserSettings(): UserSettings {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('another-hour-user-settings');

            if (saved) {
                try {
                    return { ...DEFAULT_VALUES.user, ...JSON.parse(saved) };
                } catch (error) {
                    console.error('Failed to load user settings:', error);
                }
            }
        }

        return { ...DEFAULT_VALUES.user };
    }

    /**
     * ユーザー設定を更新
     * @param {Partial<UserSettings>} updates
     */
    updateUserSettings(updates: Partial<UserSettings>): void {
        this.userSettings = { ...this.userSettings, ...updates };
        this.saveUserSettings();

        // 現在のモードを再作成して設定を反映
        if (this.currentMode) {
            const currentConfig = this.currentMode.exportConfig();
            this.setMode(currentConfig.mode, currentConfig);
        }
    }

    /**
     * 設定を保存
     */
    saveConfiguration(): void {
        if (!this.currentMode) return;

        const config = this.currentMode.exportConfig();
        const modeKey = `another-hour-mode-${config.mode}`;
        
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(modeKey, JSON.stringify(config));
            // 最後に使用したモードも保存
            localStorage.setItem('another-hour-last-mode', config.mode);
        }
    }

    /**
     * 設定を読み込み
     * @param {string} modeName
     * @returns {Object|null}
     */
    loadConfiguration(modeName: string): any | null {
        if (typeof localStorage !== 'undefined') {
            const modeKey = `another-hour-mode-${modeName}`;
            const saved = localStorage.getItem(modeKey);

            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (error) {
                    console.error(`Failed to load configuration for ${modeName}:`, error);
                }
            }
        }

        return null;
    }

    /**
     * 初期化
     */
    async initialize(): Promise<void> {
        // 最後に使用したモードまたは優先モードを読み込み
        const lastMode = (typeof localStorage !== 'undefined' ? localStorage.getItem('another-hour-last-mode') : null) || this.userSettings.preferredMode;
        const savedConfig = this.loadConfiguration(lastMode);

        if (savedConfig && this.modes.has(savedConfig.mode)) {
            try {
                this.setMode(savedConfig.mode, savedConfig);
            } catch (error) {
                console.error('Failed to restore saved mode:', error);
                this.setDefaultMode();
            }
        } else {
            this.setDefaultMode();
        }
    }

    /**
     * デフォルトモードを設定
     */
    setDefaultMode() {
        const preferredMode = this.userSettings.preferredMode;

        if (this.modes.has(preferredMode)) {
            const defaults = this.getDefaultParameters(preferredMode);
            this.setMode(preferredMode, { parameters: defaults });
        } else if (this.modes.has(TimeDesignMode.Classic)) {
            // フォールバック
            this.setMode(TimeDesignMode.Classic, {
                parameters: DEFAULT_VALUES.classic
            });
        }
    }

    /**
     * モードのデフォルトパラメータを取得
     * @param {string} modeName
     * @returns {Object}
     */
    getDefaultParameters(modeName: string): any {
        switch (modeName) {
            case TimeDesignMode.Classic:
                return DEFAULT_VALUES.classic;
            case TimeDesignMode.CoreTime:
                return DEFAULT_VALUES.coreTime;
            case TimeDesignMode.WakeBased:
                return DEFAULT_VALUES.wakeBased;
            case TimeDesignMode.Solar:
                return DEFAULT_VALUES.solar;
            default:
                return {};
        }
    }

    /**
     * デバッグ情報を取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            userSettings: this.userSettings,
            availableModes: this.getAvailableModes(),
            currentMode: this.currentMode ? this.currentMode.config.mode : 'none',
            currentModeDebug: this.currentMode ? this.currentMode.getDebugInfo(new Date()) : null,
            listeners: Array.from(this.listeners.entries()).map(([event, callbacks]) => ({
                event,
                count: callbacks.size
            }))
        };
    }
}

// エクスポート
export default TimeDesignManager;