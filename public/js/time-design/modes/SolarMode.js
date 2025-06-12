// SolarMode.js - A day synchronized with sunrise and sunset.

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
        city: {
          type: 'select',
          label: 'City',
          options: [
            { value: 'tokyo', text: 'Tokyo' },
            { value: 'kumamoto', text: 'Kumamoto' },
            { value: 'newyork', text: 'New York' },
            { value: 'london', text: 'London' }
          ],
          default: 'tokyo'
        },
        dayHours: { type: 'number', label: 'Day Hours', min: 1, max: 23, default: 12 },
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

  _buildSegments(config) {
    const sunTimes = this.getSunTimes(config.city);
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
      this.createSegment('night', 0, sunriseMinutes, nightScaleFactor, 'Night'),
      this.createSegment('day', sunriseMinutes, sunsetMinutes, dayScaleFactor, 'Day'),
      this.createSegment('night', sunsetMinutes, 1440, nightScaleFactor, 'Night'),
    ].filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const realMinutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(realMinutes, segments);

    if (!activeSegment) {
      return this.errorState(date, 'Cannot find active segment.');
    }

    let designedTotalSeconds;
    if (activeSegment.type === 'day') {
      const elapsedInSegment = realMinutes - activeSegment.startTime;
      const scaledElapsed = elapsedInSegment * activeSegment.scaleFactor;
      designedTotalSeconds = (activeSegment.startTime * activeSegment.scaleFactor) + scaledElapsed;
    } else { // Night
      const elapsedInSegment = realMinutes - activeSegment.startTime;
      let scaledElapsed = elapsedInSegment * activeSegment.scaleFactor;

      // The night is split into two segments, we need to handle the time accumulation correctly.
      if (activeSegment.startTime > 0) { // This is the second night segment (sunset to midnight)
        const firstNightSegment = segments.find(s => s.type === 'night' && s.startTime === 0);
        const firstNightDesignedDuration = firstNightSegment.duration * activeSegment.scaleFactor;
        scaledElapsed += firstNightDesignedDuration;
      }

      // Offset by the designed duration of the day period
      const daySegment = segments.find(s => s.type === 'day');
      const designedDayDuration = daySegment.duration * daySegment.scaleFactor;
      designedTotalSeconds = designedDayDuration + scaledElapsed;
    }

    // This logic is simplified and might need refinement for edge cases.
    // For now, let's just scale the elapsed time within the segment.
    const elapsedInSegment = realMinutes - activeSegment.startTime;
    const scaledElapsedSeconds = (elapsedInSegment * 60 + date.getSeconds()) * activeSegment.scaleFactor;

    // We need a baseline to add the scaled elapsed time to.
    let baseDesignedMinutes = 0;
    if (activeSegment.type === 'day') {
      baseDesignedMinutes = 0; // Day starts at 00:00 in its own context
    } else if (activeSegment.startTime > 0) { // Second night segment
      const daySegment = segments.find(s => s.type === 'day');
      baseDesignedMinutes = daySegment.duration * daySegment.scaleFactor;
    }

    // This part of the logic is complex. For now, let's adopt a simpler calculation
    // similar to other modes and refine later if needed.

    let designedStartTime = 0; // Night starts at 00:00
    if (activeSegment.type === 'day') {
      // Find the duration of the first night segment after scaling
      const firstNightSegment = segments.find(s => s.type === 'night' && s.startTime === 0);
      if (firstNightSegment) {
        designedStartTime = firstNightSegment.duration * firstNightSegment.scaleFactor;
      }
    } else if (activeSegment.startTime > 0) { // Second night segment (after sunset)
      const daySegment = segments.find(s => s.type === 'day');
      const firstNightSegment = segments.find(s => s.type === 'night' && s.startTime === 0);
      designedStartTime = (firstNightSegment.duration * firstNightSegment.scaleFactor) + (daySegment.duration * daySegment.scaleFactor);
    }

    const scaledElapsedTotalSeconds = (realMinutes - activeSegment.startTime) * 60 * activeSegment.scaleFactor + date.getSeconds() * activeSegment.scaleFactor;
    const designedTotalSecondsFromStart = designedStartTime * 60 + scaledElapsedTotalSeconds;

    const displayHours = Math.floor(designedTotalSecondsFromStart / 3600) % 24;
    const displayMinutes = Math.floor((designedTotalSecondsFromStart % 3600) / 60);
    const displaySeconds = Math.floor(designedTotalSecondsFromStart % 60);

    const { progress, remaining, duration } = this.calculateProgress(realMinutes, activeSegment);

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: false, // Solar mode doesn't have a concept of "Another Hour"
      segmentInfo: { type: activeSegment.type, label: activeSegment.label, progress, remaining, duration },
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