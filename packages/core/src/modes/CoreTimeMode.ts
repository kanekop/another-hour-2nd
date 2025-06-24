import { BaseMode } from './BaseMode.js';
import { TimeDesignMode, DEFAULT_VALUES, CoreTimeModeParams, UserSettings } from '../types/time-modes.js';

/**
 * Core Time Mode の実装
 * 1日のうち、活動的な「コアタイム」を設定し、その期間の時間を圧縮するモード
 */
export class CoreTimeMode extends BaseMode {
    static modeId = 'core-time';
    static modeName = 'Core Time';
    static description = 'Compresses a specific "core time" (like work hours) and leaves the rest of the day at normal speed.';

    static defaultParameters = {
        coreTimeStart: '09:00',
        coreTimeEnd: '17:00',
    };

    coreTimeStartStr: string;
    coreTimeEndStr: string;
    minCoreHours: number;
    anotherHourAllocation: number | null;
    dayStartTime: number;
    coreTimeStart: number;
    coreTimeEnd: number;

    constructor(config: any) {
        super(config);
        const params = { ...CoreTimeMode.defaultParameters, ...config.parameters };
        const userSettings = config.userSettings as UserSettings;

        // デフォルト値の適用
        this.coreTimeStartStr = params.coreTimeStart;
        this.coreTimeEndStr = params.coreTimeEnd;
        this.minCoreHours = params.minCoreHours || DEFAULT_VALUES.coreTime.minCoreHours;
        this.anotherHourAllocation = params.anotherHourAllocation ?? DEFAULT_VALUES.coreTime.anotherHourAllocation;
        this.dayStartTime = this.parseTime(userSettings?.dayStartTime || DEFAULT_VALUES.user.dayStartTime);

        // 時刻文字列を分数に変換
        this.coreTimeStart = this.parseTime(this.coreTimeStartStr);
        this.coreTimeEnd = this.parseTime(this.coreTimeEndStr);
        this.validateConfig();
    }

    /**
     * 設定の検証
     */
    validateConfig() {
        super.validateConfig();

        if (this.coreTimeStart === this.coreTimeEnd) {
            throw new Error('Core Time start and end times cannot be the same.');
        }

        const coreDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;
        if (coreDuration < this.minCoreHours * 60) {
            throw new Error(`Core Time must be at least ${this.minCoreHours} hours`);
        }

        if (this.anotherHourAllocation !== null && this.anotherHourAllocation !== undefined) {
            if (this.anotherHourAllocation < 0 || this.anotherHourAllocation > 720) {
                throw new Error('AnotherHourAllocation must be between 0 and 12 hours');
            }
        } else {
            const totalAH = 1440 - coreDuration;
            if (totalAH > 720) {
                throw new Error('Total Another Hour cannot exceed 12 hours');
            }
        }
    }

    /**
     * HH:mm形式の時刻文字列を0時からの分数に変換
     * @param {string} timeStr
     * @returns {number}
     */
    parseTime(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * スケールファクターを計算
     * @param {Date} currentTime
     * @returns {number}
     */
    calculateScaleFactor(currentTime: Date): number {
        const phase = this.getCurrentPhase(currentTime);
        if (phase.name === 'Core Time') {
            const coreRealDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;
            if (coreRealDuration === 0) return 1;

            const morningAHRealDuration = (this.coreTimeStart - this.dayStartTime + 1440) % 1440;
            const eveningAHRealDuration = (this.dayStartTime - this.coreTimeEnd + 1440) % 1440;
            const totalRealAADuration = morningAHRealDuration + eveningAHRealDuration;

            const targetCoreDuration = (this.anotherHourAllocation !== null && this.anotherHourAllocation !== undefined)
                ? 1440 - this.anotherHourAllocation
                : 1440 - totalRealAADuration;

            return targetCoreDuration / coreRealDuration;
        }
        return 1.0;
    }

    /**
     * 現在のフェーズを取得
     * @param {Date} currentTime
     * @returns {{ name: 'Morning AH' | 'Core Time' | 'Evening AH', progress: number }}
     */
    getCurrentPhase(currentTime: Date): { name: 'Morning AH' | 'Core Time' | 'Evening AH', progress: number } {
        const minutesSinceMidnight = currentTime.getHours() * 60 + currentTime.getMinutes();

        // 3つのフェーズを定義 (日付をまたぐ場合を考慮)
        const inCoreTime = this.coreTimeStart <= this.coreTimeEnd
            ? (minutesSinceMidnight >= this.coreTimeStart && minutesSinceMidnight < this.coreTimeEnd)
            : (minutesSinceMidnight >= this.coreTimeStart || minutesSinceMidnight < this.coreTimeEnd);

        if (inCoreTime) {
            const coreDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;
            const elapsed = (minutesSinceMidnight - this.coreTimeStart + 1440) % 1440;
            return { name: 'Core Time', progress: elapsed / coreDuration };
        }

        // Morning AH か Evening AH かを判定
        const inMorningAH = this.dayStartTime <= this.coreTimeStart
            ? (minutesSinceMidnight >= this.dayStartTime && minutesSinceMidnight < this.coreTimeStart)
            : (minutesSinceMidnight >= this.dayStartTime || minutesSinceMidnight < this.coreTimeStart);

        if (inMorningAH) {
            const morningAHDuration = (this.coreTimeStart - this.dayStartTime + 1440) % 1440;
            const elapsed = (minutesSinceMidnight - this.dayStartTime + 1440) % 1440;
            return { name: 'Morning AH', progress: elapsed / morningAHDuration };
        } else {
            const eveningAHDuration = (this.dayStartTime - this.coreTimeEnd + 1440) % 1440;
            const elapsed = (minutesSinceMidnight - this.coreTimeEnd + 1440) % 1440;
            return { name: 'Evening AH', progress: elapsed / eveningAHDuration };
        }
    }

    /**
     * Another Hour時間を計算
     * @param {Date} realTime
     * @returns {Date}
     */
    calculateAnotherHourTime(realTime: Date): Date {
        const minutesSinceMidnight = realTime.getHours() * 60 + realTime.getMinutes() + realTime.getSeconds() / 60;

        const morningAHRealDuration = (this.coreTimeStart - this.dayStartTime + 1440) % 1440;
        const scaleFactor = this.calculateScaleFactor(realTime);
        const coreRealDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;
        const coreAHDuration = coreRealDuration * scaleFactor;

        let ahMinutes;
        const phase = this.getCurrentPhase(realTime);

        if (phase.name === 'Morning AH') {
            const elapsed = (minutesSinceMidnight - this.dayStartTime + 1440) % 1440;
            ahMinutes = elapsed;
        } else if (phase.name === 'Core Time') {
            const elapsedInCore = (minutesSinceMidnight - this.coreTimeStart + 1440) % 1440;
            ahMinutes = morningAHRealDuration + (elapsedInCore * scaleFactor);
        } else { // Evening AH
            const elapsedInEvening = (minutesSinceMidnight - this.coreTimeEnd + 1440) % 1440;
            ahMinutes = morningAHRealDuration + coreAHDuration + elapsedInEvening;
        }

        const totalAHMinutes = ahMinutes;
        const ahTime = new Date(realTime);

        ahTime.setHours(Math.floor(totalAHMinutes / 60) % 24);
        ahTime.setMinutes(Math.floor(totalAHMinutes % 60));
        ahTime.setSeconds(Math.floor((totalAHMinutes * 60) % 60));

        return ahTime;
    }

    /**
     * 実時間への変換（逆変換）
     * @param {Date} anotherHourTime
     * @returns {Date}
     */
    convertToRealTime(anotherHourTime: Date): Date {
        const ahMinutes = anotherHourTime.getHours() * 60 + anotherHourTime.getMinutes() + anotherHourTime.getSeconds() / 60;

        const morningAHRealDuration = (this.coreTimeStart - this.dayStartTime + 1440) % 1440;

        // A fake date to get the correct scale factor for the Core Time phase.
        const fakeCoreTimeDate = new Date(anotherHourTime);
        fakeCoreTimeDate.setHours(Math.floor(this.coreTimeStart / 60), this.coreTimeStart % 60, 0, 0);
        const scaleFactor = this.calculateScaleFactor(fakeCoreTimeDate);

        if (scaleFactor === 0) {
            return anotherHourTime; // Avoid division by zero
        }

        const coreRealDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;
        const coreAHDuration = coreRealDuration * scaleFactor;

        let realMinutes;
        const ahDayStart = this.parseTime(this.config.userSettings?.dayStartTime || DEFAULT_VALUES.user.dayStartTime);

        // Adjust ahMinutes to be relative to the AH day start
        const ahMinutesSinceDayStart = (ahMinutes - ahDayStart + 1440) % 1440;


        if (ahMinutesSinceDayStart < morningAHRealDuration) { // Morning AH
            realMinutes = (this.dayStartTime + ahMinutesSinceDayStart) % 1440;
        } else if (ahMinutesSinceDayStart < morningAHRealDuration + coreAHDuration) { // Core Time
            const ahMinutesInCore = ahMinutesSinceDayStart - morningAHRealDuration;
            const realMinutesInCore = ahMinutesInCore / scaleFactor;
            realMinutes = (this.coreTimeStart + realMinutesInCore) % 1440;
        } else { // Evening AH
            const ahMinutesInEvening = ahMinutesSinceDayStart - morningAHRealDuration - coreAHDuration;
            realMinutes = (this.coreTimeEnd + ahMinutesInEvening) % 1440;
        }

        const realTime = new Date(anotherHourTime);
        realTime.setHours(Math.floor(realMinutes / 60), Math.floor(realMinutes % 60), Math.floor((realMinutes * 60) % 60));

        return realTime;
    }


    /**
     * デバッグ情報を取得
     * @param {Date} currentTime
     * @returns {Object}
     */
    getDebugInfo(currentTime: Date): Record<string, any> {
        const base = super.getDebugInfo(currentTime);
        const morningAHRealDuration = (this.coreTimeStart - this.dayStartTime + 1440) % 1440;
        const eveningAHRealDuration = (this.dayStartTime - this.coreTimeEnd + 1440) % 1440;
        const coreRealDuration = (this.coreTimeEnd - this.coreTimeStart + 1440) % 1440;

        const scaleFactor = this.calculateScaleFactor(currentTime);
        const coreAHDuration = coreRealDuration * scaleFactor;

        return {
            ...base,
            coreTimeStart: this.coreTimeStartStr,
            coreTimeEnd: this.coreTimeEndStr,
            dayStartTime: `${Math.floor(this.dayStartTime / 60)}:${String(this.dayStartTime % 60).padStart(2, '0')}`,
            durations: {
                morningAH: morningAHRealDuration,
                coreTime: coreRealDuration,
                eveningAH: eveningAHRealDuration
            },
            ahDurations: {
                morningAH: morningAHRealDuration,
                coreTime: coreAHDuration,
                eveningAH: eveningAHRealDuration
            },
            scaleFactor: scaleFactor,
            currentPhase: this.getCurrentPhase(currentTime)
        };
    }

    getTimelineSegments() {
        const toPercent = (minutes: number) => (minutes / 1440) * 100;

        const startPercent = toPercent(this.coreTimeStart);
        const endPercent = toPercent(this.coreTimeEnd);

        // Segments are: Evening AH, Morning AH, Core Time
        if (startPercent < endPercent) {
            // Core time does not cross midnight
            return [
                { name: 'Another Hour', start: 0, end: startPercent, color: '#85C1E9', label: 'Another Hour' },
                { name: 'Core Time', start: startPercent, end: endPercent, color: '#2874A6', label: 'Core Time' },
                { name: 'Another Hour', start: endPercent, end: 100, color: '#85C1E9', label: 'Another Hour' },
            ];
        } else {
            // Core time crosses midnight
            return [
                { name: 'Core Time', start: 0, end: endPercent, color: '#2874A6', label: 'Core Time' },
                { name: 'Another Hour', start: endPercent, end: startPercent, color: '#85C1E9', label: 'Another Hour' },
                { name: 'Core Time', start: startPercent, end: 100, color: '#2874A6', label: 'Core Time' },
            ];
        }
    }

    static getConfigSchema() {
        return {
            coreTimeStart: {
                type: 'time',
                label: 'Core Time Start',
                default: CoreTimeMode.defaultParameters.coreTimeStart,
            },
            coreTimeEnd: {
                type: 'time',
                label: 'Core Time End',
                default: CoreTimeMode.defaultParameters.coreTimeEnd,
            }
        };
    }

    exportConfig() {
        return {
            ...super.exportConfig(),
            parameters: {
                coreTimeStart: this.formatTime(this.coreTimeStart),
                coreTimeEnd: this.formatTime(this.coreTimeEnd)
            }
        };
    }

    private formatTime(minutes: number): string {
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    }
} 