// public/js/time-design/modes/SolarMode.js

import { BaseMode } from './BaseMode.js';

// City coordinates including IANA timezone names
const CITIES = {
  tokyo: { lat: 35.6895, lon: 139.6917, name: 'Tokyo', tz: 'Asia/Tokyo' },
  kumamoto: { lat: 32.8032, lon: 130.7079, name: 'Kumamoto', tz: 'Asia/Tokyo' },
  newyork: { lat: 40.7128, lon: -74.0060, name: 'New York', tz: 'America/New_York' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London', tz: 'Europe/London' },
};

/**
 * SolarMode - Time synchronized with sunrise and sunset cycles
 */
export class SolarMode extends BaseMode {
  constructor() {
    super(
      'solar',
      'Solar Mode',
      'Time synchronized with sunrise and sunset cycles',
      {
        city: {
          type: 'select',
          label: 'City',
          options: Object.entries(CITIES).map(([key, value]) => ({ value: key, text: value.name })),
          default: 'tokyo'
        },
        dayHours: {
          type: 'number',
          label: 'Day Hours',
          min: 1,
          max: 23,
          default: 12
        },
      }
    );
  }

  getDefaultConfig() {
    return {
      city: 'tokyo',
      dayHours: 12,
    };
  }

  validate(config) {
    const errors = [];
    if (!config.city || !CITIES[config.city]) {
      errors.push('Invalid city selected.');
    }
    if (config.dayHours === undefined || typeof config.dayHours !== 'number' || config.dayHours < 1 || config.dayHours > 23) {
      errors.push('Day Hours must be a number between 1 and 23.');
    }
    return { valid: errors.length === 0, errors };
  }

  _getMinutesInTimezone(date, timezone) {
    try {
      // Use en-GB for 24-hour format which is easier to parse
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const parts = formatter.formatToParts(date);
      const hourPart = parts.find(p => p.type === 'hour');
      const minutePart = parts.find(p => p.type === 'minute');

      // In some locales, hour can be '24', which needs to be handled as 0 for calculations.
      let hour = parseInt(hourPart.value, 10);
      if (hour === 24) hour = 0;

      const minute = parseInt(minutePart.value, 10);
      return hour * 60 + minute;
    } catch (e) {
      console.error(`Failed to format time for timezone ${timezone}:`, e);
      // Fallback to local time if Intl fails
      return date.getHours() * 60 + date.getMinutes();
    }
  }

  getCityData(cityKey) {
    return CITIES[cityKey];
  }

  getSunTimes(city, date = new Date()) {
    if (typeof SunCalc === 'undefined') {
      console.error('SunCalc.js library is not loaded. Solar Mode cannot function.');
      return null;
    }
    const coords = CITIES[city];
    if (!coords) return null;
    return SunCalc.getTimes(date, coords.lat, coords.lon);
  }

  _buildSegments(config) {
    const city = CITIES[config.city];
    if (!city) return [];

    const sunTimes = this.getSunTimes(config.city);
    if (!sunTimes) return [];

    const sunriseMinutes = this._getMinutesInTimezone(sunTimes.sunrise, city.tz);
    const sunsetMinutes = this._getMinutesInTimezone(sunTimes.sunset, city.tz);

    const actualDayDuration = sunsetMinutes - sunriseMinutes;
    const actualNightDuration = 1440 - actualDayDuration;

    if (actualDayDuration <= 0 || actualNightDuration <= 0) return [];

    const designedDayDuration = config.dayHours * 60;
    const designedNightDuration = (24 - config.dayHours) * 60;

    const dayScaleFactor = actualDayDuration > 0 ? designedDayDuration / actualDayDuration : 1;
    const nightScaleFactor = actualNightDuration > 0 ? designedNightDuration / actualNightDuration : 1;

    return [
      this.createSegment('night', 0, sunriseMinutes, nightScaleFactor, 'Night'),
      this.createSegment('day', sunriseMinutes, sunsetMinutes, dayScaleFactor, 'Day'),
      this.createSegment('night', sunsetMinutes, 1440, nightScaleFactor, 'Night'),
    ].filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const realMinutes = this._getMinutesInTimezone(date, timezone);
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(realMinutes, segments);

    if (!activeSegment) {
      return {
        hours: date.getHours(),
        minutes: date.getMinutes(),
        seconds: date.getSeconds(),
        scaleFactor: 1,
        isAnotherHour: false,
        segmentInfo: { type: 'error', label: 'Error' },
        periodName: 'Error'
      };
    }

    // Calculate the designed time
    let designedMinutesFromMidnight = 0;

    // Find all segments before the active one and sum up their designed durations
    for (const segment of segments) {
      if (segment === activeSegment) {
        // Add the scaled elapsed time within the active segment
        const elapsedInSegment = realMinutes - segment.startTime;
        designedMinutesFromMidnight += elapsedInSegment * segment.scaleFactor;
        break;
      } else {
        // Add the full designed duration of this segment
        designedMinutesFromMidnight += segment.duration * segment.scaleFactor;
      }
    }

    // Convert to hours, minutes, seconds
    const totalDesignedSeconds = designedMinutesFromMidnight * 60 + date.getSeconds() * activeSegment.scaleFactor;
    const displayHours = Math.floor(totalDesignedSeconds / 3600) % 24;
    const displayMinutes = Math.floor((totalDesignedSeconds % 3600) / 60);
    const displaySeconds = Math.floor(totalDesignedSeconds % 60);

    const { progress, remaining } = this.calculateProgress(realMinutes, activeSegment);

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: false,
      segmentInfo: {
        type: activeSegment.type,
        label: activeSegment.label,
        progress,
        remaining,
        duration: activeSegment.duration
      },
      periodName: activeSegment.label,
    };
  }

  // Method to get sun info for UI display
  getSunInfo(city, date = new Date()) {
    const sunTimes = this.getSunTimes(city, date);
    if (!sunTimes) return null;

    const durationMs = sunTimes.sunset - sunTimes.sunrise;
    const durationHours = durationMs / 3600000;

    return {
      sunrise: sunTimes.sunrise,
      sunset: sunTimes.sunset,
      daylightHours: durationHours
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SolarMode };
} else {
  window.SolarMode = SolarMode;
}