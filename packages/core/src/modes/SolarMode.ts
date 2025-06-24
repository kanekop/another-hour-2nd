import { BaseMode } from './BaseMode.js';
import { SolarModeParams, UserSettings, Location, DEFAULT_VALUES } from '../types/time-modes.js';
import * as SunCalc from 'suncalc';

/**
 * Solar Mode の実装
 * 太陽の動きに基づいて時間を再定義するモード
 */
export class SolarMode extends BaseMode {
    static modeId = 'solar';
    static modeName = 'Solar';
    static description = 'Aligns the day with solar events like sunrise and sunset, scaling day and night independently.';

    static defaultParameters = {
        location: {
            key: 'tokyo',
            name: 'Tokyo',
            latitude: 35.6895,
            longitude: 139.6917,
            tz: 'Asia/Tokyo'
        },
        designedDayHours: 12,
    };

    private location: Location;
    private designedDayHours: number;

    constructor(config: any) {
        super(config);
        const params = { ...SolarMode.defaultParameters, ...config.parameters };
        this.location = params.location;
        this.designedDayHours = params.designedDayHours;
        this.validateConfig();
    }

    validateConfig() {
        if (!this.location || typeof this.location.latitude !== 'number' || typeof this.location.longitude !== 'number') {
            throw new Error('SolarMode requires a valid location with latitude and longitude.');
        }
        if (this.designedDayHours < 1 || this.designedDayHours > 23) {
            throw new Error('Designed Day Hours must be between 1 and 23.');
        }
    }

    private getSunlightTimes(date: Date) {
        return SunCalc.getTimes(date, this.location.latitude, this.location.longitude);
    }

    getSolarInfo(date: Date = new Date()) {
        return this.getSunlightTimes(date);
    }

    getCurrentPhase(currentTime: Date): { name: string; progress: number } {
        const times = this.getSunlightTimes(currentTime);
        const { sunrise, sunset } = times;

        const yesterday = new Date(currentTime);
        yesterday.setDate(currentTime.getDate() - 1);
        const yesterdayTimes = this.getSunlightTimes(yesterday);

        if (currentTime >= sunrise && currentTime < sunset) {
            const duration = sunset.getTime() - sunrise.getTime();
            const elapsed = currentTime.getTime() - sunrise.getTime();
            return { name: 'Day', progress: duration > 0 ? elapsed / duration : 0 };
        } else {
            let phaseStart, phaseEnd;
            if (currentTime < sunrise) { // Night part after midnight
                phaseStart = yesterdayTimes.sunset;
                phaseEnd = sunrise;
            } else { // Night part before midnight
                const tomorrow = new Date(currentTime);
                tomorrow.setDate(currentTime.getDate() + 1);
                const tomorrowTimes = this.getSunlightTimes(tomorrow);
                phaseStart = sunset;
                phaseEnd = tomorrowTimes.sunrise;
            }
            const duration = phaseEnd.getTime() - phaseStart.getTime();
            const elapsed = currentTime.getTime() - phaseStart.getTime();
            return { name: 'Night', progress: duration > 0 ? elapsed / duration : 0 };
        }
    }

    calculateScaleFactor(currentTime: Date): number {
        const times = this.getSunlightTimes(currentTime);
        const actualDayDurationHours = (times.sunset.getTime() - times.sunrise.getTime()) / 3600000;
        const actualNightDurationHours = 24 - actualDayDurationHours;

        if (actualDayDurationHours <= 0 || actualNightDurationHours <= 0) return 1.0;

        const phase = this.getCurrentPhase(currentTime);
        if (phase.name === 'Day') {
            return this.designedDayHours / actualDayDurationHours;
        } else { // Night
            const designedNightHours = 24 - this.designedDayHours;
            return designedNightHours / actualNightDurationHours;
        }
    }

    calculateAnotherHourTime(realTime: Date): Date {
        const times = this.getSunlightTimes(realTime);
        const phase = this.getCurrentPhase(realTime);

        const dayStartInAH = (24 - this.designedDayHours) / 2;

        let ahMinutes;

        if (phase.name === 'Day') {
            const ahDayDuration = this.designedDayHours * 60;
            ahMinutes = dayStartInAH * 60 + phase.progress * ahDayDuration;
        } else { // Night
            const ahNightDuration = (24 - this.designedDayHours) * 60;
            // Night progress is split before and after the day segment
            const nightStartInAH = (dayStartInAH + this.designedDayHours);
            const progressIntoNight = phase.progress * ahNightDuration;

            if (realTime > times.sunset) { // night part 1 (evening)
                ahMinutes = (nightStartInAH * 60) + progressIntoNight;
            } else { // night part 2 (morning)
                ahMinutes = progressIntoNight - ((24 - nightStartInAH) * 60);
                if (ahMinutes < 0) ahMinutes += 1440;
            }
        }

        // Handle potential floating point inaccuracies at boundaries
        ahMinutes = (ahMinutes + 1440) % 1440;

        const ahTime = new Date(0);
        ahTime.setUTCMinutes(ahMinutes);
        return ahTime;
    }

    convertToRealTime(anotherHourTime: Date): Date {
        // This is complex and not required for the test UI functionality.
        // Returning the input for now to avoid errors.
        return anotherHourTime;
    }

    getDebugInfo(currentTime: Date): Record<string, any> {
        const times = this.getSunlightTimes(currentTime);
        return {
            ...super.getDebugInfo(currentTime),
            location: this.location,
            designedDayHours: this.designedDayHours,
            solarTimes: {
                sunrise: times.sunrise.toLocaleTimeString(),
                sunset: times.sunset.toLocaleTimeString(),
                solarNoon: times.solarNoon.toLocaleTimeString(),
            },
        };
    }

    getTimelineSegments() {
        const times = this.getSunlightTimes(new Date());
        const toPercent = (date: Date) => (date.getHours() * 60 + date.getMinutes()) / 1440 * 100;

        return [
            { name: 'Night', start: 0, end: toPercent(times.dawn), color: '#1A237E', label: 'Night' },
            { name: 'Sunrise', start: toPercent(times.dawn), end: toPercent(times.sunriseEnd), color: '#FFB300', label: 'Sunrise' },
            { name: 'Daylight', start: toPercent(times.sunriseEnd), end: toPercent(times.sunsetStart), color: '#FFD600', label: 'Daylight' },
            { name: 'Sunset', start: toPercent(times.sunsetStart), end: toPercent(times.dusk), color: '#D32F2F', label: 'Sunset' },
            { name: 'Night', start: toPercent(times.dusk), end: 100, color: '#1A237E', label: 'Night' },
        ];
    }

    static getConfigSchema() {
        return {
            designedDayHours: {
                type: 'slider',
                label: 'Designed Day Hours',
                min: 1,
                max: 23,
                step: 0.5,
                default: this.defaultParameters.designedDayHours,
                unit: 'h'
            }
        };
    }

    exportConfig() {
        return {
            ...super.exportConfig(),
            parameters: {
                location: this.location,
                designedDayHours: this.designedDayHours,
            }
        };
    }
} 