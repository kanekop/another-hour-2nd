/**
 * SolarTimeFormatter - Solar Mode用の時刻フォーマッター
 * 
 * このモジュールは、Solar Modeで使用される日の出・日の入り時刻を
 * 正しく現地時間で表示するための専用フォーマッターです。
 * 
 * 重要: 常に都市のタイムゾーンを使用して時刻を表示します。
 */

export class SolarTimeFormatter {
    /**
     * 日時を指定されたタイムゾーンの現地時間でフォーマット
     * @param {Date|string|number} date - フォーマットする日時
     * @param {string} timezone - IANAタイムゾーン識別子（例: 'Asia/Tokyo'）
     * @param {Object} options - フォーマットオプション
     * @returns {string} フォーマットされた時刻文字列
     */
    static formatTime(date, timezone, options = {}) {
        if (!date) return '--:--:--';

        try {
            // Dateオブジェクトに変換
            const dateObj = date instanceof Date ? date : new Date(date);

            // 無効な日付をチェック
            if (isNaN(dateObj.getTime())) {
                console.error('Invalid date provided to formatTime:', date);
                return '--:--:--';
            }

            // デフォルトオプション
            const defaultOptions = {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };

            // オプションをマージ
            const formatOptions = { ...defaultOptions, ...options };

            return dateObj.toLocaleTimeString('en-GB', formatOptions);
        } catch (error) {
            console.error('Error formatting time:', error, { date, timezone });
            return '--:--:--';
        }
    }

    /**
     * 日の出・日の入り情報をフォーマット
     * @param {Object} solarInfo - 太陽情報オブジェクト
     * @param {string} timezone - 都市のタイムゾーン
     * @returns {Object} フォーマットされた太陽情報
     */
    static formatSolarInfo(solarInfo, timezone) {
        if (!solarInfo || !timezone) {
            return {
                sunrise: '--:--:--',
                sunset: '--:--:--',
                daylight: '--:--'
            };
        }

        return {
            sunrise: this.formatTime(solarInfo.sunrise, timezone),
            sunset: this.formatTime(solarInfo.sunset, timezone),
            daylight: this.formatDuration(solarInfo.daylightMinutes)
        };
    }

    /**
     * 分単位の時間を時間と分の表示にフォーマット
     * @param {number} minutes - 分単位の時間
     * @returns {string} フォーマットされた時間文字列
     */
    static formatDuration(minutes) {
        if (typeof minutes !== 'number' || isNaN(minutes)) {
            return '--:--';
        }

        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);

        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}m`;
        }
    }

    /**
     * 都市データからタイムゾーンを安全に取得
     * @param {Object} location - 都市データオブジェクト
     * @returns {string} タイムゾーン文字列
     */
    static getTimezone(location) {
        if (!location) {
            console.warn('No location provided to getTimezone');
            return 'UTC';
        }

        // location.timezone と location.tz の両方をチェック
        const timezone = location.timezone || location.tz;

        if (!timezone) {
            console.warn('No timezone found in location:', location);
            return 'UTC';
        }

        return timezone;
    }

    /**
     * デバッグ用: 現在の設定と表示内容を検証
     * @param {Object} config - Solar Mode設定
     * @param {Object} solarInfo - 太陽情報
     */
    static debug(config, solarInfo) {
        const timezone = this.getTimezone(config.location);
        console.group('Solar Time Formatter Debug');
        console.log('Location:', config.location);
        console.log('Timezone:', timezone);
        console.log('Solar Info:', solarInfo);
        console.log('Formatted:', this.formatSolarInfo(solarInfo, timezone));
        console.groupEnd();
    }
}

// デフォルトエクスポート
export default SolarTimeFormatter; 