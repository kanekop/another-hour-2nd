/**
 * Solar Mode Core Implementation
 * Another Hour Project
 * 
 * This mode synchronizes time with the sun's movement,
 * always placing solar noon at 12:00 Another Hour time.
 */

import { BaseMode } from './BaseMode.js';

export class SolarModeV2 extends BaseMode {
    constructor() {
        super();
        this.id = 'solar';
        this.name = 'Solar Mode';
        this.description = 'Time flows with the sun - solar noon is always 12:00';
        
        // Default configuration
        this.defaultConfig = {
            location: {
                lat: 35.6762,  // Tokyo
                lng: 139.6503,
                name: 'Tokyo',
                timezone: 'Asia/Tokyo'
            },
            designedDayHours: 12,  // Will be updated based on actual daylight
            autoAdjust: true       // Auto-adjust to actual daylight hours
        };
        
        // Solar calculation cache
        this.solarCache = {
            date: null,
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
        this.config = { ...this.defaultConfig, ...config };
        this.updateSolarTimes(new Date());
        
        // Set up daily update at midnight
        this.scheduleDailyUpdate();
    }

    /**
     * Calculate solar times for a given date
     */
    updateSolarTimes(date) {
        const dateKey = date.toDateString();
        
        // Use cache if available for the same date
        if (this.solarCache.date === dateKey && this.solarCache.times) {
            return this.solarCache.times;
        }
        
        // Calculate new solar times using SunCalc
        const times = SunCalc.getTimes(date, this.config.location.lat, this.config.location.lng);
        
        // Calculate solar noon (midpoint between sunrise and sunset)
        const solarNoon = new Date((times.sunrise.getTime() + times.sunset.getTime()) / 2);
        
        // Calculate daylight and night durations
        const daylightMinutes = (times.sunset - times.sunrise) / 60000;
        const nightMinutes = 1440 - daylightMinutes;
        
        // Auto-adjust designed day hours if enabled
        if (this.config.autoAdjust) {
            this.config.designedDayHours = Math.round(daylightMinutes / 60);
        }
        
        // Calculate scale factors
        const designedNightHours = 24 - this.config.designedDayHours;
        const dayScaleFactor = this.config.designedDayHours / (daylightMinutes / 60);
        const nightScaleFactor = designedNightHours / (nightMinutes / 60);
        
        // Cache the results
        this.solarCache = {
            date: dateKey,
            times: {
                sunrise: times.sunrise,
                sunset: times.sunset,
                solarNoon: solarNoon,
                daylightMinutes: daylightMinutes,
                nightMinutes: nightMinutes
            },
            scaleFactors: {
                day: Math.max(0.1, Math.min(10, dayScaleFactor)),
                night: Math.max(0.1, Math.min(10, nightScaleFactor))
            }
        };
        
        return this.solarCache.times;
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
        const { times, scaleFactors } = this.solarCache;
        
        return {
            mode: 'solar',
            solarTimes: {
                sunrise: times.sunrise,
                sunset: times.sunset,
                solarNoon: times.solarNoon
            },
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
                sunrise: this.solarCache.times?.sunrise,
                sunset: this.solarCache.times?.sunset,
                daylight: this.solarCache.times?.daylightMinutes
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
export default SolarModeV2;