/**
 * Another Hour システムで使用する時間関連の定数
 */
export const TIME_CONSTANTS = {
  HOURS_IN_DAY: 24,
  MINUTES_IN_HOUR: 60,
  SECONDS_IN_MINUTE: 60,
  MILLISECONDS_IN_SECOND: 1000,
  MILLISECONDS_IN_MINUTE: 60000,
  MILLISECONDS_IN_HOUR: 3600000,
  DEGREES_IN_CIRCLE: 360,
  
  // Another Hour 特有の定数
  DEFAULT_DESIGNED_24_DURATION: 8, // デフォルトは8時間
  MIN_DESIGNED_24_DURATION: 0.1,   // 最小6分
  MAX_DESIGNED_24_DURATION: 24,    // 最大24時間
} as const;

export type TimeConstants = typeof TIME_CONSTANTS;

/**
 * 時計の針の定数
 */
export const CLOCK_CONSTANTS = {
  HOUR_HAND_DEGREES_PER_HOUR: 30,    // 360° / 12時間
  MINUTE_HAND_DEGREES_PER_MINUTE: 6,  // 360° / 60分
  HOUR_HAND_DEGREES_PER_MINUTE: 0.5,  // 30° / 60分
} as const;

export type ClockConstants = typeof CLOCK_CONSTANTS; 