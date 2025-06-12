// public/js/time-design/modes/ClassicMode.js

import { BaseMode } from './BaseMode.js';
import { getCustomAhAngles } from '../../../clock-core.js';

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
        designed24Minutes: {
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
      designed24Minutes: 1380 // 23 hours
    };
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];
    const duration = config.designed24Minutes;

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
   * Calculate time based on configuration
   */
  calculate(date, timezone, config) {
    const duration = config.designed24Minutes || this.getDefaultConfig().designed24Minutes;
    const angles = getCustomAhAngles(date, timezone, duration);

    return {
      hours: angles.aphHours,
      minutes: angles.aphMinutes,
      seconds: angles.aphSeconds,
      scaleFactor: angles.scaleFactor,
      isAnotherHour: angles.isPersonalizedAhPeriod,
      segmentInfo: {
        type: angles.isPersonalizedAhPeriod ? 'another' : 'designed',
        label: angles.isPersonalizedAhPeriod ? 'Another Hour' : 'Designed 24',
      },
      // for clock display
      hourAngle: angles.hourAngle,
      minuteAngle: angles.minuteAngle,
      secondAngle: angles.secondAngle,
    };
  }

  /**
   * Build segments for classic mode
   */
  buildSegments(config) {
    const segments = [];
    const designed24Duration = config.designed24Minutes;
    const anotherHourDuration = 1440 - designed24Duration;

    // Designed 24 segment
    if (designed24Duration > 0) {
      const scaleFactor = designed24Duration > 0 ? 1440 / designed24Duration : 1;
      segments.push(this.createSegment(
        'designed',
        0,
        designed24Duration,
        scaleFactor,
        'Designed 24'
      ));
    }

    // Another Hour segment
    if (anotherHourDuration > 0) {
      segments.push(this.createSegment(
        'another',
        designed24Duration,
        1440,
        1.0,
        'Another Hour'
      ));
    }

    // Edge case: full 24 hours as Designed 24
    if (designed24Duration === 1440) {
      return [this.createSegment('designed', 0, 1440, 1.0, 'Designed 24 (Full Day)')];
    }

    return segments;
  }

  /**
   * Get configuration summary for display
   */
  getConfigSummary(config) {
    const designed24Hours = Math.floor(config.designed24Minutes / 60);
    const designed24Minutes = config.designed24Minutes % 60;
    const anotherHourDuration = 1440 - config.designed24Minutes;
    const anotherHourHours = Math.floor(anotherHourDuration / 60);
    const anotherHourMinutes = anotherHourDuration % 60;

    return {
      designed24: {
        hours: designed24Hours,
        minutes: designed24Minutes,
        total: config.designed24Minutes,
        display: this.formatDuration(config.designed24Minutes)
      },
      anotherHour: {
        hours: anotherHourHours,
        minutes: anotherHourMinutes,
        total: anotherHourDuration,
        display: this.formatDuration(anotherHourDuration)
      },
      scaleFactor: config.designed24Minutes > 0 ? (1440 / config.designed24Minutes).toFixed(2) : '1.00'
    };
  }

  /**
   * Migrate from old localStorage format
   */
  static migrateFromLegacy() {
    const legacyDuration = localStorage.getItem('personalizedAhDurationMinutes');
    if (!legacyDuration) return null;

    return {
      designed24Minutes: parseInt(legacyDuration, 10),
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        migratedFrom: 'legacy'
      }
    };
  }
}
