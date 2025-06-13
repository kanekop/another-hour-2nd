// SolarMode.js - Solar-based time with fixed solar noon at 12:00
import { BaseMode } from './BaseMode.js';

export class SolarMode extends BaseMode {
    constructor() {
        super(
            'solar',
            'Solar Mode',
            'Time flows with the sun - solar noon is always 12:00'
        );

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
                timezone: 'Asia/Tokyo'
            },
            designedDayHours: 12,
            autoAdjust: true // Note: autoAdjust logic is not fully implemented in this version
        };
    }

    getDefaultConfig() {
        return SolarMode.getDefaultConfig();
    }

    /**
     * Calculate Another Hour time based on the spec
     */
    calculate(date, timezone, config) {
        config = { ...this.getDefaultConfig(), ...config };
        const { location, designedDayHours } = config;
        const cityTz = location.timezone;

        if (typeof SunCalc === 'undefined' || typeof moment === 'undefined') {
            const now = new Date();
            return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(), scaleFactor: 1, periodName: 'Error: Lib not loaded' };
        }

        // --- 1. Get Sun Times ---
        const today = moment(date).tz(cityTz);
        const yesterday = today.clone().subtract(1, 'days');

        const timesToday = SunCalc.getTimes(today.toDate(), location.lat, location.lng);
        const timesYesterday = SunCalc.getTimes(yesterday.toDate(), location.lat, location.lng);

        // --- 2. Convert to minutes in city's timezone ---
        const sunriseMinutes = this.getMinutesSinceMidnight(timesToday.sunrise, cityTz);
        const sunsetMinutes = this.getMinutesSinceMidnight(timesToday.sunset, cityTz);
        const solarNoonMinutes = this.getMinutesSinceMidnight(timesToday.solarNoon, cityTz);
        const prevSunsetMinutes = this.getMinutesSinceMidnight(timesYesterday.sunset, cityTz);
        const realMinutes = this.getMinutesSinceMidnight(date, cityTz);

        // --- 3. Calculate Durations and Scale Factors ---
        const actualDaylightMinutes = sunsetMinutes - sunriseMinutes;
        const actualNightMinutes = 1440 - actualDaylightMinutes;
        const designedDayMinutes = designedDayHours * 60;
        const designedNightMinutes = (24 - designedDayHours) * 60;

        const dayScaleFactor = designedDayMinutes / actualDaylightMinutes;
        const nightScaleFactor = designedNightMinutes / actualNightMinutes;

        // --- 4. Determine Phase and Calculate AH Time ---
        let ahTotalMinutes, scaleFactor, periodName;

        if (realMinutes >= sunriseMinutes && realMinutes < sunsetMinutes) {
            // DAY
            scaleFactor = dayScaleFactor;
            const designedDayStartAh = (12 - designedDayHours / 2) * 60;

            if (realMinutes <= solarNoonMinutes) {
                // Morning
                periodName = 'Day (Morning)';
                const realMorningMinutes = solarNoonMinutes - sunriseMinutes;
                const progress = (realMinutes - sunriseMinutes) / realMorningMinutes;
                ahTotalMinutes = designedDayStartAh + (progress * designedDayMinutes / 2);
            } else {
                // Afternoon
                periodName = 'Day (Afternoon)';
                const realAfternoonMinutes = sunsetMinutes - solarNoonMinutes;
                const progress = (realMinutes - solarNoonMinutes) / realAfternoonMinutes;
                ahTotalMinutes = (12 * 60) + (progress * designedDayMinutes / 2);
            }
        } else {
            // NIGHT
            scaleFactor = nightScaleFactor;
            const designedNightStartAh = (12 + designedDayHours / 2) * 60;
            const totalRealNightMinutes = (sunriseMinutes + 1440) - prevSunsetMinutes;

            let elapsedRealNightMinutes;
            if (realMinutes >= sunsetMinutes) {
                periodName = 'Night (Evening)';
                elapsedRealNightMinutes = realMinutes - sunsetMinutes;
            } else { // Pre-dawn
                periodName = 'Night (Pre-dawn)';
                elapsedRealNightMinutes = (realMinutes + 1440) - sunsetMinutes;
            }

            const progress = (realMinutes < sunriseMinutes)
                ? ((realMinutes + 1440) - sunsetMinutes) / ((sunriseMinutes + 1440) - sunsetMinutes)
                : (realMinutes - sunsetMinutes) / ((sunriseMinutes + 1440) - sunsetMinutes);

            ahTotalMinutes = designedNightStartAh + progress * designedNightMinutes;
        }

        if (ahTotalMinutes >= 1440) ahTotalMinutes -= 1440;

        const hours = Math.floor(ahTotalMinutes / 60);
        const minutes = Math.floor(ahTotalMinutes % 60);
        const seconds = Math.floor((ahTotalMinutes * 60) % 60);

        return {
            hours,
            minutes,
            seconds,
            scaleFactor,
            isAnotherHour: false, // Concept doesn't directly apply here
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
     * Get sun times for a city
     */
    getSunTimes(cityKey) {
        const cityData = this.getCityData(cityKey);
        if (!cityData) return null;

        const now = new Date();
        const times = SunCalc.getTimes(now, cityData.lat, cityData.lng);
        const solarNoon = new Date((times.sunrise.getTime() + times.sunset.getTime()) / 2);

        return {
            sunrise: times.sunrise,
            sunset: times.sunset,
            solarNoon: solarNoon,
            daylightHours: (times.sunset - times.sunrise) / 3600000
        };
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
     * Get config UI data for Solar Mode
     */
    getConfigUI(config) {
        if (!config || !config.location) {
            config = this.getDefaultConfig();
        }

        const cityKey = config.location.key || 'tokyo';
        const cityData = this.getCityData(cityKey);
        const sunTimes = this.getSunTimes(cityKey);

        if (!sunTimes || !cityData) {
            return { solarInfo: null };
        }

        const solarInfo = {
            isAlwaysDay: false, // Placeholder for polar day logic
            isAlwaysNight: false, // Placeholder for polar night logic
            sunrise: this.getMinutesSinceMidnight(sunTimes.sunrise, cityData.timezone),
            solarNoon: this.getMinutesSinceMidnight(sunTimes.solarNoon, cityData.timezone),
            sunset: this.getMinutesSinceMidnight(sunTimes.sunset, cityData.timezone),
            daylightMinutes: sunTimes.daylightHours * 60,
        };

        return { solarInfo };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarMode };
}