// public/js/time-design/modes/SolarMode.js

import { BaseMode } from './BaseMode.js';

// City coordinates
const CITIES = {
  tokyo: { lat: 35.6895, lon: 139.6917, name: 'Tokyo' },
  kumamoto: { lat: 32.8032, lon: 130.7079, name: 'Kumamoto' },
  newyork: { lat: 40.7128, lon: -74.0060, name: 'New York' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London' },
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

  getSunTimes(city, date = new Date()) {
    if (typeof SunCalc === 'undefined') {
      console.error('SunCalc.js library is not loaded. Solar Mode cannot function.');
      return null;
    }
    const coords = CITIES[city];
    if (!coords) return null;
    return SunCalc.getTimes(date, coords.lat, coords.lon);
  }

  _buildSegments(config, date = new Date()) {
    const sunTimes = this.getSunTimes(config.city, date);
    if (!sunTimes) return [];

    const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
    const sunsetMinutes = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes();

    const actualDayDuration = sunsetMinutes - sunriseMinutes;
    const actualNightDuration = 1440 - actualDayDuration;

    if (actualDayDuration <= 0 || actualNightDuration <= 0) return [];

    const designedDayDuration = config.dayHours * 60;
    const designedNightDuration = (24 - config.dayHours) * 60;

    const dayScaleFactor = designedDayDuration / actualDayDuration;
    const nightScaleFactor = designedNightDuration / actualNightDuration;

    return [
      this.createSegment('night', 0, sunriseMinutes, nightScaleFactor, 'Night (Before Dawn)'),
      this.createSegment('day', sunriseMinutes, sunsetMinutes, dayScaleFactor, 'Day'),
      this.createSegment('night', sunsetMinutes, 1440, nightScaleFactor, 'Night (After Dusk)'),
    ].filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const realMinutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config, date);
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