// public/js/scaling-utils.js

// localStorage keys - これらは personalized-ah-clock-ui.js と同じ値を使用
const LOCAL_STORAGE_KEY_APH_DURATION = "personalizedAhDurationMinutes";
const LOCAL_STORAGE_KEY_SELECTED_TIMEZONE = 'personalizedAhSelectedTimezone';

/**
 * 現在の有効なスケールファクターと、AH期間中か否かを取得します。
 * @returns {{ scaleFactor: number, isAhPeriod: boolean, normalAphDayDurationMinutes: number }}
 */
export function getCurrentScalingInfo() {
    // localStorageから設定値を取得
    const savedDurationString = localStorage.getItem(LOCAL_STORAGE_KEY_APH_DURATION);
    console.log('Saved duration string:', savedDurationString);

    // デフォルト値を Customizable Main Clock の初期値に合わせる (例: 23時間 = 1380分)
    let normalAphDayDurationMinutes = savedDurationString ? parseInt(savedDurationString, 10) : 1380;

    // 値のバリデーション (0分から1440分)
    normalAphDayDurationMinutes = Math.max(0, Math.min(normalAphDayDurationMinutes, 1440));
    console.log('Designed 24 duration (minutes):', normalAphDayDurationMinutes);

    // Moment.jsが利用可能かチェック
    if (typeof moment === 'undefined' || typeof moment.tz === 'undefined') {
        console.warn("Moment.js not available. Using scale factor 1.");
        return {
            scaleFactor: 1,
            isAhPeriod: false,
            normalAphDayDurationMinutes: normalAphDayDurationMinutes
        };
    }

    // タイムゾーンの取得 (保存されていなければユーザーのローカルタイムゾーン)
    let selectedTimezone = localStorage.getItem(LOCAL_STORAGE_KEY_SELECTED_TIMEZONE);
    if (!selectedTimezone) {
        selectedTimezone = moment.tz.guess() || 'UTC';
    }
    console.log('Selected timezone:', selectedTimezone);

    const now = new Date();
    const localTime = moment(now).tz(selectedTimezone);

    const realMillisecondsInDay = (localTime.hours() * 3600 + localTime.minutes() * 60 + localTime.seconds()) * 1000 + localTime.milliseconds();
    const normalAphDayDurationMs = normalAphDayDurationMinutes * 60 * 1000;

    const isAhPeriod = realMillisecondsInDay >= normalAphDayDurationMs;
    console.log('Is AH period:', isAhPeriod);

    let scaleFactor;
    if (isAhPeriod) {
        scaleFactor = 1; // AH期間中はスケールファクター1
    } else {
        const normalAphDayDurationHours = normalAphDayDurationMinutes / 60;
        if (normalAphDayDurationHours === 0) {
            // 通常期間が0分の場合、実質常にAH期間と同じなのでスケール1
            scaleFactor = 1;
        } else if (normalAphDayDurationHours === 24) {
            scaleFactor = 1; // 通常期間が24時間の場合もスケール1
        } else {
            scaleFactor = 24 / normalAphDayDurationHours;
        }
    }

    console.log('Calculated scale factor:', scaleFactor);
    console.log('Normal APH duration hours:', normalAphDayDurationMinutes / 60);

    return {
        scaleFactor: scaleFactor,
        isAhPeriod: isAhPeriod,
        normalAphDayDurationMinutes: normalAphDayDurationMinutes
    };
}