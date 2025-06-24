/**
 * Time Design Mode の基底クラス
 * すべてのモードはこのクラスを継承する
 */
export class BaseMode {
    config: any;

    constructor(config: any) {
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
     * デバッグ情報を取得
     * @param {Date} currentTime
     * @returns {Object}
     */
    getDebugInfo(currentTime: Date): object {
        return {
            mode: this.constructor.name,
            config: this.config,
            scaleFactor: this.calculateScaleFactor(currentTime),
            // currentPhase: this.getCurrentPhase(currentTime),
        };
    }

    /**
     * Returns the segments for the timeline UI.
     * @returns {Array} An array of segment objects.
     */
    getTimelineSegments(): any {
        return [];
    }

    /**
     * Returns the schema for the configuration panel UI.
     * @returns {object | null}
     */
    getConfigSchema(): any {
        return null;
    }
}