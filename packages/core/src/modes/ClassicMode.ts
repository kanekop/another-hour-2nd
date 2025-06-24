import { BaseMode } from './BaseMode.js';
import { TimeDesignMode, DEFAULT_VALUES } from '../types/time-modes.js';

/**
 * Classic Mode の実装
 * 従来のDesigned 24 + Another Hour方式
 */
export class ClassicMode extends BaseMode {
    static modeId = 'classic';
    static modeName = 'Classic';
    static description = 'A standard day divided into a scaled period and a real-time "another hour".';

    static defaultParameters = {
        designed24Hours: 22, // Default duration in hours
    };

    private designed24Duration: number; // Stored in minutes
    private dayStartTime: number;

    constructor(config: any) {
        super(config);
        const params = { ...ClassicMode.defaultParameters, ...config.parameters };
        this.designed24Duration = params.designed24Hours * 60; // Convert hours to minutes
        this.dayStartTime = this.parseDayStartTime(config.userSettings?.dayStartTime || DEFAULT_VALUES.user.dayStartTime);
        this.validateConfig();
    }

    /**
     * 設定の検証
     */
    validateConfig() {
        super.validateConfig();

        if (this.designed24Duration < 0 || this.designed24Duration > 1440) {
            throw new Error('Designed 24 duration must be between 0 and 24 hours');
        }
    }

    /**
     * 一日の開始時刻をパース
     * @param {string} timeStr - HH:mm形式
     * @returns {number} 0時からの分数
     */
    parseDayStartTime(timeStr: string): number {
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

        if (phase.name === 'Designed 24') {
            // Designed 24期間中のスケールファクター
            const designed24Hours = this.designed24Duration / 60;
            return 24 / designed24Hours;
        } else {
            // Another Hour期間は通常速度
            return 1.0;
        }
    }

    /**
     * 現在のフェーズを取得
     * @param {Date} currentTime
     * @returns {Object} { name: string, progress: number }
     */
    getCurrentPhase(currentTime: Date): { name: string, progress: number, remainingMinutes: number } {
        const minutesSinceDayStart = this.getMinutesSinceDayStart(currentTime);

        if (minutesSinceDayStart < this.designed24Duration) {
            // Designed 24期間
            const progress = minutesSinceDayStart / this.designed24Duration;
            return {
                name: 'Designed 24',
                progress: progress,
                remainingMinutes: this.designed24Duration - minutesSinceDayStart
            };
        } else {
            // Another Hour期間
            const ahStartMinutes = this.designed24Duration;
            const ahMinutes = minutesSinceDayStart - ahStartMinutes;
            const ahDuration = 1440 - this.designed24Duration;
            const progress = ahMinutes / ahDuration;

            return {
                name: 'Another Hour',
                progress: progress,
                remainingMinutes: ahDuration - ahMinutes
            };
        }
    }

    /**
     * 一日の開始からの経過分数を取得
     * @param {Date} currentTime
     * @returns {number}
     */
    getMinutesSinceDayStart(currentTime: Date): number {
        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        // dayStartTimeを考慮
        let minutesSinceDayStart = currentMinutes - this.dayStartTime;
        if (minutesSinceDayStart < 0) {
            minutesSinceDayStart += 1440; // 次の日にまたがる場合
        }

        return minutesSinceDayStart;
    }

    /**
     * Another Hour時間を計算
     * @param {Date} realTime
     * @returns {Date}
     */
    calculateAnotherHourTime(realTime: Date): Date {
        const minutesSinceDayStart = this.getMinutesSinceDayStart(realTime);
        let ahMinutes;

        if (minutesSinceDayStart < this.designed24Duration) {
            // Designed 24期間：スケーリング適用
            const scaleFactor = this.calculateScaleFactor(realTime);
            ahMinutes = minutesSinceDayStart * scaleFactor;
        } else {
            // Another Hour期間：通常速度
            const designed24InAH = this.designed24Duration * (24 / (this.designed24Duration / 60));
            const ahPeriodMinutes = minutesSinceDayStart - this.designed24Duration;
            ahMinutes = designed24InAH + ahPeriodMinutes;
        }

        // Another Hour時間を計算
        const ahTime = new Date(realTime);
        const totalAHMinutes = this.dayStartTime + ahMinutes;

        ahTime.setHours(Math.floor(totalAHMinutes / 60) % 24);
        ahTime.setMinutes(Math.floor(totalAHMinutes % 60));
        ahTime.setSeconds(Math.floor((totalAHMinutes % 1) * 60));

        return ahTime;
    }

    /**
     * 実時間への変換（逆変換）
     * @param {Date} anotherHourTime
     * @returns {Date}
     */
    convertToRealTime(anotherHourTime: Date): Date {
        const ahMinutes = anotherHourTime.getHours() * 60 + anotherHourTime.getMinutes();
        const minutesSinceDayStart = ahMinutes - this.dayStartTime;

        let realMinutes;
        const designed24InAH = 24 * 60; // Another Hour での24時間

        if (minutesSinceDayStart < designed24InAH) {
            // Designed 24期間
            const scaleFactor = 24 / (this.designed24Duration / 60);
            realMinutes = minutesSinceDayStart / scaleFactor;
        } else {
            // Another Hour期間
            const ahPeriodMinutes = minutesSinceDayStart - designed24InAH;
            realMinutes = this.designed24Duration + ahPeriodMinutes;
        }

        const realTime = new Date(anotherHourTime);
        const totalRealMinutes = this.dayStartTime + realMinutes;

        realTime.setHours(Math.floor(totalRealMinutes / 60) % 24);
        realTime.setMinutes(Math.floor(totalRealMinutes % 60));

        return realTime;
    }

    /**
     * デバッグ情報を取得
     * @param {Date} currentTime
     * @returns {Object}
     */
    getDebugInfo(currentTime: Date): object {
        const base = super.getDebugInfo(currentTime);

        return {
            ...base,
            designed24Duration: this.designed24Duration,
            dayStartTime: `${Math.floor(this.dayStartTime / 60)}:${String(this.dayStartTime % 60).padStart(2, '0')}`,
            designed24Hours: this.designed24Duration / 60,
            anotherHourDuration: 1440 - this.designed24Duration,
            currentPhase: this.getCurrentPhase(currentTime)
        };
    }

    getTimelineSegments() {
        const designed24End = (this.designed24Duration / 1440) * 100;
        return [
            { name: 'Designed 24', start: 0, end: designed24End, color: '#3498DB', label: 'Designed 24' },
            { name: 'Another Hour', start: designed24End, end: 100, color: '#95A5A6', label: 'Another Hour' }
        ];
    }

    static getConfigSchema() {
        return {
            designed24Hours: {
                type: 'slider',
                label: 'Designed 24 Duration',
                min: 1,
                max: 23.5,
                step: 0.5,
                default: this.defaultParameters.designed24Hours,
                unit: 'h'
            }
        };
    }

    exportConfig() {
        return {
            ...super.exportConfig(),
            parameters: {
                designed24Hours: this.designed24Duration / 60
            }
        };
    }
}