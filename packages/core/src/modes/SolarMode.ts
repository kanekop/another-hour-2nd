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
    private todaySolarTimes!: SunCalc.GetTimesResult;
    private yesterdaySolarTimes!: SunCalc.GetTimesResult;
    private tomorrowSolarTimes!: SunCalc.GetTimesResult;

    constructor(config: any) {
        super(config);
        const params = config.parameters as SolarModeParams;

        // パラメータの初期化
        this.location = params?.location || { city: 'Tokyo', latitude: 35.6762, longitude: 139.6503 }; // Default location
        this.dayHoursTarget = params?.dayHoursTarget || DEFAULT_VALUES.solar.dayHoursTarget;
        this.seasonalAdjustment = params?.seasonalAdjustment ?? DEFAULT_VALUES.solar.seasonalAdjustment;

        // 3日分の太陽情報を計算
        this.updateSolarTimes();
    }

    /**
     * 3日分の太陽時間情報を更新
     */
    private updateSolarTimes() {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        this.todaySolarTimes = SunCalc.getTimes(today, this.location.latitude, this.location.longitude);
        this.yesterdaySolarTimes = SunCalc.getTimes(yesterday, this.location.latitude, this.location.longitude);
        this.tomorrowSolarTimes = SunCalc.getTimes(tomorrow, this.location.latitude, this.location.longitude);
    }

    /**
     * スケールファクターを計算
     * @param {Date} currentTime
     * @returns {number}
     */
    calculateScaleFactor(currentTime: Date): number {
        const result = this.calculate(currentTime);
        return result.scaleFactor;
    }

    /**
     * 現在のフェーズ（期間）を取得
     * @param {Date} currentTime - 現在時刻
     * @returns {Object} { name: string, progress: number }
     */
    getCurrentPhase(currentTime: Date): { name: string, progress: number } {
        const result = this.calculate(currentTime);
        
        // 簡易的な進行状況計算
        const nowTs = currentTime.getTime();
        const sunriseTs = this.todaySolarTimes.sunrise.getTime();
        const sunsetTs = this.todaySolarTimes.sunset.getTime();
        
        let progress = 0;
        if (nowTs >= sunriseTs && nowTs < sunsetTs) {
            // Day phase
            progress = (nowTs - sunriseTs) / (sunsetTs - sunriseTs);
        } else {
            // Night phase - simplified calculation
            if (nowTs < sunriseTs) {
                const nightStartTs = this.yesterdaySolarTimes.sunset.getTime();
                progress = (nowTs - nightStartTs) / (sunriseTs - nightStartTs);
            } else {
                const nightEndTs = this.tomorrowSolarTimes.sunrise.getTime();
                progress = (nowTs - sunsetTs) / (nightEndTs - sunsetTs);
            }
        }
        
        return {
            name: result.periodName,
            progress: Math.max(0, Math.min(1, progress))
        };
    }


    /**
     * SolarMode用の計算ロジック（JavaScript版互換）
     */
    calculate(date: Date, timezone?: string): any {
        // 太陽時間を更新（日付が変わった可能性を考慮）
        this.updateSolarTimes();

        const { dayHoursTarget: designedDayHours } = { dayHoursTarget: this.dayHoursTarget };

        // --- 1. Get Critical Timestamps (milliseconds) ---
        const nowTs = date.getTime();
        const sunriseTs = this.todaySolarTimes.sunrise.getTime();
        const sunsetTs = this.todaySolarTimes.sunset.getTime();
        const solarNoonTs = this.todaySolarTimes.solarNoon.getTime();

        // --- 2. Designed Durations and Anchor Points in AH Minutes ---
        const designedDayMinutes = designedDayHours * 60;
        const designedNightMinutes = (24 - designedDayHours) * 60;
        const ahDayStartMinutes = 12 * 60 - designedDayMinutes / 2;
        const ahNoonMinutes = 12 * 60;
        const ahDayEndMinutes = 12 * 60 + designedDayMinutes / 2;

        // --- 3. Determine Phase and Calculate AH Time ---
        let ahTotalMinutes: number, scaleFactor: number, periodName: string;

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
            let nightStartTs: number, nightEndTs: number;
            if (nowTs < sunriseTs) {
                periodName = 'Night (Pre-dawn)';
                nightStartTs = this.yesterdaySolarTimes.sunset.getTime();
                nightEndTs = sunriseTs;
            } else { // nowTs >= sunsetTs
                periodName = 'Night (Evening)';
                nightStartTs = sunsetTs;
                nightEndTs = this.tomorrowSolarTimes.sunrise.getTime();
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
     * タイムライン用のセグメント情報を取得
     */
    getSegments() {
        const sunriseMinutes = this.todaySolarTimes.sunrise.getHours() * 60 + this.todaySolarTimes.sunrise.getMinutes();
        const sunsetMinutes = this.todaySolarTimes.sunset.getHours() * 60 + this.todaySolarTimes.sunset.getMinutes();

        const segments = [];

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

    /**
     * UI設定フォーム用のデータを取得
     */
    getConfigUI() {
        const sunTimes = {
            sunrise: this.todaySolarTimes.sunrise,
            solarNoon: this.todaySolarTimes.solarNoon,
            sunset: this.todaySolarTimes.sunset,
            daylightMinutes: (this.todaySolarTimes.sunset.getTime() - this.todaySolarTimes.sunrise.getTime()) / (1000 * 60)
        };

        return {
            location: this.location,
            dayHoursTarget: this.dayHoursTarget,
            seasonalAdjustment: this.seasonalAdjustment,
            solarInfo: sunTimes
        };
    }

    /**
     * UI設定フォームからデータを収集
     */
    collectConfigFromUI() {
        return {
            location: this.location,
            dayHoursTarget: this.dayHoursTarget,
            seasonalAdjustment: this.seasonalAdjustment
        };
    }

    /**
     * 設定の検証
     */
    validateConfig() {
        super.validateConfig();

        if (!this.location) {
            throw new Error('Location is required for Solar Mode');
        }

        if (this.location.latitude < -90 || this.location.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees');
        }

        if (this.location.longitude < -180 || this.location.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees');
        }

        if (this.dayHoursTarget < 1 || this.dayHoursTarget > 23) {
            throw new Error('Day hours target must be between 1 and 23');
        }
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
            default:
                ahTotalMinutes = 12 * 60; // Default to Solar Noon
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