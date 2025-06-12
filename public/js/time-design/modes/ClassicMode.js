// public/js/time-design/modes/ClassicMode.js

import { BaseMode } from './BaseMode.js';

/**
 * ClassicMode - The original Another Hour time design
 * Designed 24 period followed by Another Hour period
 */
export class ClassicMode extends BaseMode {
  constructor() {
    super(
      'classic',
      'Classic Mode',
      'Original Another Hour with time at the end of day. A single slider controls the length of your Designed 24.',
      {
        designed24Duration: {
          type: 'number',
          label: 'Designed 24 Duration (minutes)',
          min: 1,
          max: 1440,
          default: 1380
        }
      }
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      designed24Duration: 1380 // 23 hours
    };
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];
    const duration = config.designed24Duration;

    if (typeof duration !== 'number' || isNaN(duration)) {
      errors.push('Duration must be a number.');
    }
    if (duration < 1 || duration > 1440) {
      errors.push('Duration must be between 1 and 1440 minutes.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Build segments for classic mode
   */
  _buildSegments(config) {
    const designedDuration = config.designed24Duration;
    const anotherHourStart = designedDuration;
    const scaleFactor = designedDuration > 0 ? 1440 / designedDuration : 1;

    const designedSegment = this.createSegment('designed', 0, anotherHourStart, scaleFactor, 'Designed 24');
    const anotherSegment = this.createSegment('another', anotherHourStart, 1440, 1.0, 'Another Hour');

    return [designedSegment, anotherSegment];
  }

  /**
   * Calculate time based on configuration
   */
  calculate(date, timezone, config) {
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      // Fallback for safety
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds(), scaleFactor: 1, isAnotherHour: true, segmentInfo: { type: 'another', label: 'Error' }, hourAngle: 0, minuteAngle: 0, secondAngle: 0 };
    }

    const segmentElapsed = minutes - activeSegment.startTime;

    let displayHours, displayMinutes, displaySeconds;

    if (activeSegment.type === 'another') {
      const d = new Date(date);
      displayHours = d.getHours();
      displayMinutes = d.getMinutes();
      displaySeconds = d.getSeconds();
    } else { // 'designed'
      const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
      const scaledTotalMinutes = scaledElapsed;
      displayHours = Math.floor(scaledTotalMinutes / 60) % 24;
      displayMinutes = Math.floor(scaledTotalMinutes % 60);
      displaySeconds = Math.floor((scaledTotalMinutes * 60) % 60);
    }

    const { progress, remaining } = this.calculateProgress(minutes, activeSegment);

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

  /**
   * Get configuration summary for display
   */
  getConfigSummary(config) {
    const designed24Hours = Math.floor(config.designed24Duration / 60);
    const designed24Minutes = config.designed24Duration % 60;
    const anotherHourDuration = 1440 - config.designed24Duration;
    const anotherHourHours = Math.floor(anotherHourDuration / 60);
    const anotherHourMinutes = anotherHourDuration % 60;

    return {
      designed24: {
        hours: designed24Hours,
        minutes: designed24Minutes,
        total: config.designed24Duration,
        display: this.formatDuration(config.designed24Duration)
      },
      anotherHour: {
        hours: anotherHourHours,
        minutes: anotherHourMinutes,
        total: anotherHourDuration,
        display: this.formatDuration(anotherHourDuration)
      },
      scaleFactor: config.designed24Duration > 0 ? (1440 / config.designed24Duration).toFixed(2) : '1.00'
    };
  }

  /**
   * Migrate from old localStorage format
   */
  static migrateFromLegacy() {
    const legacyDuration = localStorage.getItem('personalizedAhDurationMinutes');
    if (!legacyDuration) return null;

    return {
      designed24Duration: parseInt(legacyDuration, 10),
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        migratedFrom: 'legacy'
      }
    };
  }
}