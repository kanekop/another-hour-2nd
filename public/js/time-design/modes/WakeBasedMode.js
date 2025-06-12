// WakeBasedMode.js - Another Hour period based on wake time

import { BaseMode } from './BaseMode.js';

/**
 * WakeBasedMode - Another Hour period starts after waking up
 */
export class WakeBasedMode extends BaseMode {
  constructor() {
    super(
      'wake-based',
      'Wake-Based Mode',
      'Another Hour period starts after waking up.',
      {
        wakeTime: { type: 'time', label: 'Today\'s Wake Time', default: '07:00' },
        anotherHourDuration: { type: 'number', label: 'Another Hour Duration (minutes)', min: 0, max: 360, default: 60 },
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
    if (config.anotherHourDuration === undefined || typeof config.anotherHourDuration !== 'number' || config.anotherHourDuration < 0) {
      errors.push('Another Hour duration must be a non-negative number.');
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
    const designedEnd = wakeTimeMinutes + ahDuration;

    // A day in this mode is defined as 24 hours starting from wake-up time.
    // The timeline wraps around midnight.

    const anotherHourSegment = {
      start: wakeTimeMinutes,
      end: wakeTimeMinutes + ahDuration,
      type: 'another'
    };

    const designedSegment = {
      start: anotherHourSegment.end,
      end: anotherHourSegment.end + (1440 - ahDuration),
      type: 'designed'
    };

    const segments = [];
    const scaleFactor = (1440 - ahDuration) > 0 ? 1440 / (1440 - ahDuration) : 1;

    // The logic needs to handle segments that cross midnight (e.g., wake at 23:00)
    // For simplicity, we can think of time as a continuous line from wake-up.
    // However, getMinutesSinceMidnight is based on a real day.
    // A better approach is to calculate minutes *since wake-up time*.

    // We create segments for a "virtual" day that starts at wakeTime.
    // The actual mapping from real time to virtual time happens in calculate().
    segments.push(this.createSegment('another', 0, ahDuration, 1.0, 'Another Hour'));
    segments.push(this.createSegment('designed', ahDuration, 1440, scaleFactor, 'Designed Day'));

    return segments;
  }

  calculate(date, timezone, config) {
    const realMinutes = this.getMinutesSinceMidnight(date, timezone);
    const wakeTimeMinutes = this._parseTime(config.wakeTime);

    // Calculate minutes since wake-up, handling midnight wrap-around
    let minutesSinceWake = realMinutes - wakeTimeMinutes;
    if (minutesSinceWake < 0) {
      minutesSinceWake += 1440; // Add a full day if current time is "before" wake-up time (e.g., wake at 7:00, current is 2:00)
    }

    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(minutesSinceWake, segments);

    if (!activeSegment) {
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds(), scaleFactor: 1, isAnotherHour: true, segmentInfo: { type: 'another', label: 'Error' } };
    }

    let displayHours, displayMinutes, displaySeconds;

    const segmentElapsed = minutesSinceWake - activeSegment.startTime;
    const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;

    if (activeSegment.type === 'another') {
      const d = new Date(date);
      displayHours = d.getHours();
      displayMinutes = d.getMinutes();
      displaySeconds = d.getSeconds();
    } else { // 'designed'
      const scaledTotalMinutes = scaledElapsed;
      displayHours = Math.floor(scaledTotalMinutes / 60) % 24;
      displayMinutes = Math.floor(scaledTotalMinutes % 60);
      displaySeconds = Math.floor((scaledTotalMinutes * 60) % 60);
    }

    const { progress, remaining } = this.calculateProgress(minutesSinceWake, activeSegment);

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: { type: activeSegment.type, label: activeSegment.label, progress, remaining, duration: activeSegment.duration },
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