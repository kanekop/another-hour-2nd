/**
 * Another Hour システム全体で使用する基底エラークラス
 */
export class AnotherHourError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'AnotherHourError';
        Object.setPrototypeOf(this, AnotherHourError.prototype);
    }
}

/**
 * 時間設定が無効な場合のエラー
 */
export class InvalidTimeConfigError extends AnotherHourError {
    constructor(message: string) {
        super(message, 'INVALID_TIME_CONFIG');
    }
}

/**
 * 時間計算エラー
 */
export class TimeCalculationError extends AnotherHourError {
    constructor(message: string) {
        super(message, 'TIME_CALCULATION_ERROR');
    }
}

/**
 * モード設定エラー
 */
export class InvalidModeError extends AnotherHourError {
    constructor(mode: string) {
        super(`Invalid time design mode: ${mode}`, 'INVALID_MODE');
    }
} 