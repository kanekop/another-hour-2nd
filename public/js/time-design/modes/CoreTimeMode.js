// public/js/time-design/modes/CoreTimeMode.js

import { BaseMode } from './BaseMode.js';

/**
 * CoreTimeMode - Define productive hours with Another Hour periods before and after
 */
export class CoreTimeMode extends BaseMode {
  constructor() {
    super(
      'core-time',
      'Core Time Mode',
      'Define your productive hours with Another Hour periods before and after'
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      morningAH: {
        start: 300,    // 5:00 AM (minutes since midnight)
        duration: 120  // 2 hours
      },
      eveningAH: {
        duration: 120, // 2 hours
        end: 1440     // 24:00 (midnight)
      },
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

    // Validate morning AH
    if (!config.morningAH || typeof config.morningAH !== 'object') {
      errors.push('morningAH configuration is required');
    } else {
      if (typeof config.morningAH.start !== 'number' || 
          config.morningAH.start < 0 || 
          config.morningAH.start > 720) {
        errors.push('Morning AH must start between 0:00 and 12:00');
      }

      if (typeof config.morningAH.duration !== 'number' || 
          config.morningAH.duration < 0 || 
          config.morningAH.duration > 360) {
        errors.push('Morning AH duration must be between 0 and 6 hours');
      }
    }

    // Validate evening AH
    if (!config.eveningAH || typeof config.eveningAH !== 'object') {
      errors.push('eveningAH configuration is required');
    } else {
      if (typeof config.eveningAH.duration !== 'number' || 
          config.eveningAH.duration < 0 || 
          config.eveningAH.duration > 360) {
        errors.push('Evening AH duration must be between 0 and 6 hours');
      }

      if (typeof config.eveningAH.end !== 'number' || 
          config.eveningAH.end < 720 || 
          config.eveningAH.end > 1440) {
        errors.push('Evening AH must end between 12:00 and 24:00');
      }
    }

    // If basic validation passed, check advanced constraints
    if (errors.length === 0) {
      // Check total AH doesn't exceed 12 hours
      const totalAH = config.morningAH.duration + config.eveningAH.duration;
      if (totalAH > 720) {
        errors.push('Total Another Hour time cannot exceed 12 hours');
      }

      // Calculate Core Time
      const coreStart = config.morningAH.start + config.morningAH.duration;
      const coreEnd = config.eveningAH.end - config.eveningAH.duration;
      const coreDuration = coreEnd - coreStart;

      if (coreDuration < 720) {
        errors.push('Core Time must be at least 12 hours');
      }

      // Check for overlap
      if (coreStart >= coreEnd) {
        errors.push('Morning and Evening AH periods overlap - reduce their duration');
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

    // Build segments
    const segments = this.buildSegments(config);

    // Find active segment
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      throw new Error('No active segment found - configuration error');
    }

    // Calculate elapsed time in segment
    const segmentElapsed = this.getSegmentElapsed(minutes, activeSegment);

    // Calculate display time based on segment type
    let displayTime;
    let scaledElapsed;

    if (activeSegment.type === 'another') {
      // Another Hour - use real time
      scaledElapsed = segmentElapsed;
      const baseHour = activeSegment.label.includes('Morning') ? 
        Math.floor(activeSegment.startTime / 60) : 
        Math.floor(activeSegment.startTime / 60);
      displayTime = this.calculateDisplayTime(activeSegment, segmentElapsed, baseHour);
    } else {
      // Core Time - use scaled time
      scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
      const coreTimeBase = config.morningAH.duration / 60; // Hours into the day
      displayTime = this.calculateDisplayTime(activeSegment, scaledElapsed, coreTimeBase);
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
        remaining: activeSegment.duration - segmentElapsed,
        scaledElapsed: scaledElapsed
      },
      displayString: this.formatTime(displayTime.hours, displayTime.minutes, displayTime.seconds),
      periodName: activeSegment.label
    };
  }

  /**
   * Build segments for Core Time mode
   */
  buildSegments(config) {
    const segments = [];

    // Calculate boundaries
    const morningAHEnd = config.morningAH.start + config.morningAH.duration;
    const eveningAHStart = config.eveningAH.end - config.eveningAH.duration;
    const coreDuration = (eveningAHStart - morningAHEnd) / 60; // in hours
    const coreScaleFactor = 24 / coreDuration;

    // Before morning AH (if morning AH doesn't start at midnight)
    if (config.morningAH.start > 0) {
      segments.push(this.createSegment(
        'another',
        0,
        config.morningAH.start,
        1.0,
        'Night (Previous Day)'
      ));
    }

    // Morning AH
    if (config.morningAH.duration > 0) {
      segments.push(this.createSegment(
        'another',
        config.morningAH.start,
        morningAHEnd,
        1.0,
        'Morning Another Hour'
      ));
    }

    // Core Time
    segments.push(this.createSegment(
      'designed',
      morningAHEnd,
      eveningAHStart,
      coreScaleFactor,
      'Core Time'
    ));

    // Evening AH
    if (config.eveningAH.duration > 0) {
      segments.push(this.createSegment(
        'another',
        eveningAHStart,
        config.eveningAH.end,
        1.0,
        'Evening Another Hour'
      ));
    }

    return segments;
  }

  /**
   * Get configuration summary for display
   */
  getConfigSummary(config) {
    const morningAHEnd = config.morningAH.start + config.morningAH.duration;
    const eveningAHStart = config.eveningAH.end - config.eveningAH.duration;
    const coreDuration = eveningAHStart - morningAHEnd;

    return {
      morningAH: {
        start: this.minutesToTimeString(config.morningAH.start),
        end: this.minutesToTimeString(morningAHEnd),
        duration: this.formatDuration(config.morningAH.duration)
      },
      coreTime: {
        start: this.minutesToTimeString(morningAHEnd),
        end: this.minutesToTimeString(eveningAHStart),
        duration: this.formatDuration(coreDuration),
        scaleFactor: (1440 / coreDuration).toFixed(2)
      },
      eveningAH: {
        start: this.minutesToTimeString(eveningAHStart),
        end: this.minutesToTimeString(config.eveningAH.end),
        duration: this.formatDuration(config.eveningAH.duration)
      },
      totalAH: this.formatDuration(config.morningAH.duration + config.eveningAH.duration)
    };
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}
// public/js/time-design/modes/CoreTimeMode.js

import { BaseMode } from './BaseMode.js';

/**
 * CoreTimeMode - Define productive hours with AH periods before and after
 */
export class CoreTimeMode extends BaseMode {
  constructor() {
    super(
      'core-time',
      'Core Time Mode',
      'Define your productive hours with Another Hour periods before and after'
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      morningAH: {
        start: 300,    // 5:00 AM (minutes since midnight)
        duration: 120  // 2 hours
      },
      eveningAH: {
        duration: 120, // 2 hours
        end: 1440     // 24:00 (midnight)
      },
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

    // Validate morning AH
    if (!config.morningAH || typeof config.morningAH !== 'object') {
      errors.push('morningAH configuration is required');
    } else {
      if (typeof config.morningAH.start !== 'number' || 
          config.morningAH.start < 0 || 
          config.morningAH.start > 720) {
        errors.push('Morning AH must start between 0:00 and 12:00');
      }

      if (typeof config.morningAH.duration !== 'number' || 
          config.morningAH.duration < 0 || 
          config.morningAH.duration > 360) {
        errors.push('Morning AH duration must be between 0 and 6 hours');
      }
    }

    // Validate evening AH
    if (!config.eveningAH || typeof config.eveningAH !== 'object') {
      errors.push('eveningAH configuration is required');
    } else {
      if (typeof config.eveningAH.duration !== 'number' || 
          config.eveningAH.duration < 0 || 
          config.eveningAH.duration > 360) {
        errors.push('Evening AH duration must be between 0 and 6 hours');
      }

      if (typeof config.eveningAH.end !== 'number' || 
          config.eveningAH.end < 720 || 
          config.eveningAH.end > 1440) {
        errors.push('Evening AH must end between 12:00 and 24:00');
      }
    }

    // If basic validation passed, check advanced constraints
    if (errors.length === 0) {
      // Check total AH doesn't exceed 12 hours
      const totalAH = config.morningAH.duration + config.eveningAH.duration;
      if (totalAH > 720) {
        errors.push('Total Another Hour time cannot exceed 12 hours');
      }

      // Calculate Core Time
      const coreStart = config.morningAH.start + config.morningAH.duration;
      const coreEnd = config.eveningAH.end - config.eveningAH.duration;
      const coreDuration = coreEnd - coreStart;

      if (coreDuration < 720) {
        errors.push('Core Time must be at least 12 hours');
      }

      // Check for overlap
      if (coreStart >= coreEnd) {
        errors.push('Morning and Evening AH periods overlap - reduce their duration');
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

    // Build segments
    const segments = this.buildSegments(config);

    // Find active segment
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      throw new Error('No active segment found - configuration error');
    }

    // Calculate elapsed time in segment
    const segmentElapsed = this.getSegmentElapsed(minutes, activeSegment);

    // Calculate display time based on segment type
    let displayTime;
    let scaledElapsed;

    if (activeSegment.type === 'another') {
      // Another Hour - use real time
      scaledElapsed = segmentElapsed;
      const baseHour = activeSegment.label.includes('Morning') ? 
        Math.floor(activeSegment.startTime / 60) : 
        Math.floor(activeSegment.startTime / 60);
      displayTime = this.calculateDisplayTime(activeSegment, segmentElapsed, baseHour);
    } else {
      // Core Time - use scaled time
      scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
      const coreTimeBase = config.morningAH.duration / 60; // Hours into the day
      displayTime = this.calculateDisplayTime(activeSegment, scaledElapsed, coreTimeBase);
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
        remaining: activeSegment.duration - segmentElapsed,
        scaledElapsed: scaledElapsed
      },
      displayString: this.formatTime(displayTime.hours, displayTime.minutes, displayTime.seconds),
      periodName: activeSegment.label
    };
  }

  /**
   * Build segments for Core Time mode
   */
  buildSegments(config) {
    const segments = [];

    // Calculate boundaries
    const morningAHEnd = config.morningAH.start + config.morningAH.duration;
    const eveningAHStart = config.eveningAH.end - config.eveningAH.duration;
    const coreDuration = (eveningAHStart - morningAHEnd) / 60; // in hours
    const coreScaleFactor = 24 / coreDuration;

    // Before morning AH (if morning AH doesn't start at midnight)
    if (config.morningAH.start > 0) {
      segments.push(this.createSegment(
        'another',
        0,
        config.morningAH.start,
        1.0,
        'Night (Previous Day)'
      ));
    }

    // Morning AH
    if (config.morningAH.duration > 0) {
      segments.push(this.createSegment(
        'another',
        config.morningAH.start,
        morningAHEnd,
        1.0,
        'Morning Another Hour'
      ));
    }

    // Core Time
    segments.push(this.createSegment(
      'designed',
      morningAHEnd,
      eveningAHStart,
      coreScaleFactor,
      'Core Time'
    ));

    // Evening AH
    if (config.eveningAH.duration > 0) {
      segments.push(this.createSegment(
        'another',
        eveningAHStart,
        config.eveningAH.end,
        1.0,
        'Evening Another Hour'
      ));
    }

    return segments;
  }

  /**
   * Convert minutes to time string (HH:MM)
   */
  minutesToTimeString(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }
}
