import { BaseMode } from './BaseMode.js';
import { TimeDesignMode, DEFAULT_VALUES, CoreTimeModeParams, UserSettings } from '../types/time-modes.js';

/**
 * Core Time Mode の実装
 * 1日のうち、活動的な「コアタイム」を設定し、その期間の時間を圧縮するモード
 */
export class CoreTimeMode extends BaseMode {
    coreTimeStartStr: string;
    coreTimeEndStr: string;
    minCoreHours: number;
    anotherHourAllocation: number | null;
    dayStartTime: number;
    coreTimeStart: number;
    coreTimeEnd: number;

    constructor(config: any) {
        super(config);
        const params = config.parameters as CoreTimeModeParams;
        const userSettings = config.userSettings as UserSettings;

        // デフォルト値の適用
        this.coreTimeStartStr = params?.coreTimeStart || DEFAULT_VALUES.coreTime.coreTimeStart;
        this.coreTimeEndStr = params?.coreTimeEnd || DEFAULT_VALUES.coreTime.coreTimeEnd;
        this.minCoreHours = params?.minCoreHours || DEFAULT_VALUES.coreTime.minCoreHours;
        this.anotherHourAllocation = params?.anotherHourAllocation ?? DEFAULT_VALUES.coreTime.anotherHourAllocation;
        this.dayStartTime = this.parseTime(userSettings?.dayStartTime || DEFAULT_VALUES.user.dayStartTime);

        // 時刻文字列を分数に変換
        this.coreTimeStart = this.parseTime(this.coreTimeStartStr);
        this.coreTimeEnd = this.parseTime(this.coreTimeEndStr);
    }

    /**
     * 設定の検証
     */
    validateConfig() {
        super.validateConfig();

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
     * 現在時刻を深夜0時からの分数に変換
     */
    private getMinutesSinceMidnight(date: Date): number {
        return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
    }

    /**
     * スケールファクターを計算
     * @param {Date} currentTime
     * @returns {number}
     */
    calculateScaleFactor(currentTime: Date): number {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        const start = this.coreTimeStart;
        const end = this.coreTimeEnd;

        const coreDuration = (end - start + 1440) % 1440;
        const morningAHRealDuration = (start - 0 + 1440) % 1440;
        const eveningAHRealDuration = (0 - end + 1440) % 1440;
        const totalRealAADuration = morningAHRealDuration + eveningAHRealDuration;
        const targetCoreDuration = 1440 - totalRealAADuration;
        const scaleFactorCore = coreDuration === 0 ? 1 : targetCoreDuration / coreDuration;

        const inCore = start <= end
            ? minutes >= start && minutes < end
            : minutes >= start || minutes < end;

        if (inCore) {
            return scaleFactorCore;
        } else {
            return 1; // Another Hour periods
        }
    }

    /**
     * 現在のフェーズ（期間）を取得
     * @param {Date} currentTime - 現在時刻
     * @returns {Object} { name: string, progress: number }
     */
    getCurrentPhase(currentTime: Date): { name: string, progress: number } {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        const start = this.coreTimeStart;
        const end = this.coreTimeEnd;

        const coreDuration = (end - start + 1440) % 1440;
        const morningAHRealDuration = (start - 0 + 1440) % 1440;
        const eveningAHRealDuration = (0 - end + 1440) % 1440;

        const inCore = start <= end
            ? minutes >= start && minutes < end
            : minutes >= start || minutes < end;

        if (inCore) {
            const elapsed = (minutes - start + 1440) % 1440;
            const progress = coreDuration > 0 ? elapsed / coreDuration : 0;
            return {
                name: 'Core Time',
                progress
            };
        } else {
            const inMorning = minutes < start && start <= end || (start > end && minutes >= end && minutes < start);
            if (inMorning) {
                const elapsed = (minutes - 0 + 1440) % 1440;
                const progress = morningAHRealDuration > 0 ? elapsed / morningAHRealDuration : 0;
                return {
                    name: 'Morning AH',
                    progress
                };
            } else {
                const elapsed = (minutes - end + 1440) % 1440;
                const progress = eveningAHRealDuration > 0 ? elapsed / eveningAHRealDuration : 0;
                return {
                    name: 'Evening AH',
                    progress
                };
            }
        }
    }

    /**
     * Another Hour 時間を計算
     * @param {Date} realTime - 実時間
     * @returns {Date} Another Hour 時間
     */
    calculateAnotherHourTime(realTime: Date): Date {
        const result = this.calculate(realTime);
        const ahTime = new Date(realTime);
        ahTime.setHours(result.hours, result.minutes, result.seconds, 0);
        return ahTime;
    }

    /**
     * Another Hour 時間から実時間への変換
     * @param {Date} anotherHourTime - Another Hour 時間
     * @returns {Date} 実時間
     */
    convertToRealTime(anotherHourTime: Date): Date {
        // この変換は複雑なので簡易実装
        // 完全な実装には逆算ロジックが必要
        return anotherHourTime;
    }

    /**
     * CoreTimeMode用の計算ロジック（JavaScript版互換）
     */
    calculate(date: Date, timezone?: string): any {
        const minutes = this.getMinutesSinceMidnight(date);
        const start = this.coreTimeStart;
        const end = this.coreTimeEnd;

        const coreDuration = (end - start + 1440) % 1440;
        const morningAHRealDuration = (start - 0 + 1440) % 1440;
        const eveningAHRealDuration = (0 - end + 1440) % 1440;
        const totalRealAADuration = morningAHRealDuration + eveningAHRealDuration;
        const targetCoreDuration = 1440 - totalRealAADuration;
        const scaleFactorCore = coreDuration === 0 ? 1 : targetCoreDuration / coreDuration;

        let periodName: string, isAnotherHour: boolean, progress: number, remaining: number, scaleFactor: number, ahMinutes: number;

        const inCore = start <= end
            ? minutes >= start && minutes < end
            : minutes >= start || minutes < end;

        if (inCore) {
            periodName = 'Core Time';
            isAnotherHour = false;
            const elapsed = (minutes - start + 1440) % 1440;
            progress = coreDuration > 0 ? elapsed / coreDuration : 0;
            remaining = coreDuration - elapsed;
            scaleFactor = scaleFactorCore;
            ahMinutes = morningAHRealDuration + elapsed * scaleFactorCore;
        } else {
            const inMorning = minutes < start && start <= end || (start > end && minutes >= end && minutes < start);
            if (inMorning) {
                periodName = 'Morning AH';
                isAnotherHour = true;
                const elapsed = (minutes - 0 + 1440) % 1440;
                progress = morningAHRealDuration > 0 ? elapsed / morningAHRealDuration : 0;
                remaining = morningAHRealDuration - elapsed;
                scaleFactor = 1;
                ahMinutes = elapsed;
            } else {
                periodName = 'Evening AH';
                isAnotherHour = true;
                const elapsed = (minutes - end + 1440) % 1440;
                progress = eveningAHRealDuration > 0 ? elapsed / eveningAHRealDuration : 0;
                remaining = eveningAHRealDuration - elapsed;
                scaleFactor = 1;
                ahMinutes = morningAHRealDuration + coreDuration * scaleFactorCore + elapsed;
            }
        }

        const hours = Math.floor(ahMinutes / 60) % 24;
        const minutesOut = Math.floor(ahMinutes % 60);
        const seconds = Math.floor((ahMinutes * 60) % 60);

        const duration = isAnotherHour ? (periodName === 'Morning AH' ? morningAHRealDuration : eveningAHRealDuration) : coreDuration;

        return {
            hours,
            minutes: minutesOut,
            seconds,
            scaleFactor,
            isAnotherHour,
            segmentInfo: {
                type: isAnotherHour ? 'another' : 'designed',
                label: periodName,
                progress,
                remaining,
                duration,
            },
            periodName,
        };
    }

    /**
     * タイムライン用のセグメント情報を取得
     */
    getSegments() {
        const coreStart = this.coreTimeStart;
        const coreEnd = this.coreTimeEnd;
        const coreDuration = coreEnd - coreStart;

        if (coreDuration <= 0) return [];

        const coreScaleFactor = (24 * 60) / coreDuration;

        const segments = [
            {
                type: 'another',
                label: 'Morning AH',
                shortLabel: 'AM',
                startMinutes: 0,
                durationMinutes: coreStart,
                scaleFactor: 1.0
            },
            {
                type: 'designed',
                label: 'Core Time',
                shortLabel: 'Core',
                startMinutes: coreStart,
                durationMinutes: coreDuration,
                scaleFactor: coreScaleFactor
            },
            {
                type: 'another',
                label: 'Evening AH',
                shortLabel: 'PM',
                startMinutes: coreEnd,
                durationMinutes: 1440 - coreEnd,
                scaleFactor: 1.0
            }
        ];

        return segments.filter(s => s.durationMinutes > 0);
    }

    /**
     * UI設定フォーム用のデータを取得
     */
    getConfigUI() {
        return {
            coreTimeStart: this.coreTimeStartStr,
            coreTimeEnd: this.coreTimeEndStr,
            minCoreHours: this.minCoreHours,
            anotherHourAllocation: this.anotherHourAllocation,
            summary: {
                coreDuration: this.coreTimeEnd - this.coreTimeStart,
                morningAH: this.coreTimeStart,
                eveningAH: 1440 - this.coreTimeEnd
            }
        };
    }

    /**
     * UI設定フォームからデータを収集
     */
    collectConfigFromUI() {
        return {
            coreTimeStart: this.coreTimeStartStr,
            coreTimeEnd: this.coreTimeEndStr,
            minCoreHours: this.minCoreHours,
            anotherHourAllocation: this.anotherHourAllocation
        };
    }
} 