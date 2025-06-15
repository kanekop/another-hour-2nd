import { BaseMode } from './BaseMode.js';
import { SolarModeParams, UserSettings, Location, DEFAULT_VALUES } from '../types/time-modes.js';
import * as SunCalc from 'suncalc';

/**
 * Solar Mode の実装
 * 太陽の動きに基づいて時間を再定義するモード
 */
export class SolarMode extends BaseMode {
    // Parameters
    location: Location;
    dayHoursTarget: number;
    seasonalAdjustment: boolean;

    // Calculated solar data
    private todaySolarTimes: SunCalc.GetTimesResult;
    private yesterdaySolarTimes: SunCalc.GetTimesResult;
    private tomorrowSolarTimes: SunCalc.GetTimesResult;

    constructor(config: any) {
        super(config);
        const params = config.parameters as SolarModeParams;

        // パラメータの初期化
        this.location = params?.location || { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 }; // Default location
        this.dayHoursTarget = params?.dayHoursTarget || DEFAULT_VALUES.solar.dayHoursTarget;
        this.seasonalAdjustment = params?.seasonalAdjustment ?? DEFAULT_VALUES.solar.seasonalAdjustment;

        // 3日分の太陽情報を計算
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        this.todaySolarTimes = SunCalc.getTimes(today, this.location.latitude, this.location.longitude);
        this.yesterdaySolarTimes = SunCalc.getTimes(yesterday, this.location.latitude, this.location.longitude);
        this.tomorrowSolarTimes = SunCalc.getTimes(tomorrow, this.location.latitude, this.location.longitude);
    }

    validateConfig(): void {
        super.validateConfig();
        if (this.dayHoursTarget < 1 || this.dayHoursTarget > 23) {
            throw new Error('Day Hours Target must be between 1 and 23.');
        }
        if (!this.location.latitude || !this.location.longitude) {
            throw new Error('Location with latitude and longitude is required.');
        }
    }

    getCurrentPhase(currentTime: Date): { name: 'Day (AM)' | 'Day (PM)' | 'Night (Part 1)' | 'Night (Part 2)'; progress: number; } {
        const { sunrise, sunset } = this.todaySolarTimes;
        const previousSunset = this.yesterdaySolarTimes.sunset;

        if (currentTime >= sunrise && currentTime < sunset) {
            const solarNoon = this.todaySolarTimes.solarNoon;
            if (currentTime <= solarNoon) {
                const phaseDuration = solarNoon.getTime() - sunrise.getTime();
                const elapsed = currentTime.getTime() - sunrise.getTime();
                return { name: 'Day (AM)', progress: phaseDuration > 0 ? elapsed / phaseDuration : 1 };
            } else {
                const phaseDuration = sunset.getTime() - solarNoon.getTime();
                const elapsed = currentTime.getTime() - solarNoon.getTime();
                return { name: 'Day (PM)', progress: phaseDuration > 0 ? elapsed / phaseDuration : 1 };
            }
        } else if (currentTime < sunrise) { // Night Part 2 (after midnight)
            const phaseDuration = sunrise.getTime() - previousSunset.getTime();
            const elapsed = currentTime.getTime() - previousSunset.getTime();
            return { name: 'Night (Part 2)', progress: phaseDuration > 0 ? elapsed / phaseDuration : 1 };
        } else { // Night Part 1 (before midnight)
            const nextSunrise = this.tomorrowSolarTimes.sunrise;
            const phaseDuration = nextSunrise.getTime() - sunset.getTime();
            const elapsed = currentTime.getTime() - sunset.getTime();
            return { name: 'Night (Part 1)', progress: phaseDuration > 0 ? elapsed / phaseDuration : 1 };
        }
    }

    calculateScaleFactor(currentTime: Date): number {
        const nightHoursTarget = 24 - this.dayHoursTarget;

        const actualDayDuration = (this.todaySolarTimes.sunset.getTime() - this.todaySolarTimes.sunrise.getTime()) / (1000 * 60 * 60);
        const actualNightDuration = 24 - actualDayDuration;

        if (actualDayDuration <= 0 || actualNightDuration <= 0) return 1.0;

        const phase = this.getCurrentPhase(currentTime);
        let scaleFactor = 1.0;

        if (phase.name.startsWith('Day')) {
            scaleFactor = this.dayHoursTarget / actualDayDuration;
        } else {
            scaleFactor = nightHoursTarget / actualNightDuration;
        }

        // Apply limits
        return Math.max(0.1, Math.min(scaleFactor, 10.0));
    }

    calculateAnotherHourTime(realTime: Date): Date {
        const phase = this.getCurrentPhase(realTime);
        const { progress } = phase;

        const AH_SUNRISE = 6 * 60;    // 06:00
        const AH_SOLAR_NOON = 12 * 60; // 12:00
        const AH_SUNSET = 18 * 60;   // 18:00
        const AH_MIDNIGHT = 24 * 60;

        let ahTotalMinutes;

        switch (phase.name) {
            case 'Day (AM)': // Sunrise -> Solar Noon
                ahTotalMinutes = AH_SUNRISE + progress * (AH_SOLAR_NOON - AH_SUNRISE);
                break;
            case 'Day (PM)': // Solar Noon -> Sunset
                ahTotalMinutes = AH_SOLAR_NOON + progress * (AH_SUNSET - AH_SOLAR_NOON);
                break;
            case 'Night (Part 1)': // Sunset -> Midnight
                // The duration of this part in AH hours is half of the total night hours
                ahTotalMinutes = AH_SUNSET + progress * (AH_MIDNIGHT - AH_SUNSET);
                break;
            case 'Night (Part 2)': // Midnight -> Sunrise
                // This wraps around midnight in AH time
                ahTotalMinutes = 0 + progress * (AH_SUNRISE - 0);
                break;
        }

        const ahTime = new Date(realTime);
        ahTime.setUTCHours(Math.floor(ahTotalMinutes / 60) % 24, Math.floor(ahTotalMinutes % 60), Math.floor((ahTotalMinutes * 60) % 60));
        return ahTime;
    }

    convertToRealTime(anotherHourTime: Date): Date {
        const ahTotalMinutes = anotherHourTime.getUTCHours() * 60 + anotherHourTime.getUTCMinutes() + anotherHourTime.getUTCSeconds() / 60;

        const AH_SUNRISE = 6 * 60;
        const AH_SOLAR_NOON = 12 * 60;
        const AH_SUNSET = 18 * 60;

        const { sunrise, sunset, solarNoon } = this.todaySolarTimes;
        const previousSunset = this.yesterdaySolarTimes.sunset;
        const nextSunrise = this.tomorrowSolarTimes.sunrise;

        let realTimeMs;
        let progress;

        if (ahTotalMinutes < AH_SUNRISE) { // Night (Part 2): 00:00 -> 06:00
            progress = ahTotalMinutes / AH_SUNRISE;
            realTimeMs = previousSunset.getTime() + progress * (sunrise.getTime() - previousSunset.getTime());
        } else if (ahTotalMinutes < AH_SOLAR_NOON) { // Day (AM): 06:00 -> 12:00
            progress = (ahTotalMinutes - AH_SUNRISE) / (AH_SOLAR_NOON - AH_SUNRISE);
            realTimeMs = sunrise.getTime() + progress * (solarNoon.getTime() - sunrise.getTime());
        } else if (ahTotalMinutes < AH_SUNSET) { // Day (PM): 12:00 -> 18:00
            progress = (ahTotalMinutes - AH_SOLAR_NOON) / (AH_SUNSET - AH_SOLAR_NOON);
            realTimeMs = solarNoon.getTime() + progress * (sunset.getTime() - solarNoon.getTime());
        } else { // Night (Part 1): 18:00 -> 24:00
            progress = (ahTotalMinutes - AH_SUNSET) / (24 * 60 - AH_SUNSET);
            realTimeMs = sunset.getTime() + progress * (nextSunrise.getTime() - sunset.getTime());
        }

        return new Date(realTimeMs);
    }

    getDebugInfo(currentTime: Date): Record<string, any> {
        return {
            mode: this.config.mode,
            config: this.exportConfig(),
            location: this.location,
            dayHoursTarget: this.dayHoursTarget,
            solarTimes: {
                sunrise: this.todaySolarTimes.sunrise.toLocaleString(),
                sunset: this.todaySolarTimes.sunset.toLocaleString(),
                solarNoon: this.todaySolarTimes.solarNoon.toLocaleString(),
            },
            scaleFactor: this.calculateScaleFactor(currentTime),
            currentPhase: this.getCurrentPhase(currentTime),
        };
    }
} 