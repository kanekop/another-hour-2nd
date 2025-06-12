// WakeBasedMode.js - A day designed around your activity time, from wake-up to midnight.

import { BaseMode } from './BaseMode.js';

/**
 * WakeBasedMode - A day designed around your activity time, from wake-up to midnight.
 */
export class WakeBasedMode extends BaseMode {
  constructor() {
    super(
      'wake-based',
      'Wake-Based Mode',
      'Your day, from wake-up to midnight, is redesigned. The end of your day becomes a focused Another Hour.',
      {
        wakeTime: { type: 'time', label: 'Today\'s Wake Time', default: '07:00' },
        anotherHourDuration: { type: 'number', label: 'Another Hour Duration (minutes)', min: 0, max: 720, default: 60 },
      }
    );
  }

  getDefaultConfig() {
    return {
      wakeTime: '07:00',
      anotherHourDuration: 60,
    };
  }

  validate(config) {
    const errors = [];
    if (!config.wakeTime || !/^\d{2}:\d{2}$/.test(config.wakeTime)) {
      errors.push('Wake time must be in HH:MM format.');
    }
    const wakeTimeMinutes = this._parseTime(config.wakeTime);
    const activityMinutes = 1440 - wakeTimeMinutes;
    if (config.anotherHourDuration >= activityMinutes) {
      errors.push('Another Hour duration must be less than the total activity time.');
    }
    return { valid: errors.length === 0, errors };
  }

  _parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  _buildSegments(config) {
    const wakeTimeMinutes = this._parseTime(config.wakeTime);
    const ahDuration = config.anotherHourDuration;

    // Total available time from wake-up to midnight.
    const totalActivityMinutes = 1440 - wakeTimeMinutes;

    // The real-time duration available for the "Designed" period.
    const designedRealDuration = totalActivityMinutes - ahDuration;

    if (designedRealDuration <= 0) return [];

    // The scale factor compresses the totalActivityMinutes into the designedRealDuration.
    const scaleFactor = totalActivityMinutes / designedRealDuration;

    const anotherHourStart = 1440 - ahDuration;

    const segments = [
      this.createSegment('another', 0, wakeTimeMinutes, 1.0, 'Night'),
      this.createSegment('designed', wakeTimeMinutes, anotherHourStart, scaleFactor, 'Designed Day'),
      this.createSegment('another', anotherHourStart, 1440, 1.0, 'Another Hour'),
    ];

    return segments.filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const realMinutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(realMinutes, segments);
    const wakeTimeMinutes = this._parseTime(config.wakeTime);

    if (!activeSegment) {
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds(), scaleFactor: 1, isAnotherHour: true, segmentInfo: { type: 'another', label: 'Error' } };
    }

    let displayHours, displayMinutes, displaySeconds;
    const { progress, remaining, duration } = this.calculateProgress(realMinutes, activeSegment);

    if (activeSegment.type === 'another') {
      const remainingTotalSeconds = remaining * 60;
      displayHours = Math.floor(remainingTotalSeconds / 3600);
      displayMinutes = Math.floor((remainingTotalSeconds % 3600) / 60);
      displaySeconds = Math.floor(remainingTotalSeconds % 60);
    } else { // 'designed'
      // Elapsed real time since wake-up.
      const elapsedRealMinutesInPeriod = realMinutes - wakeTimeMinutes;
      // The scaled elapsed time since wake-up (starts from 0).
      const scaledElapsedMinutes = elapsedRealMinutesInPeriod * activeSegment.scaleFactor;
      const scaledElapsedSeconds = scaledElapsedMinutes * 60 + date.getSeconds() * activeSegment.scaleFactor;

      // The display time is the wake time offset by the scaled elapsed time.
      const wakeTimeSeconds = wakeTimeMinutes * 60;
      const displayTotalSeconds = wakeTimeSeconds + scaledElapsedSeconds;

      displayHours = Math.floor(displayTotalSeconds / 3600) % 24;
      displayMinutes = Math.floor((displayTotalSeconds % 3600) / 60);
      displaySeconds = Math.floor(displayTotalSeconds % 60);
    }

    const totalActivityMinutes = 1440 - wakeTimeMinutes;
    const segmentDuration = activeSegment.label === 'Designed Day' ? totalActivityMinutes : activeSegment.duration;

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: { type: activeSegment.type, label: activeSegment.label, progress, remaining, duration: segmentDuration },
      periodName: activeSegment.label,
    };
  }

  recordWakeTime(wakeTime, config) {
    return {
      ...config,
      wakeTime: {
        time: wakeTime.getTime(),
        date: wakeTime.toDateString()
      }
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WakeBasedMode };
} else {
  window.WakeBasedMode = WakeBasedMode;
}