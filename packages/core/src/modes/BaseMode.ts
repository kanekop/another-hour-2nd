import { TimeDesignModeConfig, ModeParameters } from '../types/time-modes.js';

/**
 * Time Design Mode の基底クラス
 * すべてのモードはこのクラスを継承する
 */
export class BaseMode {
    config: TimeDesignModeConfig;

    constructor(config: TimeDesignModeConfig) {
        if (this.constructor === BaseMode) {
            throw new Error('BaseMode is an abstract class and cannot be instantiated directly');
        }

        this.config = config;
        this.validateConfig();
    }

    /**
     * 設定の妥当性検証（サブクラスでオーバーライド）
     */
    validateConfig() {
        if (!this.config || !this.config.parameters) {
            throw new Error('Invalid configuration: parameters are required');
        }
    }

    /**
     * 現在時刻に対するスケールファクターを計算
     * @param {Date} currentTime - 現在時刻
     * @returns {number} スケールファクター（1.0 = 通常速度）
     */
    calculateScaleFactor(currentTime: Date): number {
        throw new Error('calculateScaleFactor must be implemented by subclass');
    }

    /**
     * 現在のフェーズ（期間）を取得
     * @param {Date} currentTime - 現在時刻
     * @returns {Object} { name: string, progress: number }
     */
    getCurrentPhase(currentTime: Date): { name: string, progress: number } {
        throw new Error('getCurrentPhase must be implemented by subclass');
    }

    /**
     * Another Hour 時間を計算
     * @param {Date} realTime - 実時間
     * @returns {Date} Another Hour 時間
     */
    calculateAnotherHourTime(realTime: Date): Date {
        throw new Error('calculateAnotherHourTime must be implemented by subclass');
    }

    /**
     * 実時間から Another Hour 時間への変換
     * @param {Date} realTime - 実時間
     * @returns {Date} Another Hour 時間
     */
    convertToAnotherHour(realTime: Date): Date {
        return this.calculateAnotherHourTime(realTime);
    }

    /**
     * Another Hour 時間から実時間への変換
     * @param {Date} anotherHourTime - Another Hour 時間
     * @returns {Date} 実時間
     */
    convertToRealTime(anotherHourTime: Date): Date {
        throw new Error('convertToRealTime must be implemented by subclass');
    }

    /**
     * 時計の角度を計算（アナログ時計用）
     * @param {Date} currentTime - 現在時刻
     * @returns {Object} { hours: number, minutes: number, seconds: number }
     */
    getClockAngles(currentTime: Date): { hours: number, minutes: number, seconds: number } {
        const ahTime = this.calculateAnotherHourTime(currentTime);

        const hours = ahTime.getHours();
        const minutes = ahTime.getMinutes();
        const seconds = ahTime.getSeconds();
        const milliseconds = ahTime.getMilliseconds();

        // 角度計算（12時間表示）
        const hourAngle = ((hours % 12) + minutes / 60 + seconds / 3600) * 30;
        const minuteAngle = (minutes + seconds / 60 + milliseconds / 60000) * 6;
        const secondAngle = (seconds + milliseconds / 1000) * 6;

        return {
            hours: hourAngle,
            minutes: minuteAngle,
            seconds: secondAngle
        };
    }

    /**
     * モードの説明を取得
     * @returns {string}
     */
    getDescription() {
        return this.config.description || 'No description available';
    }

    /**
     * 設定をエクスポート
     * @returns {Object}
     */
    exportConfig() {
        return {
            mode: this.config.mode,
            parameters: { ...this.config.parameters },
            name: this.config.name,
            description: this.config.description
        };
    }

    /**
     * タイムライン用のセグメント情報を取得
     * @returns {Array} セグメント配列
     */
    getSegments(): Array<{
        type: string;
        label: string;
        shortLabel: string;
        startMinutes: number;
        durationMinutes: number;
        scaleFactor?: number;
        style?: Record<string, string>;
    }> {
        throw new Error('getSegments must be implemented by subclass');
    }

    /**
     * UI設定フォーム用のデータを取得
     * @returns {Object} UI設定データ
     */
    getConfigUI(): Record<string, unknown> {
        throw new Error('getConfigUI must be implemented by subclass');
    }

    /**
     * UI設定フォームからデータを収集
     * @returns {Object} 設定データ
     */
    collectConfigFromUI(): Record<string, unknown> {
        throw new Error('collectConfigFromUI must be implemented by subclass');
    }

    /**
     * デバッグ情報を取得
     * @param {Date} currentTime
     * @returns {Object}
     */
    getDebugInfo(currentTime: Date): Record<string, unknown> {
        return {
            mode: this.config.mode,
            scaleFactor: this.calculateScaleFactor(currentTime),
            phase: this.getCurrentPhase(currentTime),
            ahTime: this.calculateAnotherHourTime(currentTime),
            config: this.exportConfig()
        };
    }
}