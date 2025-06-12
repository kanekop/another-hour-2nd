// public/js/time-design/modes/BaseMode.js

/**
 * BaseMode - Abstract base class for all time design modes
 * Provides common functionality and enforces interface
 */
export class BaseMode {
  constructor(id, name, description) {
    if (new.target === BaseMode) {
      throw new Error('BaseMode is abstract and cannot be instantiated directly');
    }

    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Validate configuration for this mode
   * @abstract
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(config) {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Calculate time based on mode configuration
   * @abstract
   * @returns {Object} Calculated time information
   */
  calculate(date, timezone, config) {
    throw new Error('calculate() must be implemented by subclass');
  }

  /**
   * Get default configuration for this mode
   * @abstract
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    throw new Error('getDefaultConfig() must be implemented by subclass');
  }

  // ============= Common Utility Methods =============

  /**
   * Create a time segment
   */
  createSegment(type, startTime, endTime, scaleFactor, label = '') {
    return {
      id: `${type}-${startTime}-${endTime}`,
      type,
      startTime,
      endTime,
      scaleFactor,
      label,
      duration: endTime - startTime
    };
  }

  /**
   * Get minutes since midnight in given timezone
   */
  getMinutesSinceMidnight(date, timezone) {
    // Use moment.js if available, otherwise native Date
    if (typeof moment !== 'undefined' && moment.tz) {
      const localTime = moment(date).tz(timezone);
      return localTime.hours() * 60 + localTime.minutes();
    } else {
      // Fallback for native Date (less accurate for timezones)
      const localTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      return localTime.getHours() * 60 + localTime.getMinutes();
    }
  }

  /**
   * Find the active segment for given time
   */
  findActiveSegment(minutes, segments) {
    // Handle day wrap-around
    const adjustedMinutes = minutes % 1440;

    return segments.find(segment => {
      if (segment.startTime <= segment.endTime) {
        // Normal segment
        return adjustedMinutes >= segment.startTime && adjustedMinutes < segment.endTime;
      } else {
        // Segment crosses midnight
        return adjustedMinutes >= segment.startTime || adjustedMinutes < segment.endTime;
      }
    });
  }

  /**
   * Calculate elapsed time within a segment
   */
  getSegmentElapsed(minutes, segment) {
    const adjustedMinutes = minutes % 1440;

    if (segment.startTime <= segment.endTime) {
      // Normal segment
      return adjustedMinutes - segment.startTime;
    } else {
      // Segment crosses midnight
      if (adjustedMinutes >= segment.startTime) {
        return adjustedMinutes - segment.startTime;
      } else {
        return (1440 - segment.startTime) + adjustedMinutes;
      }
    }
  }

  /**
   * Convert scaled minutes to hours, minutes, seconds
   */
  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes * 60) % 60);

    return { hours, minutes, seconds };
  }

  /**
   * Calculate display time from segment and elapsed time
   */
  calculateDisplayTime(segment, scaledElapsed, baseHour = 0) {
    const totalMinutes = baseHour * 60 + scaledElapsed;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * Check if time is near a segment transition
   */
  isNearTransition(minutes, segments, threshold = 5) {
    return segments.some(segment => {
      const distanceToEnd = Math.abs(minutes - segment.endTime);
      const distanceToStart = Math.abs(minutes - segment.startTime);
      return distanceToEnd <= threshold || distanceToStart <= threshold;
    });
  }

  /**
   * Validate that segments cover full day
   */
  validateFullDayCoverage(segments) {
    const coverage = new Array(1440).fill(false);

    segments.forEach(segment => {
      for (let i = segment.startTime; i < segment.endTime; i++) {
        coverage[i] = true;
      }
    });

    const uncovered = coverage.filter(covered => !covered).length;
    return uncovered === 0;
  }

  /**
   * Validate segment continuity
   */
  validateSegmentContinuity(segments) {
    const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].endTime !== sorted[i + 1].startTime) {
        return false;
      }
    }

    // Check wrap-around
    const last = sorted[sorted.length - 1];
    const first = sorted[0];
    return last.endTime === 1440 || last.endTime === first.startTime;
  }

  /**
   * Format time for display
   */
  formatTime(hours, minutes, seconds, includeSeconds = true) {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');

    if (includeSeconds) {
      const s = String(seconds).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    return `${h}:${m}`;
  }

  /**
   * Calculate segment progress percentage
   */
  getSegmentProgress(elapsed, duration) {
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  }

  /**
   * Get human-readable duration
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
}
// public/js/time-design/modes/BaseMode.js

/**
 * BaseMode - Abstract base class for all time design modes
 * Provides common utilities and enforces interface requirements
 */
export class BaseMode {
  constructor(id, name, description) {
    if (new.target === BaseMode) {
      throw new Error('BaseMode is abstract and cannot be instantiated directly');
    }

    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Validate configuration for this mode
   * @abstract
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate(config) {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Calculate time based on mode configuration
   * @abstract
   * @returns {Object} Calculated time information
   */
  calculate(date, timezone, config) {
    throw new Error('calculate() must be implemented by subclass');
  }

  /**
   * Get default configuration for this mode
   * @abstract
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    throw new Error('getDefaultConfig() must be implemented by subclass');
  }

  // ============= Common Utility Methods =============

  /**
   * Create a time segment
   */
  createSegment(type, startTime, endTime, scaleFactor, label = '') {
    return {
      id: `${type}-${startTime}-${endTime}`,
      type,
      startTime,
      endTime,
      scaleFactor,
      label,
      duration: endTime - startTime
    };
  }

  /**
   * Get minutes since midnight in given timezone
   */
  getMinutesSinceMidnight(date, timezone) {
    // Use moment.js if available, otherwise native Date
    if (typeof moment !== 'undefined' && moment.tz) {
      const localTime = moment(date).tz(timezone);
      return localTime.hours() * 60 + localTime.minutes();
    } else {
      // Fallback for native Date (less accurate for timezones)
      const localTime = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      return localTime.getHours() * 60 + localTime.getMinutes();
    }
  }

  /**
   * Find the active segment for given time
   */
  findActiveSegment(minutes, segments) {
    // Handle day wrap-around
    const adjustedMinutes = minutes % 1440;

    return segments.find(segment => {
      if (segment.startTime <= segment.endTime) {
        // Normal segment
        return adjustedMinutes >= segment.startTime && adjustedMinutes < segment.endTime;
      } else {
        // Segment crosses midnight
        return adjustedMinutes >= segment.startTime || adjustedMinutes < segment.endTime;
      }
    });
  }

  /**
   * Calculate elapsed time within a segment
   */
  getSegmentElapsed(minutes, segment) {
    const adjustedMinutes = minutes % 1440;

    if (segment.startTime <= segment.endTime) {
      // Normal segment
      return adjustedMinutes - segment.startTime;
    } else {
      // Segment crosses midnight
      if (adjustedMinutes >= segment.startTime) {
        return adjustedMinutes - segment.startTime;
      } else {
        return (1440 - segment.startTime) + adjustedMinutes;
      }
    }
  }

  /**
   * Convert scaled minutes to hours, minutes, seconds
   */
  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const seconds = Math.floor((totalMinutes * 60) % 60);

    return { hours, minutes, seconds };
  }

  /**
   * Calculate display time from segment and elapsed time
   */
  calculateDisplayTime(segment, scaledElapsed, baseHour = 0) {
    const totalMinutes = baseHour * 60 + scaledElapsed;
    return this.minutesToTime(totalMinutes);
  }

  /**
   * Format time for display
   */
  formatTime(hours, minutes, seconds, includeSeconds = true) {
    const h = String(hours).padStart(2, '0');
    const m = String(minutes).padStart(2, '0');

    if (includeSeconds) {
      const s = String(seconds).padStart(2, '0');
      return `${h}:${m}:${s}`;
    }

    return `${h}:${m}`;
  }

  /**
   * Calculate segment progress percentage
   */
  getSegmentProgress(elapsed, duration) {
    return Math.min(100, Math.max(0, (elapsed / duration) * 100));
  }

  /**
   * Get human-readable duration
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins}m`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}m`;
    }
  }
}
