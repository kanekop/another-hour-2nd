// SolarMode.js - Time based on solar cycles

import { BaseMode } from './BaseMode.js';

export const CITIES = {
  'tokyo': { name: 'Tokyo', lat: 35.6895, lon: 139.6917 },
  'kumamoto': { name: 'Kumamoto', lat: 32.8032, lon: 130.7079 },
  'new-york': { name: 'New York', lat: 40.7128, lon: -74.0060 },
  'london': { name: 'London', lat: 51.5074, lon: -0.1278 },
};

/**
 * SolarMode - Time synchronized with sunrise and sunset cycles
 * This is a placeholder implementation.
 * It requires a library or API to get sunrise/sunset times for a given location.
 */
export class SolarMode extends BaseMode {
  constructor() {
    super(
      'solar',
      'Solar Mode',
      'Time synchronized with sunrise and sunset cycles. (Location features coming soon)',
      {
        location: { type: 'select', label: 'City', options: CITIES, default: 'tokyo' },
        dayHours: { type: 'number', label: 'Day Hours', min: 1, max: 23, default: 12 },
      }
    );
  }

  getDefaultConfig() {
    return {
      location: 'tokyo',
      dayHours: 12,
    };
  }

  validate(config) {
    const errors = [];
    if (config.dayHours === undefined || typeof config.dayHours !== 'number' || config.dayHours < 1 || config.dayHours > 23) {
      errors.push('Day Hours must be a number between 1 and 23.');
    }
    if (config.location === undefined || !CITIES[config.location]) {
      errors.push('Invalid location selected.');
    }
    return { valid: errors.length === 0, errors };
  }

  // This is a simplified placeholder. A real implementation would use a library
  // like SunCalc.js or an API call.
  _getSunriseSunset(date, lat, lon) {
    if (typeof SunCalc === 'undefined') {
      console.warn('SunCalc.js is not loaded. Using fallback sunrise/sunset times.');
      // Fallback: Fixed sunrise/sunset for simplicity
      const sunrise = 6 * 60; // 6:00 AM
      const sunset = 18 * 60; // 6:00 PM
      return { sunrise, sunset };
    }

    const times = SunCalc.getTimes(date, lat, lon);
    const sunrise = this.getMinutesSinceMidnight(times.sunrise, 'UTC'); // SunCalc returns UTC dates
    const sunset = this.getMinutesSinceMidnight(times.sunset, 'UTC');
    return { sunrise, sunset };
  }

  _buildSegments(config, date) {
    const city = CITIES[config.location] || CITIES['tokyo'];
    const { sunrise, sunset } = this._getSunriseSunset(date, city.lat, city.lon);
    const dayDuration = sunset - sunrise;
    const nightDuration = 1440 - dayDuration;

    const configuredDayMinutes = (config.dayHours || 12) * 60;
    const configuredNightMinutes = (24 - (config.dayHours || 12)) * 60;

    const dayScaleFactor = dayDuration > 0 ? configuredDayMinutes / dayDuration : 1;
    const nightScaleFactor = nightDuration > 0 ? configuredNightMinutes / nightDuration : 1;

    const segments = [
      this.createSegment('night', 0, sunrise, nightScaleFactor, 'Night (Scaled)'),
      this.createSegment('day', sunrise, sunset, dayScaleFactor, 'Daylight (Scaled)'),
      this.createSegment('night', sunset, 1440, nightScaleFactor, 'Night (Scaled)'),
    ];

    return segments.filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config, date);
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds(), scaleFactor: 1, isAnotherHour: true, segmentInfo: { type: 'another', label: 'Error' } };
    }

    let scaledTime = 0;
    // Calculate total scaled minutes passed before this segment
    for (const seg of segments) {
      if (seg.endTime <= activeSegment.startTime) {
        scaledTime += seg.duration * seg.scaleFactor;
      }
    }

    const segmentElapsed = minutes - activeSegment.startTime;
    scaledTime += segmentElapsed * activeSegment.scaleFactor;

    const displayHours = Math.floor(scaledTime / 60) % 24;
    const displayMinutes = Math.floor(scaledTime % 60);
    const displaySeconds = Math.floor((scaledTime * 60) % 60);

    const { progress, remaining } = this.calculateProgress(minutes, activeSegment);

    const isDesigned = activeSegment.type === 'day';

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: !isDesigned,
      segmentInfo: { type: isDesigned ? 'designed' : 'another', label: activeSegment.label, progress, remaining, duration: activeSegment.duration },
      periodName: activeSegment.label,
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SolarMode };
} else {
  window.SolarMode = SolarMode;
}