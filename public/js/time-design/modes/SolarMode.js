// SolarMode.js - Time based on solar cycles

import { BaseMode } from './BaseMode.js';

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
        latitude: { type: 'number', label: 'Latitude', default: 35.68, disabled: true },
        longitude: { type: 'number', label: 'Longitude', default: 139.76, disabled: true },
      }
    );
  }

  getDefaultConfig() {
    return {
      latitude: 35.68, // Tokyo
      longitude: 139.76,
    };
  }

  validate(config) {
    // For now, no validation is needed as the inputs are disabled
    return { valid: true, errors: [] };
  }

  // This is a simplified placeholder. A real implementation would use a library
  // like SunCalc.js or an API call.
  _getSunriseSunset(date, lat, lon) {
    // Placeholder: Fixed sunrise/sunset for simplicity
    // March equinox-ish times
    const sunrise = 6 * 60; // 6:00 AM
    const sunset = 18 * 60; // 6:00 PM
    return { sunrise, sunset };
  }

  _buildSegments(config, date) {
    const { sunrise, sunset } = this._getSunriseSunset(date, config.latitude, config.longitude);
    const dayDuration = sunset - sunrise;
    const nightDuration = (1440 - dayDuration);

    const dayScaleFactor = dayDuration > 0 ? (12 * 60) / dayDuration : 1;
    const nightScaleFactor = nightDuration > 0 ? (12 * 60) / nightDuration : 1;

    const segments = [
      this.createSegment('night', 0, sunrise, nightScaleFactor, 'Night'),
      this.createSegment('day', sunrise, sunset, dayScaleFactor, 'Daylight'),
      this.createSegment('night', sunset, 1440, nightScaleFactor, 'Night'),
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