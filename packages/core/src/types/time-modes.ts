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
    designed24Duration: number;
    d24StartTime: Date;
}

/**
 * Core Time Mode のパラメータ
 */
export interface CoreTimeModeParams {
    coreStartTime: Date;      // コア時間の開始
    coreEndTime: Date;        // コア時間の終了
    designed24Duration: number;
    bufferBefore?: number;    // コア時間前のバッファ（分）
    bufferAfter?: number;     // コア時間後のバッファ（分）
}

/**
 * Wake-Based Mode のパラメータ
 */
export interface WakeBasedModeParams {
    wakeUpTime: Date;         // 起床時刻
    designed24Duration: number;
    adaptiveLearning?: boolean; // 起床時刻の学習機能
}

/**
 * Solar Mode のパラメータ
 */
export interface SolarModeParams {
    latitude: number;         // 緯度
    longitude: number;        // 経度
    designed24Duration: number;
    seasonalAdjustment?: boolean; // 季節による調整
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