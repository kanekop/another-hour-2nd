/**
 * Solar Mode Core Implementation
 * Another Hour Project
 * 
 * This mode synchronizes time with the sun's movement,
 * always placing solar noon at 12:00 Another Hour time.
 * 
 * Version: 2.1 - Timezone-aware calculations
 */

import { BaseMode } from './BaseMode.js';

// Helper to convert a Date object to minutes from midnight in a specific timezone
function dateToMinutesInTimezone(date, timezone) {
    if (!date || !timezone || isNaN(date)) return null;
    try {
        const parts = new Intl.DateTimeFormat('en-GB', {
            hour: 'numeric', minute: 'numeric', hourCycle: 'h23', timeZone: timezone
        }).formatToParts(date);
        const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
        const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
        return hour * 60 + minute;
    } catch (e) {
        console.error(`Failed to convert date to minutes for timezone ${timezone}`, e);
        return null; // Return null on error
    }
}

export class SolarMode extends BaseMode {
    static getDefaultConfig() {
        return {
            location: {
                lat: 35.6762,  // Tokyo
                lng: 139.6503,
                name: 'Tokyo',
                timezone: 'Asia/Tokyo'
            },
            designedDayHours: 12,  // Will be updated based on actual daylight
            autoAdjust: true       // Auto-adjust to actual daylight hours
        };
    }
    constructor() {
        super();
        this.id = 'solar';
        this.name = 'Solar Mode';
        this.description = 'Time flows with the sun - solar noon is always 12:00';

        // Config will be set by initialize()
        this.config = {};

        // Solar calculation cache
        this.solarCache = {
            date: null,
            locationName: null,
            times: null,
            scaleFactors: null
        };

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
     * Initialize the mode with configuration
     */
    initialize(config = {}) {
        this.config = { ...this.constructor.getDefaultConfig(), ...config };
        this.updateSolarTimes(new Date());

        // Set up daily update at midnight
        this.scheduleDailyUpdate();
    }

    /**
     * Validate the configuration object (Required by BaseMode).
     * @param {object} config - The configuration to validate.
     * @returns {{valid: boolean, errors: string[]}} - The validation result.
     */
    validate(config) {
        const errors = [];
        if (!config.location || typeof config.location.lat !== 'number' || typeof config.location.lng !== 'number') {
            errors.push('Configuration must include a location with lat and lng.');
        }
        return { valid: errors.length === 0, errors };
    }

    /**
     * Main calculation method called by the TimeDesignManager (Required by BaseMode).
     * @param {Date} date - The current real time.
     * @param {string} timezone - The browser's timezone (we use the city's timezone from config).
     * @param {object} config - The mode's current configuration.
     * @returns {object} - The calculated Another Hour time and state.
     */
    calculate(date, timezone, config) {
        // Ensure internal config is up-to-date
        this.config = { ...this.constructor.getDefaultConfig(), ...config };

        if (typeof SunCalc === 'undefined') {
            console.error('SunCalc.js library is not loaded.');
            const now = new Date();
            return {
                hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds(),
                isError: true, errorMessage: 'SunCalc library not loaded.'
            };
        }

        this.updateSolarTimes(date);

        const currentMinutes = dateToMinutesInTimezone(date, this.config.location.timezone);
        const { times, scaleFactors } = this.solarCache;

        // Determine current phase and calculate AH time
        let ahTotalMinutes;

        if (times.isAlwaysDay) {
            // Polar Day: 24h of daytime
            ahTotalMinutes = (currentMinutes / 1440) * (24 * 60);
        } else if (times.isAlwaysNight) {
            // Polar Night: 24h of nighttime
            ahTotalMinutes = (currentMinutes / 1440) * (24 * 60);
        } else if (currentMinutes >= times.sunrise && currentMinutes < times.sunset) {
            // Day phase
            const progress = (currentMinutes - times.sunrise) / times.daylightMinutes;
            ahTotalMinutes = progress * (this.config.designedDayHours * 60);
        } else {
            // Night phase
            let nightProgress;
            if (currentMinutes < times.sunrise) { // After midnight, before sunrise
                const midnightToSunrise = times.sunrise;
                const prevSunsetToMidnight = 1440 - times.sunset;
                nightProgress = (times.sunset + currentMinutes) / (prevSunsetToMidnight + midnightToSunrise);

            } else { // After sunset, before midnight
                nightProgress = (currentMinutes - times.sunset) / (1440 - times.sunset + times.sunrise);
            }
            ahTotalMinutes = (this.config.designedDayHours * 60) + (nightProgress * ((24 - this.config.designedDayHours) * 60));
        }

        const ahHours = Math.floor(ahTotalMinutes / 60) % 24;
        const ahMinutes = Math.floor(ahTotalMinutes % 60);
        const ahSeconds = Math.floor((ahTotalMinutes * 60) % 60);

        return {
            hours: ahHours,
            minutes: ahMinutes,
            seconds: ahSeconds,
            scaleFactor: 1, // Placeholder
            isAnotherHour: true,
            segmentInfo: {}, // Placeholder
            periodName: 'Solar', // Placeholder
        };
    }

    /**
     * Calculate solar times for a given date
     */
    updateSolarTimes(date) {
        const dateKey = date.toDateString();
        const location = this.config.location;

        // Use cache if available for the same date and location
        if (this.solarCache.date === dateKey && this.solarCache.locationName === location.name) {
            return this.solarCache;
        }

        // Calculate new solar times using SunCalc
        const times = SunCalc.getTimes(date, location.lat, location.lng);

        // Convert times to minutes from midnight in the target timezone
        const sunriseMinutes = dateToMinutesInTimezone(times.sunrise, location.timezone);
        const sunsetMinutes = dateToMinutesInTimezone(times.sunset, location.timezone);
        const solarNoonMinutes = dateToMinutesInTimezone(times.solarNoon, location.timezone);

        // Handle edge cases like polar day/night
        const alwaysDay = sunriseMinutes === null && sunsetMinutes === null && solarNoonMinutes !== null;
        const alwaysNight = solarNoonMinutes === null;

        let daylightMinutes, nightMinutes;

        if (alwaysDay) {
            daylightMinutes = 1440;
            nightMinutes = 0;
        } else if (alwaysNight) {
            daylightMinutes = 0;
            nightMinutes = 1440;
        } else {
            daylightMinutes = sunsetMinutes - sunriseMinutes;
            nightMinutes = 1440 - daylightMinutes;
        }

        // Auto-adjust designed day hours if enabled
        if (this.config.autoAdjust && daylightMinutes > 0) {
            this.config.designedDayHours = Math.round(daylightMinutes / 60);
        }

        // Calculate scale factors
        const designedNightHours = 24 - this.config.designedDayHours;
        const dayScaleFactor = daylightMinutes > 0 ? (this.config.designedDayHours * 60) / daylightMinutes : 1;
        const nightScaleFactor = nightMinutes > 0 ? (designedNightHours * 60) / nightMinutes : 1;

        // Cache the results
        this.solarCache = {
            date: dateKey,
            locationName: location.name,
            times: {
                sunrise: sunriseMinutes,
                sunset: sunsetMinutes,
                solarNoon: solarNoonMinutes,
                daylightMinutes: daylightMinutes,
                nightMinutes: nightMinutes,
                isAlwaysDay: alwaysDay,
                isAlwaysNight: alwaysNight
            },
            scaleFactors: {
                day: Math.max(0.1, Math.min(10, dayScaleFactor)),
                night: Math.max(0.1, Math.min(10, nightScaleFactor))
            }
        };

        return this.solarCache;
    }

    /**
     * Get current time segment information
     */
    getCurrentSegment(now = new Date()) {
        this.updateSolarTimes(now);

        const { times, scaleFactors } = this.solarCache;
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        // Determine current phase
        if (now < times.sunrise) {
            // Night phase (after midnight)
            return {
                phase: 'night',
                subPhase: 'late-night',
                scaleFactor: scaleFactors.night,
                startTime: todayStart,
                endTime: times.sunrise,
                label: 'Night'
            };
        } else if (now < times.sunset) {
            // Day phase
            const subPhase = now < times.solarNoon ? 'morning' : 'afternoon';
            return {
                phase: 'day',
                subPhase: subPhase,
                scaleFactor: scaleFactors.day,
                startTime: times.sunrise,
                endTime: times.sunset,
                label: subPhase === 'morning' ? 'Morning' : 'Afternoon'
            };
        } else {
            // Night phase (after sunset)
            const nextMidnight = new Date(todayStart);
            nextMidnight.setDate(nextMidnight.getDate() + 1);
            return {
                phase: 'night',
                subPhase: 'evening',
                scaleFactor: scaleFactors.night,
                startTime: times.sunset,
                endTime: nextMidnight,
                label: 'Evening'
            };
        }
    }

    /**
     * Convert real time to Another Hour time
     */
    realToAnotherHour(realTime) {
        const date = new Date(realTime);
        this.updateSolarTimes(date);

        const { times } = this.solarCache;
        const segment = this.getCurrentSegment(date);

        // Calculate Another Hour time based on phase
        let ahTime;

        if (date < times.sunrise) {
            // Night: 0:00 to 6:00
            const progress = (date - segment.startTime) / (segment.endTime - segment.startTime);
            ahTime = progress * 6; // 0 to 6 hours
        } else if (date < times.solarNoon) {
            // Morning: 6:00 to 12:00
            const progress = (date - times.sunrise) / (times.solarNoon - times.sunrise);
            ahTime = 6 + (progress * 6); // 6 to 12 hours
        } else if (date < times.sunset) {
            // Afternoon: 12:00 to 18:00
            const progress = (date - times.solarNoon) / (times.sunset - times.solarNoon);
            ahTime = 12 + (progress * 6); // 12 to 18 hours
        } else {
            // Evening: 18:00 to 24:00
            const progress = (date - times.sunset) / (segment.endTime - times.sunset);
            ahTime = 18 + (progress * 6); // 18 to 24 hours
        }

        // Convert to time components
        const hours = Math.floor(ahTime);
        const minutes = Math.floor((ahTime - hours) * 60);
        const seconds = Math.floor(((ahTime - hours) * 60 - minutes) * 60);

        return {
            hours: hours,
            minutes: minutes,
            seconds: seconds,
            totalMinutes: ahTime * 60,
            scaleFactor: segment.scaleFactor,
            segmentInfo: segment
        };
    }

    /**
     * Convert Another Hour time to real time
     */
    anotherHourToReal(ahHours, ahMinutes = 0, referenceDate = new Date()) {
        this.updateSolarTimes(referenceDate);
        const { times } = this.solarCache;

        const ahTotalHours = ahHours + (ahMinutes / 60);
        let realTime;

        if (ahTotalHours < 6) {
            // Night phase (0:00 to 6:00 AH)
            const progress = ahTotalHours / 6;
            const nightStart = new Date(referenceDate);
            nightStart.setHours(0, 0, 0, 0);
            realTime = new Date(nightStart.getTime() + progress * (times.sunrise - nightStart));
        } else if (ahTotalHours < 12) {
            // Morning phase (6:00 to 12:00 AH)
            const progress = (ahTotalHours - 6) / 6;
            realTime = new Date(times.sunrise.getTime() + progress * (times.solarNoon - times.sunrise));
        } else if (ahTotalHours < 18) {
            // Afternoon phase (12:00 to 18:00 AH)
            const progress = (ahTotalHours - 12) / 6;
            realTime = new Date(times.solarNoon.getTime() + progress * (times.sunset - times.solarNoon));
        } else {
            // Evening phase (18:00 to 24:00 AH)
            const progress = (ahTotalHours - 18) / 6;
            const nextMidnight = new Date(referenceDate);
            nextMidnight.setDate(nextMidnight.getDate() + 1);
            nextMidnight.setHours(0, 0, 0, 0);
            realTime = new Date(times.sunset.getTime() + progress * (nextMidnight - times.sunset));
        }

        return realTime;
    }

    /**
     * Get visualization data for UI
     */
    getVisualizationData() {
        this.updateSolarTimes(new Date());
        const { times, scaleFactors } = this.solarCache;

        return {
            mode: 'solar',
            solarTimes: times,
            scaleFactors: scaleFactors,
            segments: [
                {
                    name: 'Late Night',
                    startAH: 0,
                    endAH: 6,
                    scaleFactor: scaleFactors.night,
                    color: '#1a237e'
                },
                {
                    name: 'Morning',
                    startAH: 6,
                    endAH: 12,
                    scaleFactor: scaleFactors.day,
                    color: '#ff9800'
                },
                {
                    name: 'Afternoon',
                    startAH: 12,
                    endAH: 18,
                    scaleFactor: scaleFactors.day,
                    color: '#ffc107'
                },
                {
                    name: 'Evening',
                    startAH: 18,
                    endAH: 24,
                    scaleFactor: scaleFactors.night,
                    color: '#3f51b5'
                }
            ]
        };
    }

    /**
     * Set location for solar calculations
     */
    setLocation(location) {
        if (typeof location === 'string' && this.cities[location]) {
            // Use preset city
            const city = this.cities[location];
            this.config.location = {
                lat: city.lat,
                lng: city.lng,
                name: city.name,
                timezone: city.tz
            };
        } else if (location.lat && location.lng) {
            // Use custom coordinates
            this.config.location = location;
        }

        // Clear cache to force recalculation
        this.solarCache.date = null;
        this.updateSolarTimes(new Date());
    }

    /**
     * Set designed day hours
     */
    setDesignedDayHours(hours) {
        this.config.designedDayHours = Math.max(1, Math.min(23, hours));
        this.config.autoAdjust = false; // Disable auto-adjust when manually set

        // Recalculate scale factors
        this.updateSolarTimes(new Date());
    }

    /**
     * Schedule daily update at midnight
     */
    scheduleDailyUpdate() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 1, 0); // 1 second after midnight

        const msUntilMidnight = tomorrow - now;

        setTimeout(() => {
            this.updateSolarTimes(new Date());
            this.scheduleDailyUpdate(); // Schedule next update
        }, msUntilMidnight);
    }

    /**
     * Get configuration UI data
     */
    getConfigUI() {
        // Ensure the cache is fresh for the current date
        this.updateSolarTimes(new Date());

        const { times, scaleFactors } = this.solarCache;

        return {
            fields: [
                {
                    type: 'select',
                    id: 'location',
                    label: 'Location',
                    options: Object.entries(this.cities).map(([key, city]) => ({
                        value: key,
                        label: city.name
                    })),
                    value: this.findCityKey()
                },
                {
                    type: 'slider',
                    id: 'designedDayHours',
                    label: 'Day Hours',
                    min: 1,
                    max: 23,
                    step: 0.5,
                    value: this.config.designedDayHours,
                    unit: 'hours'
                },
                {
                    type: 'checkbox',
                    id: 'autoAdjust',
                    label: 'Auto-adjust to actual daylight',
                    value: this.config.autoAdjust
                }
            ],
            solarInfo: {
                ...times,
                dayScaleFactor: scaleFactors.day,
                nightScaleFactor: scaleFactors.night
            }
        };
    }

    /**
     * Find city key from current location
     */
    findCityKey() {
        const currentLat = this.config.location.lat;
        const currentLng = this.config.location.lng;

        for (const [key, city] of Object.entries(this.cities)) {
            if (Math.abs(city.lat - currentLat) < 0.01 &&
                Math.abs(city.lng - currentLng) < 0.01) {
                return key;
            }
        }
        return 'custom';
    }

    /**
     * Handle configuration updates
     */
    updateConfig(updates) {
        if (updates.location) {
            this.setLocation(updates.location);
        }
        if (updates.designedDayHours !== undefined) {
            this.setDesignedDayHours(updates.designedDayHours);
        }
        if (updates.autoAdjust !== undefined) {
            this.config.autoAdjust = updates.autoAdjust;
            if (updates.autoAdjust) {
                this.updateSolarTimes(new Date());
            }
        }
    }

    /**
     * Export mode configuration
     */
    exportConfig() {
        return {
            mode: 'solar',
            location: this.config.location,
            designedDayHours: this.config.designedDayHours,
            autoAdjust: this.config.autoAdjust
        };
    }
}

// Export for module usage
export default SolarMode;