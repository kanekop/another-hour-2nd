/**
 * SolarMode.js - Solar-based time with fixed solar noon at 12:00
 * 
 * This is the unified implementation combining the best practices from both
 * dev-tools and scheduler-web implementations.
 * 
 * Solar Mode synchronizes time with the sun's movement:
 * - Solar noon is always fixed at 12:00 Another Hour time
 * - Day length can be customized while maintaining solar synchronization
 * - Night periods fill the remaining time
 * 
 * @author Another Hour Team
 * @version 1.0.0
 */

import { BaseMode } from './BaseMode.js';

/**
 * Helper to get a Date object for the current moment in a specific timezone
 * Uses moment-timezone for robust timezone handling
 * @param {string} tz - Timezone identifier
 * @returns {Date} Date object in the specified timezone
 */
function getNowInTimezone(tz) {
    if (typeof moment !== 'undefined' && typeof moment.tz !== 'undefined') {
        return moment.tz(tz).toDate();
    }
    // Fallback to current time if moment.js not available
    return new Date();
}

/**
 * SolarMode - Time flows with the sun
 * Solar noon is always 12:00, with customizable day length
 */
export class SolarMode extends BaseMode {
    constructor() {
        super(
            'solar',
            'Solar Mode',
            'Time flows with the sun - solar noon is always 12:00',
            {
                location: {
                    type: 'object',
                    label: 'Location',
                    properties: {
                        key: { type: 'string', default: 'tokyo' },
                        lat: { type: 'number', min: -90, max: 90 },
                        lng: { type: 'number', min: -180, max: 180 },
                        name: { type: 'string' },
                        timezone: { type: 'string' }
                    }
                },
                designedDayHours: {
                    type: 'number',
                    label: 'Designed Day Hours',
                    min: 1,
                    max: 23,
                    default: 12
                },
                autoAdjust: {
                    type: 'boolean',
                    label: 'Auto-adjust to daylight hours',
                    default: true
                }
            }
        );

        // City presets with coordinates and timezones
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
     * @returns {Object} Default configuration
     */
    getDefaultConfig() {
        return SolarMode.getDefaultConfig();
    }

    /**
     * Static method to get default configuration
     * @static
     * @returns {Object} Default configuration
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
            autoAdjust: true
        };
    }

    /**
     * Validate configuration for Solar Mode
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result { valid: boolean, errors: string[] }
     */
    validate(config) {
        const errors = [];
        
        if (!config.location) {
            errors.push('Location is required');
        } else {
            if (typeof config.location.lat !== 'number' || config.location.lat < -90 || config.location.lat > 90) {
                errors.push('Location latitude must be between -90 and 90');
            }
            if (typeof config.location.lng !== 'number' || config.location.lng < -180 || config.location.lng > 180) {
                errors.push('Location longitude must be between -180 and 180');
            }
            if (!config.location.tz) {
                errors.push('Location timezone is required');
            }
        }
        
        if (!config.designedDayHours || config.designedDayHours < 1 || config.designedDayHours > 23) {
            errors.push('Day Hours must be between 1 and 23');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Collect configuration from UI elements
     * @returns {Object} Configuration object from UI
     */
    collectConfigFromUI() {
        const citySelect = document.getElementById('solarCitySelect');
        const dayHoursSlider = document.getElementById('dayHoursSlider');
        const autoAdjustCheckbox = document.getElementById('autoAdjust');

        const cityKey = citySelect ? citySelect.value : 'tokyo';
        const cityData = this.getCityData(cityKey);
        
        return {
            location: {
                key: cityKey,
                ...cityData
            },
            designedDayHours: dayHoursSlider ? parseFloat(dayHoursSlider.value) : 12,
            autoAdjust: autoAdjustCheckbox ? autoAdjustCheckbox.checked : true
        };
    }

    /**
     * Calculate Another Hour time based on solar position
     * @param {Date} date - Current real date/time
     * @param {string} timezone - Timezone identifier
     * @param {Object} config - Mode configuration
     * @returns {Object} Time calculation result
     */
    calculate(date, timezone, config) {
        // Check if SunCalc is available
        if (typeof SunCalc === 'undefined') {
            console.error('SunCalc library is required for Solar Mode');
            return {
                hours: date.getHours(),
                minutes: date.getMinutes(),
                seconds: date.getSeconds(),
                scaleFactor: 1,
                isAnotherHour: false,
                segmentInfo: { label: 'SunCalc Required' },
                periodName: 'Error: SunCalc Library Missing'
            };
        }

        const location = config.location;
        const designedDayHours = config.designedDayHours;
        const designedDayMinutes = designedDayHours * 60;
        const designedNightMinutes = 1440 - designedDayMinutes;

        // Get sun times for today, yesterday, and tomorrow
        const dateInTimezone = getNowInTimezone(location.tz);
        const timesToday = SunCalc.getTimes(dateInTimezone, location.lat, location.lng);
        
        const yesterday = new Date(dateInTimezone);
        yesterday.setDate(yesterday.getDate() - 1);
        const timesYesterday = SunCalc.getTimes(yesterday, location.lat, location.lng);
        
        const tomorrow = new Date(dateInTimezone);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const timesTomorrow = SunCalc.getTimes(tomorrow, location.lat, location.lng);

        const nowTs = date.getTime();
        const sunriseTs = timesToday.sunrise.getTime();
        const sunsetTs = timesToday.sunset.getTime();
        const solarNoonTs = timesToday.solarNoon.getTime();

        let scaleFactor = 1;
        let ahTotalMinutes = 0;
        let periodName = '';

        // Calculate Another Hour minutes (noon is always at minute 720 = 12:00)
        const ahNoonMinutes = 12 * 60; // 720 minutes = 12:00

        if (nowTs >= sunriseTs && nowTs < sunsetTs) {
            // DAY PERIOD
            const actualDayMs = sunsetTs - sunriseTs;
            scaleFactor = actualDayMs > 0 ? (designedDayMinutes * 60 * 1000) / actualDayMs : 1;

            if (nowTs <= solarNoonTs) {
                // Morning: sunrise to solar noon
                periodName = 'Day (Morning)';
                const realMorningMs = solarNoonTs - sunriseTs;
                const progress = realMorningMs > 0 ? (nowTs - sunriseTs) / realMorningMs : 0;
                ahTotalMinutes = ahNoonMinutes - (designedDayMinutes / 2) + progress * (designedDayMinutes / 2);
            } else {
                // Afternoon: solar noon to sunset
                periodName = 'Day (Afternoon)';
                const realAfternoonMs = sunsetTs - solarNoonTs;
                const progress = realAfternoonMs > 0 ? (nowTs - solarNoonTs) / realAfternoonMs : 0;
                ahTotalMinutes = ahNoonMinutes + progress * (designedDayMinutes / 2);
            }
        } else {
            // NIGHT PERIOD
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

            const ahDayEndMinutes = ahNoonMinutes + (designedDayMinutes / 2);
            ahTotalMinutes = ahDayEndMinutes + progress * designedNightMinutes;
        }

        // Normalize to 0-1439 range
        ahTotalMinutes = (ahTotalMinutes % 1440 + 1440) % 1440;

        const hours = Math.floor(ahTotalMinutes / 60);
        const minutes = Math.floor(ahTotalMinutes % 60);
        const seconds = Math.floor((ahTotalMinutes * 60) % 60);

        return {
            hours,
            minutes,
            seconds,
            scaleFactor,
            isAnotherHour: false, // Solar mode doesn't use Another Hour periods
            segmentInfo: {
                type: 'designed',
                label: periodName,
                progress: 0, // Progress calculation would need more complex logic
                remaining: 0,
                duration: periodName.includes('Day') ? designedDayMinutes : designedNightMinutes
            },
            periodName,
        };
    }

    /**
     * Get city data by key
     * @param {string} cityKey - City identifier
     * @returns {Object|null} City data or null if not found
     */
    getCityData(cityKey) {
        return this.cities[cityKey] || null;
    }

    /**
     * Get sun times for a city for a specific date
     * @param {string} cityKey - City identifier
     * @param {Date} date - Date to calculate sun times for
     * @returns {Object|null} Sun times or null if city not found
     */
    getSunTimes(cityKey, date) {
        const cityData = this.getCityData(cityKey);
        if (!cityData) return null;

        // Check if SunCalc is available
        if (typeof SunCalc === 'undefined') {
            console.error('SunCalc library is required for Solar Mode');
            return null;
        }

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
     * Get available cities
     * @returns {Array} Array of city objects
     */
    getAvailableCities() {
        return Object.keys(this.cities).map(key => ({
            key,
            ...this.cities[key]
        }));
    }

    /**
     * Get configuration summary for display purposes
     * @param {Object} config - Mode configuration
     * @returns {Object} Human-readable configuration summary
     */
    getConfigSummary(config) {
        return {
            location: {
                name: config.location.name,
                coordinates: `${config.location.lat.toFixed(4)}, ${config.location.lng.toFixed(4)}`,
                timezone: config.location.tz
            },
            dayLength: {
                hours: config.designedDayHours,
                display: this.formatDuration(config.designedDayHours * 60)
            },
            nightLength: {
                hours: 24 - config.designedDayHours,
                display: this.formatDuration((24 - config.designedDayHours) * 60)
            },
            autoAdjust: config.autoAdjust
        };
    }
}