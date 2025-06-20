// SolarMode.js - Solar-based time with fixed solar noon at 12:00
import { BaseMode } from './BaseMode.js';

/**
 * Helper to get a Date object for the current moment in a specific timezone using moment-timezone.
 * This is robust and avoids issues with native Date and toLocaleString parsing.
 */
function getNowInTimezone(tz) {
    // moment.tz understands IANA timezone names and creates a date object
    // correctly representing that point in time.
    return moment.tz(tz).toDate();
}

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

        // --- 1. Get Sun Times For Yesterday, Today, and Tomorrow ---
        const today = getNowInTimezone(location.timezone);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

        const timesToday = SunCalc.getTimes(today, location.lat, location.lng);
        const timesYesterday = SunCalc.getTimes(yesterday, location.lat, location.lng);
        const timesTomorrow = SunCalc.getTimes(tomorrow, location.lat, location.lng);

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
     * Get sun times for a city for a specific date.
     */
    getSunTimes(cityKey, date) {
        const cityData = this.getCityData(cityKey);
        if (!cityData) return null;

        const dateInTimezone = getNowInTimezone(cityData.tz);
        const times = SunCalc.getTimes(dateInTimezone, cityData.lat, cityData.lng);

        return {
            sunrise: times.sunrise,
            sunset: times.sunset,
            solarNoon: times.solarNoon,
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
                ...cityData
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
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarMode };
}