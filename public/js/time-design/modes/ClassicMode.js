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
      'Original Another Hour with time at the end of day'
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      designed24Duration: 1380, // 23 hours in minutes
      startHour: 0, // Start at midnight
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];

    // Check designed24Duration
    if (!config.designed24Duration || typeof config.designed24Duration !== 'number') {
      errors.push('designed24Duration must be a number');
    } else if (config.designed24Duration < 0 || config.designed24Duration > 1440) {
      errors.push('designed24Duration must be between 0 and 1440 minutes (24 hours)');
    }

    // Check startHour
    if (config.startHour !== undefined) {
      if (typeof config.startHour !== 'number' || config.startHour < 0 || config.startHour > 23) {
        errors.push('startHour must be between 0 and 23');
      }
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
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const startMinute = (config.startHour || 0) * 60;

    // Build segments
    const segments = this.buildSegments(config);

    // Adjust minutes for start hour
    const adjustedMinutes = (minutes - startMinute + 1440) % 1440;

    // Find active segment
    const activeSegment = this.findActiveSegment(adjustedMinutes, segments);

    if (!activeSegment) {
      throw new Error('No active segment found - this should not happen');
    }

    // Calculate elapsed time in segment
    const segmentElapsed = this.getSegmentElapsed(adjustedMinutes, activeSegment);
    const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;

    // Calculate display time
    let displayTime;
    if (activeSegment.type === 'designed') {
      // Designed 24 - scale time
      displayTime = this.calculateDisplayTime(activeSegment, scaledElapsed, 0);
    } else {
      // Another Hour - use real time
      const ahStartHour = Math.floor(config.designed24Duration / 60);
      displayTime = this.calculateDisplayTime(activeSegment, segmentElapsed, ahStartHour);
    }

    // Calculate progress
    const segmentProgress = this.getSegmentProgress(segmentElapsed, activeSegment.duration);

    return {
      hours: displayTime.hours,
      minutes: displayTime.minutes,
      seconds: displayTime.seconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: {
        type: activeSegment.type,
        label: activeSegment.label,
        progress: segmentProgress,
        elapsed: segmentElapsed,
        duration: activeSegment.duration,
        remaining: activeSegment.duration - segmentElapsed
      },
      // Additional info for display
      displayString: this.formatTime(displayTime.hours, displayTime.minutes, displayTime.seconds),
      periodName: activeSegment.type === 'designed' ? 'Designed 24' : 'Another Hour'
    };
  }

  /**
   * Build segments for classic mode
   */
  buildSegments(config) {
    const segments = [];
    const designed24Duration = config.designed24Duration;
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
      startHour: 0,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        migratedFrom: 'legacy'
      }
    };
  }
}
// public/js/time-design/modes/ClassicMode.js

import { BaseMode } from './BaseMode.js';

/**
 * ClassicMode - Original Another Hour implementation
 * Designed 24 period followed by Another Hour period
 */
export class ClassicMode extends BaseMode {
  constructor() {
    super(
      'classic',
      'Classic Mode',
      'Original Another Hour with time at the end of day'
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      designed24Duration: 1380, // 23 hours in minutes
      startHour: 0, // Start at midnight
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    };
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];

    // Check designed24Duration
    if (!config.designed24Duration || typeof config.designed24Duration !== 'number') {
      errors.push('designed24Duration must be a number');
    } else if (config.designed24Duration < 0 || config.designed24Duration > 1440) {
      errors.push('designed24Duration must be between 0 and 1440 minutes (24 hours)');
    }

    // Check startHour
    if (config.startHour !== undefined) {
      if (typeof config.startHour !== 'number' || config.startHour < 0 || config.startHour > 23) {
        errors.push('startHour must be between 0 and 23');
      }
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
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const startMinute = (config.startHour || 0) * 60;

    // Build segments
    const segments = this.buildSegments(config);

    // Adjust minutes for start hour
    const adjustedMinutes = (minutes - startMinute + 1440) % 1440;

    // Find active segment
    const activeSegment = this.findActiveSegment(adjustedMinutes, segments);

    if (!activeSegment) {
      throw new Error('No active segment found - this should not happen');
    }

    // Calculate elapsed time in segment
    const segmentElapsed = this.getSegmentElapsed(adjustedMinutes, activeSegment);
    const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;

    // Calculate display time
    let displayTime;
    if (activeSegment.type === 'designed') {
      // Designed 24 - scale time
      displayTime = this.calculateDisplayTime(activeSegment, scaledElapsed, 0);
    } else {
      // Another Hour - use real time
      const ahStartHour = Math.floor(config.designed24Duration / 60);
      displayTime = this.calculateDisplayTime(activeSegment, segmentElapsed, ahStartHour);
    }

    // Calculate progress
    const segmentProgress = this.getSegmentProgress(segmentElapsed, activeSegment.duration);

    return {
      hours: displayTime.hours,
      minutes: displayTime.minutes,
      seconds: displayTime.seconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: {
        type: activeSegment.type,
        label: activeSegment.label,
        progress: segmentProgress,
        elapsed: segmentElapsed,
        duration: activeSegment.duration,
        remaining: activeSegment.duration - segmentElapsed
      },
      // Additional info for display
      displayString: this.formatTime(displayTime.hours, displayTime.minutes, displayTime.seconds),
      periodName: activeSegment.type === 'designed' ? 'Designed 24' : 'Another Hour'
    };
  }

  /**
   * Build segments for classic mode
   */
  buildSegments(config) {
    const segments = [];
    const designed24Duration = config.designed24Duration;
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
}
