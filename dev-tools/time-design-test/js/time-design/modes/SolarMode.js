// SolarMode.js - Solar-based time with fixed solar noon at 12:00
import { BaseMode } from './BaseMode.js';
import { SolarTimeFormatter } from '../../utils/SolarTimeFormatter.js';

/**
 * Helper to get a Date object for the current moment in a specific timezone using moment-timezone.
 * This is robust and avoids issues with native Date and toLocaleString parsing.
 */
function getNowInTimezone(timezone) {
    const now = new Date();
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const parts = formatter.formatToParts(now);
        const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
        const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
        const second = parseInt(parts.find(p => p.type === 'second').value, 10);
        const date = new Date(now);
        date.setHours(hour, minute, second, 0);
        return date;
    } catch (e) {
        // Fallback: local time
        return now;
    }
}

export class SolarMode extends BaseMode {
    constructor() {
        super(
            'solar',
            'Solar Mode',
            'Time flows with the sun - solar noon is always 12:00'
        );
        this.id = 'solar';

        // City presets
        this.cities = {
            tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
            kumamoto: { name: 'Kumamoto', lat: 32.8032, lng: 130.7079, tz: 'Asia/Tokyo' },
            newyork: { name: 'New York', lat: 40.7128, lng: -74.0060, tz: 'America/New_York' },
            london: { name: 'London', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
            singapore: { name: 'Singapore', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore' },
            sydney: { name: 'Sydney', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
            reykjavik: { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, tz: 'Atlantic/Reykjavik' },
            cairo: { name: 'Cairo', lat: 30.0444, lng: 31.2357, tz: 'Africa/Cairo' }
        };
    }

    /**
     * Get default configuration for Solar Mode
     */
    static getDefaultConfig() {
        return {
            location: {
                key: 'tokyo',
                lat: 35.6762,
                lng: 139.6503,
                name: 'Tokyo',
                timezone: 'Asia/Tokyo',
                tz: 'Asia/Tokyo'
            },
            designedDayHours: 12,
            autoAdjust: true // Note: autoAdjust logic is not fully implemented in this version
        };
    }

    getDefaultConfig() {
        return SolarMode.getDefaultConfig();
    }

    /**
     * Get sun times for a city for a specific date.
     * SunCalc依存を排除し、サンプル値で代用（東京の夏至を例示）
     */
    getSunTimes(cityKey, date) {
        const cityData = this.getCityData(cityKey);
        if (!cityData) return null;

        // サンプル値: 東京の夏至（6月21日）
        // 都市・季節ごとに分岐したい場合はここで分岐
        let sunriseHour = 4, sunriseMin = 30, sunsetHour = 19, sunsetMin = 0;
        if (cityKey === 'tokyo') {
            sunriseHour = 4; sunriseMin = 30; sunsetHour = 19; sunsetMin = 0;
        } else if (cityKey === 'london') {
            sunriseHour = 4; sunriseMin = 43; sunsetHour = 21; sunsetMin = 21;
        } else if (cityKey === 'newyork') {
            sunriseHour = 5; sunriseMin = 25; sunsetHour = 20; sunsetMin = 30;
        } // 必要に応じて他都市も追加

        const baseDate = date ? new Date(date) : new Date();
        const sunrise = new Date(baseDate);
        sunrise.setHours(sunriseHour, sunriseMin, 0, 0);
        const sunset = new Date(baseDate);
        sunset.setHours(sunsetHour, sunsetMin, 0, 0);
        const solarNoon = new Date(baseDate);
        solarNoon.setHours(12, 0, 0, 0);

        return {
            sunrise,
            sunset,
            solarNoon,
            daylightHours: (sunset - sunrise) / 3600000
        };
    }

    /**
     * Calculate Another Hour time based on the spec
     * SunCalc依存を排除し、getSunTimesの値を使う
     */
    calculate(date, timezone, config) {
        config = { ...this.getDefaultConfig(), ...config };
        const { location, designedDayHours } = config;

        // --- 1. Get Sun Times For Yesterday, Today, and Tomorrow ---
        const today = getNowInTimezone(location.timezone);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

        const timesToday = this.getSunTimes(location.key, today);
        const timesYesterday = this.getSunTimes(location.key, yesterday);
        const timesTomorrow = this.getSunTimes(location.key, tomorrow);

        // --- 2. Get Critical Timestamps (milliseconds) ---
        const nowTs = today.getTime();
        const sunriseTs = timesToday.sunrise.getTime();
        const sunsetTs = timesToday.sunset.getTime();
        const solarNoonTs = timesToday.solarNoon.getTime();

        // --- 3. Designed Durations and Anchor Points in AH Minutes ---
        const designedDayMinutes = designedDayHours * 60;
        const designedNightMinutes = (24 - designedDayHours) * 60;
        const ahDayStartMinutes = 12 * 60 - designedDayMinutes / 2;
        const ahNoonMinutes = 12 * 60;
        const ahDayEndMinutes = 12 * 60 + designedDayMinutes / 2;

        // --- 4. Determine Phase and Calculate AH Time ---
        let ahTotalMinutes, scaleFactor, periodName;

        if (nowTs >= sunriseTs && nowTs < sunsetTs) {
            // DAY
            periodName = nowTs <= solarNoonTs ? 'Day (Morning)' : 'Day (Afternoon)';
            const actualDaylightMs = sunsetTs - sunriseTs;
            scaleFactor = actualDaylightMs > 0 ? (designedDayMinutes * 60 * 1000) / actualDaylightMs : 1;

            if (nowTs <= solarNoonTs) {
                const realMorningMs = solarNoonTs - sunriseTs;
                const progress = realMorningMs > 0 ? (nowTs - sunriseTs) / realMorningMs : 0;
                ahTotalMinutes = ahDayStartMinutes + progress * (designedDayMinutes / 2);
            } else {
                const realAfternoonMs = sunsetTs - solarNoonTs;
                const progress = realAfternoonMs > 0 ? (nowTs - solarNoonTs) / realAfternoonMs : 0;
                ahTotalMinutes = ahNoonMinutes + progress * (designedDayMinutes / 2);
            }
        } else {
            // NIGHT
            let nightStartTs, nightEndTs;
            if (nowTs < sunriseTs) {
                periodName = 'Night (Pre-dawn)';
                nightStartTs = timesYesterday.sunset.getTime();
                nightEndTs = sunriseTs;
            } else { // nowTs >= sunsetTs
                periodName = 'Night (Evening)';
                nightStartTs = sunsetTs;
                nightEndTs = timesTomorrow.sunrise.getTime();
            }

            const actualNightMs = nightEndTs - nightStartTs;
            scaleFactor = actualNightMs > 0 ? (designedNightMinutes * 60 * 1000) / actualNightMs : 1;

            const elapsedRealNightMs = nowTs - nightStartTs;
            const progress = actualNightMs > 0 ? elapsedRealNightMs / actualNightMs : 0;

            ahTotalMinutes = ahDayEndMinutes + progress * designedNightMinutes;
        }

        ahTotalMinutes = (ahTotalMinutes % 1440 + 1440) % 1440;

        const hours = Math.floor(ahTotalMinutes / 60);
        const minutes = Math.floor(ahTotalMinutes % 60);
        const seconds = Math.floor((ahTotalMinutes * 60) % 60);

        return {
            hours, minutes, seconds, scaleFactor,
            isAnotherHour: false,
            segmentInfo: { label: periodName },
            periodName,
        };
    }

    /**
     * Get city data
     */
    getCityData(cityKey) {
        return this.cities[cityKey];
    }

    /**
     * Validate configuration
     */
    validate(config) {
        const errors = [];
        if (!config.location) errors.push('Location is required');
        if (!config.designedDayHours || config.designedDayHours < 1 || config.designedDayHours > 23) {
            errors.push('Day Hours must be between 1 and 23');
        }
        return { valid: errors.length === 0, errors: errors };
    }

    /**
     * Collects configuration from the UI elements.
     */
    collectConfigFromUI() {
        const cityKey = document.getElementById('solar-city').value;
        const cityData = this.getCityData(cityKey);

        const sliderElement = document.getElementById('solar-day-hours-slider');
        const designedDayHours = sliderElement && sliderElement.noUiSlider ? parseFloat(sliderElement.noUiSlider.get()) : this.getDefaultConfig().designedDayHours;

        return {
            location: {
                key: cityKey,
                ...cityData,
                timezone: cityData.tz
            },
            designedDayHours: designedDayHours
        };
    }

    /**
     * Get config UI data for Solar Mode
     */
    getConfigUI(config) {
        if (!config || !config.location || !config.location.key) {
            config = this.getDefaultConfig();
        }

        const cityKey = config.location.key;
        const cityData = this.getCityData(cityKey);

        // Pass the date object to getSunTimes. The method itself will handle timezone.
        const sunTimes = this.getSunTimes(cityKey, new Date());

        if (!sunTimes) {
            return { solarInfo: null };
        }

        const solarInfo = {
            sunrise: sunTimes.sunrise,
            solarNoon: sunTimes.solarNoon,
            sunset: sunTimes.sunset,
            daylightMinutes: sunTimes.daylightHours * 60,
        };

        return { solarInfo };
    }

    /**
     * Get segments for timeline display
     */
    getSegments(config) {
        config = config || this.getConfig();
        if (!config || !config.location || !config.location.key) {
            config = this.getDefaultConfig();
        }
        const cityKey = config.location.key;
        const sunTimes = this.getSunTimes(cityKey, new Date());
        if (!sunTimes) {
            return [];
        }
        const segments = [];

        // Convert times to minutes since midnight
        const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
        const sunsetMinutes = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes();

        // Night (midnight to sunrise)
        if (sunriseMinutes > 0) {
            segments.push({
                type: 'night',
                label: 'Night',
                shortLabel: 'Night',
                startMinutes: 0,
                durationMinutes: sunriseMinutes,
                style: {
                    background: 'linear-gradient(to right, #1A237E, #283593)'
                }
            });
        }

        // Day (sunrise to sunset)
        segments.push({
            type: 'day',
            label: 'Day',
            shortLabel: 'Day',
            startMinutes: sunriseMinutes,
            durationMinutes: sunsetMinutes - sunriseMinutes,
            style: {
                background: 'linear-gradient(to right, #FFB300, #FFD600, #FFB300)'
            }
        });

        // Night (sunset to midnight)
        if (sunsetMinutes < 24 * 60) {
            segments.push({
                type: 'night',
                label: 'Night',
                shortLabel: 'Night',
                startMinutes: sunsetMinutes,
                durationMinutes: 24 * 60 - sunsetMinutes,
                style: {
                    background: 'linear-gradient(to right, #283593, #1A237E)'
                }
            });
        }

        return segments;
    }

    getTimelineSegments(config) {
        config = config || this.getConfig();
        if (typeof this.getSegments === 'function') {
            return this.getSegments(config);
        }
        return [];
    }

    getSolarInfo(date = new Date(), config = this.getConfig()) {
        // 必要に応じて太陽情報を返す
        return {};
    }

    static getConfigSchema() {
        return this.prototype.configSchema || {};
    }

    getConfig() {
        return this.config || {};
    }

    getCurrentPhase(date = new Date(), config = this.getConfig()) {
        // SolarModeの仕様に合わせて、昼/夜/その他のフェーズ名を返す
        return 'unknown'; // 仮実装
    }

    getScaleFactor(date = new Date(), config = this.getConfig()) {
        // SolarModeの仕様に合わせて、現在のスケールファクターを返す
        return 1; // 仮実装
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarMode };
}