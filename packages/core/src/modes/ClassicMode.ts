import { BaseMode } from './BaseMode.js';
import { TimeDesignMode, DEFAULT_VALUES } from '../types/time-modes.js';

/**
 * Classic Mode の実装
 * 従来のDesigned 24 + Another Hour方式
 */
export class ClassicMode extends BaseMode {
    private designed24Duration: number;
    private dayStartTime: number;

    constructor(config: any) {
        super(config);

        // デフォルト値の適用
        this.designed24Duration = config.parameters?.designed24Duration || DEFAULT_VALUES.classic.designed24Duration;
        this.dayStartTime = this.parseDayStartTime(config.userSettings?.dayStartTime || DEFAULT_VALUES.user.dayStartTime);
    }

    /**
     * 設定の検証
     */
    validateConfig() {
        super.validateConfig();

        // Designed 24 は 0〜24時間の範囲
        if (this.designed24Duration < 0 || this.designed24Duration > 1440) {
            throw new Error('Designed 24 duration must be between 0 and 24 hours');
        }
    }

    /**
     * タイムライン用のセグメント情報を取得
     */
    getSegments() {
        const designedDuration = this.designed24Duration;
        const anotherHourStart = designedDuration;
        const scaleFactor = designedDuration > 0 ? 1440 / designedDuration : 1;

        return [
            {
                type: 'designed',
                label: 'Designed 24',
                shortLabel: 'D24',
                startMinutes: 0,
                durationMinutes: anotherHourStart,
                scaleFactor: scaleFactor
            },
            {
                type: 'another',
                label: 'Another Hour',
                shortLabel: 'AH',
                startMinutes: anotherHourStart,
                durationMinutes: 1440 - anotherHourStart,
                scaleFactor: 1.0
            }
        ];
    }

    /**
     * UI設定フォーム用のデータを取得
     */
    getConfigUI() {
        return {
            designed24Duration: this.designed24Duration,
            summary: {
                designed24: {
                    hours: Math.floor(this.designed24Duration / 60),
                    minutes: this.designed24Duration % 60,
                    total: this.designed24Duration
                },
                anotherHour: {
                    hours: Math.floor((1440 - this.designed24Duration) / 60),
                    minutes: (1440 - this.designed24Duration) % 60,
                    total: 1440 - this.designed24Duration
                },
                scaleFactor: this.designed24Duration > 0 ? (1440 / this.designed24Duration).toFixed(2) : '1.00'
            }
        };
    }

    /**
     * UI設定フォームからデータを収集
     */
    collectConfigFromUI() {
        return {
            designed24Duration: this.designed24Duration
        };
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
        
        if (minutes < this.designed24Duration) {
            // Designed 24 phase
            return this.designed24Duration > 0 ? 1440 / this.designed24Duration : 1;
        } else {
            // Another Hour phase
            return 1.0;
        }
    }

    /**
     * 現在のフェーズ（期間）を取得
     * @param {Date} currentTime - 現在時刻
     * @returns {Object} { name: string, progress: number }
     */
    getCurrentPhase(currentTime: Date): { name: string, progress: number } {
        const minutes = this.getMinutesSinceMidnight(currentTime);
        const anotherDuration = 1440 - this.designed24Duration;

        if (minutes < this.designed24Duration) {
            // Designed 24 phase
            return {
                name: 'Designed 24',
                progress: minutes / this.designed24Duration
            };
        } else {
            // Another Hour phase
            const ahMinutes = minutes - this.designed24Duration;
            return {
                name: 'Another Hour',
                progress: ahMinutes / anotherDuration
            };
        }
    }

    /**
     * Another Hour 時間を計算
     * @param {Date} realTime - 実時間
     * @returns {Date} Another Hour 時間
     */
    calculateAnotherHourTime(realTime: Date): Date {
        const minutes = this.getMinutesSinceMidnight(realTime);
        const scaleFactor = this.calculateScaleFactor(realTime);
        
        let ahTotalMinutes: number;

        if (minutes < this.designed24Duration) {
            // Designed 24 phase
            const scaled = minutes * scaleFactor;
            ahTotalMinutes = scaled;
        } else {
            // Another Hour phase
            const ahMinutes = minutes - this.designed24Duration;
            ahTotalMinutes = 1440 + ahMinutes; // 24:00以降として表現
        }

        const ahHours = Math.floor(ahTotalMinutes / 60) % 24;
        const ahMinutes = Math.floor(ahTotalMinutes % 60);
        const ahSeconds = Math.floor((ahTotalMinutes * 60) % 60);

        const ahTime = new Date(realTime);
        ahTime.setHours(ahHours, ahMinutes, ahSeconds, 0);
        return ahTime;
    }

    /**
     * Another Hour 時間から実時間への変換
     * @param {Date} anotherHourTime - Another Hour 時間
     * @returns {Date} 実時間
     */
    convertToRealTime(anotherHourTime: Date): Date {
        const ahMinutes = this.getMinutesSinceMidnight(anotherHourTime);
        let realMinutes: number;

        if (ahMinutes <= 1440) {
            // Designed 24 phase内の時間
            const scaleFactor = this.designed24Duration > 0 ? this.designed24Duration / 1440 : 1;
            realMinutes = ahMinutes * scaleFactor;
        } else {
            // Another Hour phase内の時間
            realMinutes = this.designed24Duration + (ahMinutes - 1440);
        }

        const realHours = Math.floor(realMinutes / 60) % 24;
        const realMins = Math.floor(realMinutes % 60);
        const realSecs = Math.floor((realMinutes * 60) % 60);

        const realTime = new Date(anotherHourTime);
        realTime.setHours(realHours, realMins, realSecs, 0);
        return realTime;
    }

    /**
     * ClassicMode用の計算ロジック（JavaScript版互換）
     */
    calculate(date: Date, timezone?: string): any {
        const minutes = this.getMinutesSinceMidnight(date);
        const designedDuration = this.designed24Duration;
        const anotherDuration = 1440 - designedDuration;
        const scaleFactor = designedDuration > 0 ? 1440 / designedDuration : 1;

        let hours: number, minutesOut: number, seconds: number, periodName: string, isAnotherHour: boolean, progress: number, remaining: number;

        if (minutes < designedDuration) {
            // Designed 24 phase
            const scaled = minutes * scaleFactor;
            hours = Math.floor(scaled / 60) % 24;
            minutesOut = Math.floor(scaled % 60);
            seconds = Math.floor((scaled * 60) % 60);
            periodName = 'Designed 24';
            isAnotherHour = false;
            progress = minutes / designedDuration;
            remaining = designedDuration - minutes;
        } else {
            // Another Hour phase
            const ahMinutes = minutes - designedDuration;
            hours = Math.floor(ahMinutes / 60);
            minutesOut = Math.floor(ahMinutes % 60);
            seconds = Math.floor((ahMinutes * 60) % 60);
            periodName = 'Another Hour';
            isAnotherHour = true;
            progress = ahMinutes / anotherDuration;
            remaining = anotherDuration - ahMinutes;
        }

        return {
            hours,
            minutes: minutesOut,
            seconds,
            scaleFactor: minutes < designedDuration ? scaleFactor : 1.0,
            isAnotherHour,
            segmentInfo: {
                type: isAnotherHour ? 'another' : 'designed',
                label: periodName,
                progress,
                remaining,
                duration: minutes < designedDuration ? designedDuration : anotherDuration,
            },
            periodName,
        };
    }
}