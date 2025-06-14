/**
 * 深い読み取り専用型
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深い部分型
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 時間範囲
 */
export interface TimeRange {
    start: Date;
    end: Date;
    timezone?: string;
}

/**
 * 期間
 */
export interface Duration {
    hours: number;
    minutes: number;
    seconds?: number;
    milliseconds?: number;
}

/**
 * 期間を時間に変換
 */
export type DurationInHours = (duration: Duration) => number;

/**
 * 時間フォーマットオプション
 */
export interface TimeFormatOptions {
    use24Hour?: boolean;
    showSeconds?: boolean;
    showTimezone?: boolean;
}

/**
 * Another Hour 時間の比較結果
 */
export type TimeComparison = 'before' | 'same' | 'after'; 