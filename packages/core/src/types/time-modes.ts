/**
 * Another Hour の時間デザインモード
 */
export enum TimeDesignMode {
    Classic = 'classic',       // 従来のDesigned 24 + Another Hour
    CoreTime = 'core-time',    // 活動時間の前後にAH配置
    WakeBased = 'wake-based',  // 起床時刻ベース
    Solar = 'solar'            // 太陽時間ベース
}

/**
 * ユーザー設定
 */
export interface UserSettings {
    userId: string;
    defaultTimezone: string;      // 例: 'Asia/Tokyo'
    defaultLocation?: Location;   // Solar Mode用
    dayStartTime: string;         // HH:mm形式 (デフォルト: '00:00')
    preferredMode: TimeDesignMode;
}

/**
 * 位置情報
 */
export interface Location {
    city: string;
    latitude: number;
    longitude: number;
}

/**
 * モード設定の基底インターフェース
 */
export interface TimeDesignModeConfig<T = ModeParameters> {
    mode: TimeDesignMode;
    parameters: T;
    name?: string;        // ユーザー定義の名前
    description?: string; // モードの説明
}

/**
 * Classic Mode のパラメータ
 */
export interface ClassicModeParams {
    designed24Duration: number;   // 分単位 (例: 1380 = 23時間)
}

/**
 * Core Time Mode のパラメータ
 */
export interface CoreTimeModeParams {
    coreTimeStart: string;        // HH:mm形式 (例: '07:00')
    coreTimeEnd: string;          // HH:mm形式 (例: '22:00')
    minCoreHours: number;         // 最低コアタイム時間 (時間単位、デフォルト: 6)
    anotherHourAllocation?: number | null; // AHの合計時間（分）。null or undefinedの場合は自動計算
}

/**
 * Wake-Based Mode のパラメータ
 */
export interface WakeBasedModeParams {
    defaultWakeTime: string;      // HH:mm形式 (例: '07:00')
    todayWakeTime?: string;       // HH:mm形式 (今日の実際の起床時刻)
    anotherHourDuration: number;  // 分単位
    maxScaleFactor: number;       // 最大圧縮率 (例: 2.0)
}

/**
 * Solar Mode のパラメータ
 */
export interface SolarModeParams {
    location?: Location;          // ユーザーのデフォルトを上書き
    dayHoursTarget: number;       // 昼の時間（時間単位）
    seasonalAdjustment: boolean;  // 季節による調整
}

/**
 * すべてのモードパラメータのユニオン型
 */
export type ModeParameters =
    | ClassicModeParams
    | CoreTimeModeParams
    | WakeBasedModeParams
    | SolarModeParams;

/**
 * モード別の設定型
 */
export type ClassicModeConfig = TimeDesignModeConfig<ClassicModeParams>;
export type CoreTimeModeConfig = TimeDesignModeConfig<CoreTimeModeParams>;
export type WakeBasedModeConfig = TimeDesignModeConfig<WakeBasedModeParams>;
export type SolarModeConfig = TimeDesignModeConfig<SolarModeParams>;

/**
 * デフォルト値
 */
export const DEFAULT_VALUES = {
    user: {
        dayStartTime: '00:00',
        defaultTimezone: 'Asia/Tokyo',
        preferredMode: TimeDesignMode.Classic
    },

    classic: {
        designed24Duration: 1380  // 23時間
    },

    coreTime: {
        coreTimeStart: '07:00',
        coreTimeEnd: '22:00',
        minCoreHours: 6,
        anotherHourAllocation: null
    },

    wakeBased: {
        defaultWakeTime: '07:00',
        anotherHourDuration: 60,  // 1時間
        maxScaleFactor: 2.0
    },

    solar: {
        dayHoursTarget: 12,
        seasonalAdjustment: false
    }
};