// SolarMode.js - Solar-based time with fixed solar noon at 12:00
import { BaseMode } from './BaseMode.js';

export class SolarMode extends BaseMode {
    constructor() {
        super();
        this.id = 'solar';
        this.name = 'Solar Mode';
        this.description = 'Time flows with the sun - solar noon is always 12:00';

        // Initialize solar cache
        this.solarCache = {
            date: null,
            times: null,
            scaleFactors: null,
            solarInfo: null
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
            autoAdjust: true
        };
    }

    /**
     * Get configuration schema
     */
    getConfigSchema() {
        return {
            location: {
                type: 'select',
                label: 'City',
                options: Object.entries(this.cities).map(([key, city]) => ({
                    value: key,
                    label: city.name
                })),
                default: 'tokyo'
            },
            designedDayHours: {
                type: 'slider',
                label: 'Day Hours',
                min: 1,
                max: 23,
                step: 0.5,
                default: 12,
                unit: 'hours'
            }
        };
    }

    /**
     * Calculate Another Hour time using Solar Mode
     */
    calculate(date, timezone, config) {
        this.config = { ...this.constructor.getDefaultConfig(), ...config };

        if (typeof SunCalc === 'undefined') {
            console.error('SunCalc.js library is not loaded.');
            const now = new Date();
            return {
                hours: now.getHours(), 
                minutes: now.getMinutes(), 
                seconds: now.getSeconds(),
                isError: true, 
                errorMessage: 'SunCalc library not loaded.'
            };
        }

        const ahResult = this.realToAnotherHour(date);

        return {
            hours: ahResult.hours,
            minutes: ahResult.minutes,
            seconds: ahResult.seconds,
            scaleFactor: ahResult.scaleFactor,
            isAnotherHour: true,
            segmentInfo: ahResult.segmentInfo,
            periodName: ahResult.segmentInfo.label,
        };
    }

    /**
     * Update solar times for a given date
     */
    updateSolarTimes(date) {
        const dateKey = date.toDateString();

        // Use cache if available
        if (this.solarCache.date === dateKey && this.solarCache.times) {
            return this.solarCache.times;
        }

        // Get location data
        const location = this.config.location;
        const lat = location.lat || location.latitude;
        const lng = location.lng || location.longitude;

        // Calculate solar times
        const times = SunCalc.getTimes(date, lat, lng);
        
        // Calculate solar noon (midpoint between sunrise and sunset)
        const solarNoon = new Date((times.sunrise.getTime() + times.sunset.getTime()) / 2);
        
        // Calculate daylight and night durations
        const daylightMinutes = (times.sunset - times.sunrise) / 60000;
        const nightMinutes = 1440 - daylightMinutes;

        // Auto-adjust if enabled
        if (this.config.autoAdjust) {
            this.config.designedDayHours = Math.round(daylightMinutes / 60);
        }

        // Store cache
        this.solarCache = {
            date: dateKey,
            times: {
                sunrise: times.sunrise,
                sunset: times.sunset,
                solarNoon: solarNoon,
                daylightMinutes: daylightMinutes,
                nightMinutes: nightMinutes,
                daylightHours: daylightMinutes / 60
            },
            scaleFactors: {
                day: 1.0, // Will be calculated per phase
                night: 1.0
            },
            solarInfo: {
                sunrise: times.sunrise,
                sunset: times.sunset,
                solarNoon: solarNoon,
                daylightHours: daylightMinutes / 60
            }
        };

        return this.solarCache.times;
    }

    /**
     * Convert real time to Another Hour time with solar noon at 12:00
     */
    realToAnotherHour(realTime) {
        this.updateSolarTimes(realTime);
        const { times } = this.solarCache;
        
        if (!times || !times.sunrise || !times.sunset) {
            // Fallback to real time if solar calculation fails
            return {
                hours: realTime.getHours(),
                minutes: realTime.getMinutes(),
                seconds: realTime.getSeconds(),
                scaleFactor: 1.0,
                segmentInfo: { label: 'Error', progress: 0 }
            };
        }

        // Determine current phase and calculate AH time
        let ahTime, scaleFactor, segmentInfo;
        
        // Get timestamps for easier comparison
        const currentTime = realTime.getTime();
        const sunrise = times.sunrise.getTime();
        const sunset = times.sunset.getTime();
        const solarNoon = times.solarNoon.getTime();
        
        // Calculate previous and next day boundaries
        const todayStart = new Date(realTime);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(realTime);
        todayEnd.setHours(23, 59, 59, 999);
        
        if (currentTime < sunrise) {
            // Night phase (midnight to sunrise) -> 0:00 to 6:00 AH
            const nightStart = todayStart.getTime();
            const nightDuration = sunrise - nightStart;
            const elapsed = currentTime - nightStart;
            const progress = elapsed / nightDuration;
            
            ahTime = progress * 6; // 0 to 6 hours
            scaleFactor = 6 / (nightDuration / 3600000); // AH hours / real hours
            segmentInfo = {
                label: 'Night (Pre-dawn)',
                phase: 'night',
                progress: progress,
                scaleFactor: scaleFactor
            };
            
        } else if (currentTime < solarNoon) {
            // Morning phase (sunrise to solar noon) -> 6:00 to 12:00 AH
            const morningDuration = solarNoon - sunrise;
            const elapsed = currentTime - sunrise;
            const progress = elapsed / morningDuration;
            
            ahTime = 6 + (progress * 6); // 6 to 12 hours
            scaleFactor = 6 / (morningDuration / 3600000);
            segmentInfo = {
                label: 'Day (Morning)',
                phase: 'day-morning',
                progress: progress,
                scaleFactor: scaleFactor
            };
            
        } else if (currentTime < sunset) {
            // Afternoon phase (solar noon to sunset) -> 12:00 to 18:00 AH
            const afternoonDuration = sunset - solarNoon;
            const elapsed = currentTime - solarNoon;
            const progress = elapsed / afternoonDuration;
            
            ahTime = 12 + (progress * 6); // 12 to 18 hours
            scaleFactor = 6 / (afternoonDuration / 3600000);
            segmentInfo = {
                label: 'Day (Afternoon)',
                phase: 'day-afternoon',
                progress: progress,
                scaleFactor: scaleFactor
            };
            
        } else {
            // Evening phase (sunset to midnight) -> 18:00 to 24:00 AH
            const eveningDuration = todayEnd.getTime() - sunset + 1;
            const elapsed = currentTime - sunset;
            const progress = elapsed / eveningDuration;
            
            ahTime = 18 + (progress * 6); // 18 to 24 hours
            scaleFactor = 6 / (eveningDuration / 3600000);
            segmentInfo = {
                label: 'Night (Evening)',
                phase: 'night',
                progress: progress,
                scaleFactor: scaleFactor
            };
        }
        
        // Convert decimal hours to hours, minutes, seconds
        const hours = Math.floor(ahTime);
        const minutes = Math.floor((ahTime - hours) * 60);
        const seconds = Math.floor(((ahTime - hours) * 60 - minutes) * 60);
        
        return {
            hours: hours % 24,
            minutes: minutes,
            seconds: seconds,
            scaleFactor: scaleFactor,
            segmentInfo: segmentInfo
        };
    }

    /**
     * Convert Another Hour time to real time
     */
    anotherHourToReal(ahHours, ahMinutes = 0, referenceDate = new Date()) {
        this.updateSolarTimes(referenceDate);
        const { times } = this.solarCache;
        
        if (!times || !times.sunrise || !times.sunset) {
            // Fallback if solar calculation fails
            return new Date(referenceDate);
        }
        
        const ahTotalHours = ahHours + (ahMinutes / 60);
        let realTime;
        
        // Calculate based on which phase the AH time falls into
        if (ahTotalHours < 6) {
            // 0:00-6:00 AH -> midnight to sunrise
            const progress = ahTotalHours / 6;
            const nightStart = new Date(referenceDate);
            nightStart.setHours(0, 0, 0, 0);
            const nightDuration = times.sunrise.getTime() - nightStart.getTime();
            realTime = new Date(nightStart.getTime() + progress * nightDuration);
            
        } else if (ahTotalHours < 12) {
            // 6:00-12:00 AH -> sunrise to solar noon
            const progress = (ahTotalHours - 6) / 6;
            const morningDuration = times.solarNoon.getTime() - times.sunrise.getTime();
            realTime = new Date(times.sunrise.getTime() + progress * morningDuration);
            
        } else if (ahTotalHours < 18) {
            // 12:00-18:00 AH -> solar noon to sunset
            const progress = (ahTotalHours - 12) / 6;
            const afternoonDuration = times.sunset.getTime() - times.solarNoon.getTime();
            realTime = new Date(times.solarNoon.getTime() + progress * afternoonDuration);
            
        } else {
            // 18:00-24:00 AH -> sunset to midnight
            const progress = (ahTotalHours - 18) / 6;
            const eveningEnd = new Date(referenceDate);
            eveningEnd.setHours(23, 59, 59, 999);
            const eveningDuration = eveningEnd.getTime() - times.sunset.getTime() + 1;
            realTime = new Date(times.sunset.getTime() + progress * eveningDuration);
        }
        
        return realTime;
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
        
        const daylightMs = times.sunset - times.sunrise;
        const daylightHours = daylightMs / 3600000;

        return {
            sunrise: times.sunrise,
            sunset: times.sunset,
            solarNoon: new Date((times.sunrise.getTime() + times.sunset.getTime()) / 2),
            daylightHours: daylightHours
        };
    }

    /**
     * Get config UI for Solar Mode
     */
    getConfigUI(config) {
        const currentCity = config.location.key || 'tokyo';
        const solarInfo = this.solarCache.solarInfo || {};

        return `
            <div class="config-section">
                <label for="solar-city">City:</label>
                <select id="solar-city" class="config-select">
                    ${Object.entries(this.cities).map(([key, city]) => 
                        `<option value="${key}" ${key === currentCity ? 'selected' : ''}>${city.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="solar-info">
                <div class="info-item">
                    <span class="info-label">Sunrise:</span>
                    <span id="sunrise-time" class="info-value">${solarInfo.sunrise ? 
                        new Date(solarInfo.sunrise).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                        }) : '--:--'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Sunset:</span>
                    <span id="sunset-time" class="info-value">${solarInfo.sunset ? 
                        new Date(solarInfo.sunset).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                        }) : '--:--'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Daylight:</span>
                    <span id="daylight-duration" class="info-value">${solarInfo.daylightHours ? 
                        `${Math.floor(solarInfo.daylightHours)}h ${Math.round((solarInfo.daylightHours % 1) * 60)}m` : 
                        '--h --m'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Solar Noon → 12:00 AH</span>
                </div>
            </div>
            
            <div class="config-section">
                <label for="solar-day-hours-slider">Day Hours:</label>
                <div id="solar-day-hours-slider" class="slider"></div>
                <span id="solar-day-hours-value" class="slider-value">${config.designedDayHours} hours</span>
            </div>
        `;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarMode };
}