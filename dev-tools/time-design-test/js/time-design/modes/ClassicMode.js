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

  getDefaultConfig() {
    return ClassicMode.getDefaultConfig();
  }

  /**
   * Collects configuration from the UI elements.
   * @returns {object} The configuration object.
   */
  collectConfigFromUI() {
    const designed24Duration = document.getElementById('designed24Duration').value;
    return {
      designed24Duration: parseInt(designed24Duration, 10)
    };
  }

  /**
   * Get default configuration
   */
  static getDefaultConfig() {
    return {
      designed24Duration: 1380, // Default to 23 hours
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
    const designedDuration = config.designed24Duration;
    const anotherDuration = 1440 - designedDuration;
    const scaleFactor = designedDuration > 0 ? 1440 / designedDuration : 1;

    let hours, minutesOut, seconds, periodName, isAnotherHour, progress, remaining;

    if (minutes < designedDuration) {
      // Designed 24 phase
      const scaled = minutes * scaleFactor;
      hours = Math.floor(scaled / 60) % 24;
      minutesOut = Math.floor(scaled % 60);
      seconds = Math.floor((scaled * 60) % 60);
      periodName = 'Designed 24';
      isAnotherHour = false;
      progress = minutes / designedDuration;
      remaining = designedDuration - minutes;
    } else {
      // Another Hour phase
      const ahMinutes = minutes - designedDuration;
      hours = Math.floor(ahMinutes / 60);
      minutesOut = Math.floor(ahMinutes % 60);
      seconds = Math.floor((ahMinutes * 60) % 60);
      periodName = 'Another Hour';
      isAnotherHour = true;
      progress = ahMinutes / anotherDuration;
      remaining = anotherDuration - ahMinutes;
    }

    return {
      hours,
      minutes: minutesOut,
      seconds,
      scaleFactor: minutes < designedDuration ? scaleFactor : 1.0,
      isAnotherHour,
      segmentInfo: {
        type: isAnotherHour ? 'another' : 'designed',
        label: periodName,
        progress,
        remaining,
        duration: minutes < designedDuration ? designedDuration : anotherDuration,
      },
      periodName,
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
   * Get segments for timeline display
   */
  getSegments(config) {
    const segments = this._buildSegments(config);

    return segments.map(segment => ({
      type: segment.type,
      label: segment.label,
      shortLabel: segment.type === 'designed' ? 'D24' : 'AH',
      startMinutes: segment.startTime,
      durationMinutes: segment.duration,
      scaleFactor: segment.scaleFactor
    }));
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