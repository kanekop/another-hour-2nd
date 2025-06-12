// public/js/time-design/modes/SolarMode.js

import { BaseMode } from './BaseMode.js';

/**
 * SolarMode - Time based on sunrise and sunset
 * Day and night have different durations based on actual daylight
 */
export class SolarMode extends BaseMode {
  constructor() {
    super(
      'solar',
      'Solar Mode',
      'Sync your time with the sun - day and night follow natural light'
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      location: {
        latitude: 35.6762,  // Tokyo
        longitude: 139.6503,
        name: 'Tokyo, Japan',
        timezone: 'Asia/Tokyo'
      },
      dayNightRatio: {
        day: 12,   // Solar hours for daytime
        night: 12  // Solar hours for nighttime
      },
      transitionMode: 'sharp', // 'sharp' or 'twilight'
      twilightDuration: 30, // minutes
      seasonalAdjustment: 'dynamic', // 'dynamic' or 'fixed'
      fixedDate: null, // For fixed seasonal adjustment
      indoorMode: false, // Future: adjust for indoor lifestyle
      solarCache: {}, // Cache sunrise/sunset times
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];

    // Validate location
    if (!config.location || typeof config.location !== 'object') {
      errors.push('Location configuration is required');
    } else {
      if (typeof config.location.latitude !== 'number' || 
          config.location.latitude < -90 || 
          config.location.latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }

      if (typeof config.location.longitude !== 'number' || 
          config.location.longitude < -180 || 
          config.location.longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    // Validate day/night ratio
    if (!config.dayNightRatio || typeof config.dayNightRatio !== 'object') {
      errors.push('Day/night ratio configuration is required');
    } else {
      if (typeof config.dayNightRatio.day !== 'number' || 
          config.dayNightRatio.day < 1 || 
          config.dayNightRatio.day > 23) {
        errors.push('Day hours must be between 1 and 23');
      }

      if (typeof config.dayNightRatio.night !== 'number' || 
          config.dayNightRatio.night < 1 || 
          config.dayNightRatio.night > 23) {
        errors.push('Night hours must be between 1 and 23');
      }

      const total = config.dayNightRatio.day + config.dayNightRatio.night;
      if (total !== 24) {
        errors.push('Day and night hours must total 24');
      }
    }

    // Validate transition mode
    if (!['sharp', 'twilight'].includes(config.transitionMode)) {
      errors.push('Transition mode must be "sharp" or "twilight"');
    }

    // Validate seasonal adjustment
    if (!['dynamic', 'fixed'].includes(config.seasonalAdjustment)) {
      errors.push('Seasonal adjustment must be "dynamic" or "fixed"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate time based on solar position
   */
  calculate(date, timezone, config) {
    const now = new Date(date);

    // Get solar times for the date
    const solarTimes = this.getSolarTimes(now, config.location);

    // Determine if we're in day or night
    const timeInfo = this.getCurrentPhase(now, solarTimes, config);

    // Calculate scaled time within the phase
    const scaledTime = this.calculateScaledTime(timeInfo, config);

    // Build display time
    const displayTime = this.buildDisplayTime(scaledTime, timeInfo);

    return {
      hours: displayTime.hours,
      minutes: displayTime.minutes,
      seconds: displayTime.seconds,
      scaleFactor: timeInfo.scaleFactor,
      isAnotherHour: false, // Solar mode doesn't have Another Hour
      segmentInfo: {
        type: timeInfo.phase,
        label: timeInfo.phaseLabel,
        progress: timeInfo.phaseProgress,
        elapsed: timeInfo.phaseElapsed,
        duration: timeInfo.phaseDuration,
        remaining: timeInfo.phaseDuration - timeInfo.phaseElapsed,
        solarInfo: {
          sunrise: solarTimes.sunrise,
          sunset: solarTimes.sunset,
          solarNoon: solarTimes.solarNoon,
          dayLength: solarTimes.dayLength,
          nightLength: solarTimes.nightLength
        }
      },
      displayString: this.formatTime(displayTime.hours, displayTime.minutes, displayTime.seconds),
      periodName: timeInfo.phaseLabel,
      solarInfo: {
        ...solarTimes,
        currentPhase: timeInfo.phase,
        phaseStartTime: timeInfo.phaseStart,
        phaseEndTime: timeInfo.phaseEnd,
        location: config.location.name
      }
    };
  }

  /**
   * Calculate solar times for a given date and location
   */
  getSolarTimes(date, location) {
    const cacheKey = `${date.toDateString()}-${location.latitude}-${location.longitude}`;

    // Check cache first
    if (this.solarCache && this.solarCache[cacheKey]) {
      return this.solarCache[cacheKey];
    }

    // Calculate solar times (simplified algorithm - in production use a library like SunCalc)
    const times = this.calculateSolarTimes(date, location.latitude, location.longitude);

    // Cache the result
    if (!this.solarCache) {
      this.solarCache = {};
    }
    this.solarCache[cacheKey] = times;

    return times;
  }

  /**
   * Simplified solar calculation algorithm
   * In production, use a proper library like SunCalc.js
   */
  calculateSolarTimes(date, latitude, longitude) {
    // Julian date
    const JD = this.dateToJulian(date);

    // Calculate approximate times
    const n = JD - 2451545.0 + 0.0008;
    const Jstar = n - longitude / 360;
    const M = (357.5291 + 0.98560028 * Jstar) % 360;
    const C = 1.9148 * Math.sin(this.toRadians(M)) + 
              0.0200 * Math.sin(this.toRadians(2 * M)) + 
              0.0003 * Math.sin(this.toRadians(3 * M));
    const λ = (M + C + 180 + 102.9372) % 360;
    const Jtransit = 2451545.0 + Jstar + 0.0053 * Math.sin(this.toRadians(M)) - 
                     0.0069 * Math.sin(this.toRadians(2 * λ));

    // Declination
    const δ = Math.asin(Math.sin(this.toRadians(λ)) * Math.sin(this.toRadians(23.44)));

    // Hour angle
    const ω = Math.acos(-Math.tan(this.toRadians(latitude)) * Math.tan(δ));

    // Convert to times
    const Jrise = Jtransit - ω / (2 * Math.PI);
    const Jset = Jtransit + ω / (2 * Math.PI);

    // Convert Julian dates to JavaScript dates
    const sunrise = this.julianToDate(Jrise);
    const sunset = this.julianToDate(Jset);
    const solarNoon = this.julianToDate(Jtransit);

    // Calculate day and night lengths
    const dayLength = (sunset - sunrise) / (1000 * 60); // in minutes
    const nightLength = 1440 - dayLength; // in minutes

    return {
      sunrise,
      sunset,
      solarNoon,
      dayLength,
      nightLength,
      sunriseMinutes: sunrise.getHours() * 60 + sunrise.getMinutes(),
      sunsetMinutes: sunset.getHours() * 60 + sunset.getMinutes()
    };
  }

  /**
   * Determine current phase (day/night) and calculate position within it
   */
  getCurrentPhase(now, solarTimes, config) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const { sunriseMinutes, sunsetMinutes, dayLength, nightLength } = solarTimes;

    let phase, phaseStart, phaseEnd, phaseDuration, phaseElapsed;

    if (currentMinutes >= sunriseMinutes && currentMinutes < sunsetMinutes) {
      // Daytime
      phase = 'day';
      phaseStart = solarTimes.sunrise;
      phaseEnd = solarTimes.sunset;
      phaseDuration = dayLength;
      phaseElapsed = currentMinutes - sunriseMinutes;
    } else {
      // Nighttime
      phase = 'night';
      if (currentMinutes >= sunsetMinutes) {
        // Night of current day
        phaseStart = solarTimes.sunset;
        phaseEnd = new Date(solarTimes.sunrise);
        phaseEnd.setDate(phaseEnd.getDate() + 1);
        phaseElapsed = currentMinutes - sunsetMinutes;
      } else {
        // Early morning (before sunrise)
        phaseStart = new Date(solarTimes.sunset);
        phaseStart.setDate(phaseStart.getDate() - 1);
        phaseEnd = solarTimes.sunrise;
        phaseElapsed = currentMinutes + (1440 - sunsetMinutes);
      }
      phaseDuration = nightLength;
    }

    // Calculate scale factor
    const targetHours = config.dayNightRatio[phase];
    const actualHours = phaseDuration / 60;
    const scaleFactor = targetHours / actualHours;

    // Calculate progress
    const phaseProgress = (phaseElapsed / phaseDuration) * 100;

    return {
      phase,
      phaseLabel: phase === 'day' ? '☀️ Solar Day' : '🌙 Solar Night',
      phaseStart,
      phaseEnd,
      phaseDuration,
      phaseElapsed,
      phaseProgress,
      scaleFactor
    };
  }

  /**
   * Calculate scaled time within the current phase
   */
  calculateScaledTime(timeInfo, config) {
    const scaledElapsed = timeInfo.phaseElapsed * timeInfo.scaleFactor;
    const baseHour = timeInfo.phase === 'day' ? 0 : config.dayNightRatio.day;

    return {
      scaledElapsed,
      baseHour,
      totalScaledMinutes: baseHour * 60 + scaledElapsed
    };
  }

  /**
   * Build display time from scaled time
   */
  buildDisplayTime(scaledTime, timeInfo) {
    const totalMinutes = scaledTime.totalScaledMinutes;

    return {
      hours: Math.floor(totalMinutes / 60) % 24,
      minutes: Math.floor(totalMinutes % 60),
      seconds: Math.floor((totalMinutes * 60) % 60)
    };
  }

  /**
   * Helper: Convert date to Julian date
   */
  dateToJulian(date) {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;

    const JDN = date.getDate() + Math.floor((153 * m + 2) / 5) + 
                365 * y + Math.floor(y / 4) - Math.floor(y / 100) + 
                Math.floor(y / 400) - 32045;

    const JD = JDN + (date.getHours() - 12) / 24 + 
               date.getMinutes() / 1440 + date.getSeconds() / 86400;

    return JD;
  }

  /**
   * Helper: Convert Julian date to JavaScript date
   */
  julianToDate(JD) {
    const X = JD + 0.5;
    const Z = Math.floor(X);
    const F = X - Z;
    const A = Z;
    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);

    const day = B - D - Math.floor(30.6001 * E) + F;
    const month = E < 14 ? E - 1 : E - 13;
    const year = month > 2 ? C - 4716 : C - 4715;

    const date = new Date(year, month - 1, Math.floor(day));
    const dayFraction = day - Math.floor(day);
    const hours = dayFraction * 24;
    const minutes = (hours - Math.floor(hours)) * 60;
    const seconds = (minutes - Math.floor(minutes)) * 60;

    date.setHours(Math.floor(hours), Math.floor(minutes), Math.floor(seconds));

    return date;
  }

  /**
   * Helper: Convert degrees to radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get seasonal variation info
   */
  getSeasonalInfo(location, date) {
    // Calculate for solstices and current date
    const summerSolstice = new Date(date.getFullYear(), 5, 21); // June 21
    const winterSolstice = new Date(date.getFullYear(), 11, 21); // December 21

    const summerTimes = this.getSolarTimes(summerSolstice, location);
    const winterTimes = this.getSolarTimes(winterSolstice, location);
    const currentTimes = this.getSolarTimes(date, location);

    return {
      current: {
        dayLength: currentTimes.dayLength,
        nightLength: currentTimes.nightLength
      },
      summer: {
        dayLength: summerTimes.dayLength,
        nightLength: summerTimes.nightLength
      },
      winter: {
        dayLength: winterTimes.dayLength,
        nightLength: winterTimes.nightLength
      },
      variation: {
        hours: Math.abs(summerTimes.dayLength - winterTimes.dayLength) / 60,
        percentage: ((summerTimes.dayLength - winterTimes.dayLength) / winterTimes.dayLength) * 100
      }
    };
  }
}
// SolarMode.js - Solar Mode implementation
import { BaseMode } from './BaseMode.js';

export class SolarMode extends BaseMode {
  getName() {
    return 'solar';
  }

  getDisplayName() {
    return 'Solar Mode';
  }

  getDescription() {
    return 'Time synchronized with sunrise and sunset cycles';
  }

  getDefaultConfig() {
    return {
      latitude: 35.6762,
      longitude: 139.6503,
      dayScaleFactor: 1.0,
      nightScaleFactor: 1.5
    };
  }

  getConfigSchema() {
    return {
      latitude: {
        type: 'number',
        label: 'Latitude',
        min: -90,
        max: 90,
        step: 0.0001,
        default: 35.6762
      },
      longitude: {
        type: 'number',
        label: 'Longitude',
        min: -180,
        max: 180,
        step: 0.0001,
        default: 139.6503
      },
      dayScaleFactor: {
        type: 'number',
        label: 'Day Scale Factor',
        min: 0.5,
        max: 3.0,
        step: 0.1,
        default: 1.0
      },
      nightScaleFactor: {
        type: 'number',
        label: 'Night Scale Factor',
        min: 0.5,
        max: 3.0,
        step: 0.1,
        default: 1.5
      }
    };
  }

  calculateSunTimes(date, latitude, longitude) {
    // Simplified sunrise/sunset calculation
    // Note: This is a basic approximation, real implementation would use a proper solar calculation library
    
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
    const P = Math.asin(.39795 * Math.cos(.98563 * (dayOfYear - 173) * Math.PI / 180));
    const argument = Math.tan(latitude * Math.PI / 180) * Math.tan(P);
    
    // Handle polar regions
    if (Math.abs(argument) > 1) {
      return {
        sunrise: argument > 1 ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0),
        sunset: argument > 1 ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59) : null
      };
    }
    
    const sunriseHour = 12 - 12 * Math.acos(argument) / Math.PI;
    const sunsetHour = 12 + 12 * Math.acos(argument) / Math.PI;
    
    const sunrise = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(sunriseHour), (sunriseHour % 1) * 60);
    const sunset = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(sunsetHour), (sunsetHour % 1) * 60);
    
    return { sunrise, sunset };
  }

  calculateAngles(date, timezone, config) {
    const {
      latitude = 35.6762,
      longitude = 139.6503,
      dayScaleFactor = 1.0,
      nightScaleFactor = 1.5
    } = config;
    
    if (latitude === undefined || longitude === undefined) {
      throw new Error('Location (latitude/longitude) must be configured for Solar Mode');
    }
    
    const now = new Date(date);
    const { sunrise, sunset } = this.calculateSunTimes(now, latitude, longitude);
    
    let scaleFactor = 1.0;
    let isDaytime = false;
    
    if (sunrise && sunset) {
      isDaytime = now >= sunrise && now < sunset;
      scaleFactor = isDaytime ? dayScaleFactor : nightScaleFactor;
    }
    
    // Get current time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Apply scaling
    const totalSecondsInDay = hours * 3600 + minutes * 60 + seconds;
    const scaledSeconds = totalSecondsInDay * scaleFactor;
    
    const aphHours = Math.floor(scaledSeconds / 3600) % 24;
    const aphMinutes = Math.floor((scaledSeconds % 3600) / 60);
    const aphSecondsRemainder = scaledSeconds % 60;
    
    // Calculate angles
    const hourAngle = this.normalizeAngle((aphHours % 12) * 30 + aphMinutes * 0.5 + aphSecondsRemainder * (0.5 / 60));
    const minuteAngle = this.normalizeAngle(aphMinutes * 6 + aphSecondsRemainder * 0.1);
    const secondAngle = this.normalizeAngle(aphSecondsRemainder * 6);
    
    return {
      hourAngle,
      minuteAngle,
      secondAngle,
      aphHours,
      aphMinutes,
      aphSeconds: aphSecondsRemainder,
      scaleFactor,
      isPersonalizedAhPeriod: scaleFactor !== 1.0,
      isDaytime,
      sunrise: sunrise?.toLocaleTimeString(),
      sunset: sunset?.toLocaleTimeString()
    };
  }
}
