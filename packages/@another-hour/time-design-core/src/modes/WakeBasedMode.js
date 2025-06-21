/**
 * WakeBasedMode.js - A day designed around your activity time
 * 
 * This is the unified implementation combining the best practices from both
 * dev-tools and scheduler-web implementations.
 * 
 * Wake-Based Mode consists of:
 * - Night period: Real-time from midnight to wake-up
 * - Designed Day: Scaled time from wake-up to Another Hour
 * - Another Hour: Real-time focused period at end of day
 * 
 * @author Another Hour Team
 * @version 1.0.0
 */

import { BaseMode } from './BaseMode.js';

/**
 * WakeBasedMode - A day designed around your activity time, from wake-up to midnight
 */
export class WakeBasedMode extends BaseMode {
  constructor() {
    super(
      'wake-based',
      'Wake-Based Mode',
      'Your day, from wake-up to midnight, is redesigned. The end of your day becomes a focused Another Hour.',
      {
        wakeTime: { 
          type: 'time', 
          label: 'Today\'s Wake Time', 
          default: '07:00' 
        },
        anotherHourDuration: { 
          type: 'number', 
          label: 'Another Hour Duration (minutes)', 
          min: 0, 
          max: 720, 
          default: 60 
        }
      }
    );
  }

  /**
   * Get default configuration for Wake-Based Mode
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      wakeTime: '07:00',
      anotherHourDuration: 60,
    };
  }

  /**
   * Static method to get default configuration
   * @static
   * @returns {Object} Default configuration
   */
  static getDefaultConfig() {
    return {
      wakeTime: '07:00',
      sleepTime: '23:00', // Legacy compatibility
      dayHours: 16,       // Legacy compatibility
    };
  }

  /**
   * Validate configuration for Wake-Based Mode
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate(config) {
    const errors = [];
    
    if (!config.wakeTime || !/^\d{2}:\d{2}$/.test(config.wakeTime)) {
      errors.push('Wake time must be in HH:MM format.');
    }
    
    if (typeof config.anotherHourDuration !== 'number' || config.anotherHourDuration < 0) {
      errors.push('Another Hour duration must be a positive number.');
    }
    
    if (config.anotherHourDuration > 720) {
      errors.push('Another Hour duration cannot exceed 12 hours (720 minutes).');
    }
    
    if (config.wakeTime) {
      const wakeTimeMinutes = this._parseTime(config.wakeTime);
      const activityMinutes = 1440 - wakeTimeMinutes;
      
      if (config.anotherHourDuration >= activityMinutes) {
        errors.push('Another Hour duration must be less than the total activity time.');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Collect configuration from UI elements
   * @returns {Object} Configuration object from UI
   */
  collectConfigFromUI() {
    const wakeTime = document.getElementById('wakeTime')?.value;
    const anotherHourDuration = document.getElementById('anotherHourDuration')?.value;

    return {
      wakeTime: wakeTime || '07:00',
      anotherHourDuration: parseInt(anotherHourDuration, 10) || 60
    };
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   * @private
   * @param {string} timeStr - Time string in HH:MM format
   * @returns {number} Minutes since midnight
   */
  _parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Build time segments for Wake-Based Mode
   * @private
   * @param {Object} config - Mode configuration
   * @returns {Array} Array of time segments
   */
  _buildSegments(config) {
    const wakeTimeMinutes = this._parseTime(config.wakeTime);
    const ahDuration = config.anotherHourDuration;

    // Total available time from wake-up to midnight
    const totalActivityMinutes = 1440 - wakeTimeMinutes;

    // The real-time duration available for the "Designed" period
    const designedRealDuration = totalActivityMinutes - ahDuration;

    if (designedRealDuration <= 0) return [];

    // The scale factor compresses the totalActivityMinutes into the designedRealDuration
    const scaleFactor = totalActivityMinutes / designedRealDuration;

    const anotherHourStart = 1440 - ahDuration;

    const segments = [
      this.createSegment('another', 0, wakeTimeMinutes, 1.0, 'Night'),
      this.createSegment('designed', wakeTimeMinutes, anotherHourStart, scaleFactor, 'Designed Day'),
      this.createSegment('another', anotherHourStart, 1440, 1.0, 'Another Hour'),
    ];

    return segments.filter(s => s.duration > 0);
  }

  /**
   * Calculate Another Hour time based on real time and configuration
   * @param {Date} date - Current real date/time
   * @param {string} timezone - Timezone identifier
   * @param {Object} config - Mode configuration
   * @returns {Object} Time calculation result
   */
  calculate(date, timezone, config) {
    const realMinutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(realMinutes, segments);
    const wakeTimeMinutes = this._parseTime(config.wakeTime);

    if (!activeSegment) {
      return { 
        hours: date.getHours(), 
        minutes: date.getMinutes(), 
        seconds: date.getSeconds(), 
        scaleFactor: 1, 
        isAnotherHour: true, 
        segmentInfo: { type: 'another', label: 'Error' } 
      };
    }

    let displayHours, displayMinutes, displaySeconds;
    const { progress, remaining } = this.calculateProgress(realMinutes, activeSegment);

    if (activeSegment.type === 'another') {
      // Another Hour periods: show elapsed time from 0:00:00
      const segmentElapsed = realMinutes - activeSegment.startTime;
      
      displayHours = Math.floor(segmentElapsed / 60);
      displayMinutes = Math.floor(segmentElapsed % 60);
      displaySeconds = Math.floor((segmentElapsed * 60) % 60);
    } else { // 'designed'
      // Designed Day: show scaled time from wake-up
      // Elapsed real time since wake-up
      const elapsedRealMinutesInPeriod = realMinutes - wakeTimeMinutes;
      // The scaled elapsed time since wake-up (starts from 0)
      const scaledElapsedMinutes = elapsedRealMinutesInPeriod * activeSegment.scaleFactor;
      const scaledElapsedSeconds = scaledElapsedMinutes * 60 + date.getSeconds() * activeSegment.scaleFactor;

      // The display time is the wake time offset by the scaled elapsed time
      const wakeTimeSeconds = wakeTimeMinutes * 60;
      const displayTotalSeconds = wakeTimeSeconds + scaledElapsedSeconds;

      displayHours = Math.floor(displayTotalSeconds / 3600) % 24;
      displayMinutes = Math.floor((displayTotalSeconds % 3600) / 60);
      displaySeconds = Math.floor(displayTotalSeconds % 60);
    }

    const totalActivityMinutes = 1440 - wakeTimeMinutes;
    const segmentDuration = activeSegment.label === 'Designed Day' ? totalActivityMinutes : activeSegment.duration;

    // Another Hour specific information
    const segmentElapsed = activeSegment.type === 'another' ? realMinutes - activeSegment.startTime : undefined;
    
    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: {
        type: activeSegment.type,
        label: activeSegment.label,
        progress,
        remaining,
        duration: segmentDuration,
        // Another Hour specific information for UI
        elapsed: segmentElapsed,
        total: activeSegment.type === 'another' ? activeSegment.duration : undefined,
        displayFormat: activeSegment.type === 'another' ? 'fraction' : 'normal'
      },
      periodName: activeSegment.label,
    };
  }

  /**
   * Get segments for timeline display
   * @param {Object} config - Mode configuration
   * @returns {Array} Array of timeline segments
   */
  getSegments(config) {
    const segments = this._buildSegments(config);

    return segments.map(segment => ({
      type: segment.type,
      label: segment.label,
      shortLabel: segment.type === 'designed' ? 'Day' : segment.label === 'Night' ? 'Night' : 'AH',
      startMinutes: segment.startTime,
      durationMinutes: segment.duration,
      scaleFactor: segment.scaleFactor
    }));
  }

  /**
   * Record wake time for daily tracking
   * @param {Date} wakeTime - Wake time to record
   * @param {Object} config - Current configuration
   * @returns {Object} Updated configuration with recorded wake time
   */
  recordWakeTime(wakeTime, config) {
    return {
      ...config,
      wakeTime: {
        time: wakeTime.getTime(),
        date: wakeTime.toDateString()
      }
    };
  }

  /**
   * Get configuration summary for display purposes
   * @param {Object} config - Mode configuration
   * @returns {Object} Human-readable configuration summary
   */
  getConfigSummary(config) {
    const wakeTimeMinutes = this._parseTime(config.wakeTime);
    const wakeHours = Math.floor(wakeTimeMinutes / 60);
    const wakeMins = wakeTimeMinutes % 60;
    const totalActivityMinutes = 1440 - wakeTimeMinutes;
    const designedDayMinutes = totalActivityMinutes - config.anotherHourDuration;

    return {
      wakeTime: {
        time: config.wakeTime,
        hours: wakeHours,
        minutes: wakeMins
      },
      nightPeriod: {
        duration: this.formatDuration(wakeTimeMinutes),
        hours: wakeHours,
        minutes: wakeMins
      },
      designedDay: {
        duration: this.formatDuration(designedDayMinutes),
        scaleFactor: designedDayMinutes > 0 ? (totalActivityMinutes / designedDayMinutes).toFixed(2) : '1.00'
      },
      anotherHour: {
        duration: this.formatDuration(config.anotherHourDuration),
        hours: Math.floor(config.anotherHourDuration / 60),
        minutes: config.anotherHourDuration % 60
      }
    };
  }
}