/**
 * CoreTimeMode.js - Define productive hours with Another Hour periods
 * 
 * This is the unified implementation combining the best practices from both
 * dev-tools and scheduler-web implementations.
 * 
 * Core Time Mode consists of:
 * - Morning Another Hour: Real-time period before core time
 * - Core Time: Scaled productive hours (typically 9 AM - 5 PM)
 * - Evening Another Hour: Real-time period after core time
 * 
 * @author Another Hour Team
 * @version 1.0.0
 */

import { BaseMode } from './BaseMode.js';

/**
 * CoreTimeMode - Define productive hours with Another Hour periods before and after
 */
export class CoreTimeMode extends BaseMode {
  constructor() {
    super(
      'core-time',
      'Core Time Mode',
      'Define your productive hours, with Another Hour periods filling the rest of the day.',
      {
        coreTimeStart: { 
          type: 'number', 
          label: 'Core Time Start (minutes from midnight)', 
          min: 0,
          max: 1439,
          default: 540 // 9:00 AM
        },
        coreTimeEnd: { 
          type: 'number', 
          label: 'Core Time End (minutes from midnight)', 
          min: 1,
          max: 1440,
          default: 1020 // 5:00 PM
        }
      }
    );
  }

  /**
   * Get default configuration for Core Time Mode
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      coreTimeStart: 540, // 9:00 AM in minutes from midnight
      coreTimeEnd: 1020,  // 5:00 PM in minutes from midnight
    };
  }

  /**
   * Static method to get default configuration
   * @static
   * @returns {Object} Default configuration
   */
  static getDefaultConfig() {
    return {
      coreTimeStart: 480, // 8:00 AM (for compatibility)
      coreTimeEnd: 1020,  // 5:00 PM
      dayHours: 12,       // Legacy compatibility
    };
  }

  /**
   * Validate configuration for Core Time Mode
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validate(config) {
    const errors = [];
    
    if (config.coreTimeStart === undefined || config.coreTimeEnd === undefined) {
      errors.push('Core time start and end must be defined.');
    }
    
    if (typeof config.coreTimeStart !== 'number' || typeof config.coreTimeEnd !== 'number') {
      errors.push('Core time start and end must be numbers.');
    }
    
    if (config.coreTimeStart < 0 || config.coreTimeStart >= 1440) {
      errors.push('Core time start must be between 0 and 1439 minutes.');
    }
    
    if (config.coreTimeEnd <= 0 || config.coreTimeEnd > 1440) {
      errors.push('Core time end must be between 1 and 1440 minutes.');
    }
    
    if (config.coreTimeStart >= config.coreTimeEnd) {
      errors.push('Core Time start must be before Core Time end.');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Collect configuration from UI elements
   * @returns {Object} Configuration object from UI
   */
  collectConfigFromUI() {
    const slider = document.getElementById('coreTimeSlider');
    if (slider && slider.noUiSlider) {
      const values = slider.noUiSlider.get();
      return {
        coreTimeStart: parseInt(values[0], 10),
        coreTimeEnd: parseInt(values[1], 10)
      };
    }
    // Return default if slider isn't ready
    return this.getDefaultConfig();
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
   * Build time segments for Core Time Mode
   * @private
   * @param {Object} config - Mode configuration
   * @returns {Array} Array of time segments
   */
  _buildSegments(config) {
    const coreStart = config.coreTimeStart;
    const coreEnd = config.coreTimeEnd;
    const coreDuration = coreEnd - coreStart;

    if (coreDuration <= 0) return []; // Invalid config

    // Core time is scaled to fit 24 hours
    const coreScaleFactor = (24 * 60) / coreDuration;

    const segments = [
      this.createSegment('another', 0, coreStart, 1.0, 'Morning AH'),
      this.createSegment('designed', coreStart, coreEnd, coreScaleFactor, 'Core Time'),
      this.createSegment('another', coreEnd, 1440, 1.0, 'Evening AH'),
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
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const start = config.coreTimeStart;
    const end = config.coreTimeEnd;

    const coreDuration = (end - start + 1440) % 1440;
    const morningAHRealDuration = (start - 0 + 1440) % 1440;
    const eveningAHRealDuration = (1440 - end + 1440) % 1440;
    const totalRealAHDuration = morningAHRealDuration + eveningAHRealDuration;
    const targetCoreDuration = 1440 - totalRealAHDuration;
    const scaleFactorCore = coreDuration === 0 ? 1 : targetCoreDuration / coreDuration;

    let periodName, isAnotherHour, progress, remaining, scaleFactor, ahMinutes;

    // Determine if current time is within core time
    const inCore = start <= end
      ? minutes >= start && minutes < end
      : minutes >= start || minutes < end;

    if (inCore) {
      // Core Time period - scaled time
      periodName = 'Core Time';
      isAnotherHour = false;
      const elapsed = (minutes - start + 1440) % 1440;
      progress = coreDuration > 0 ? elapsed / coreDuration : 0;
      remaining = coreDuration - elapsed;
      scaleFactor = scaleFactorCore;
      ahMinutes = morningAHRealDuration + elapsed * scaleFactorCore;
    } else {
      // Another Hour periods - real time
      const inMorning = minutes < start && start <= end || (start > end && minutes >= end && minutes < start);
      if (inMorning) {
        // Morning Another Hour
        periodName = 'Morning AH';
        isAnotherHour = true;
        const elapsed = (minutes - 0 + 1440) % 1440;
        progress = morningAHRealDuration > 0 ? elapsed / morningAHRealDuration : 0;
        remaining = morningAHRealDuration - elapsed;
        scaleFactor = 1;
        ahMinutes = elapsed;
      } else {
        // Evening Another Hour
        periodName = 'Evening AH';
        isAnotherHour = true;
        const elapsed = (minutes - end + 1440) % 1440;
        progress = eveningAHRealDuration > 0 ? elapsed / eveningAHRealDuration : 0;
        remaining = eveningAHRealDuration - elapsed;
        scaleFactor = 1;
        ahMinutes = morningAHRealDuration + coreDuration * scaleFactorCore + elapsed;
      }
    }

    let hours, minutesOut, seconds;
    
    if (isAnotherHour) {
      // Another Hour periods: show elapsed time from 0:00:00
      const elapsed = periodName === 'Morning AH' 
        ? (minutes - 0 + 1440) % 1440 
        : (minutes - end + 1440) % 1440;
      
      hours = Math.floor(elapsed / 60);
      minutesOut = Math.floor(elapsed % 60);
      seconds = Math.floor((elapsed * 60) % 60);
    } else {
      // Core Time: show cumulative scaled time
      hours = Math.floor(ahMinutes / 60) % 24;
      minutesOut = Math.floor(ahMinutes % 60);
      seconds = Math.floor((ahMinutes * 60) % 60);
    }

    const duration = isAnotherHour ? 
      (periodName === 'Morning AH' ? morningAHRealDuration : eveningAHRealDuration) : 
      coreDuration;

    return {
      hours,
      minutes: minutesOut,
      seconds,
      scaleFactor,
      isAnotherHour,
      segmentInfo: {
        type: isAnotherHour ? 'another' : 'designed',
        label: periodName,
        progress,
        remaining,
        duration,
        // Another Hour specific information for UI
        elapsed: isAnotherHour ? (periodName === 'Morning AH' 
          ? (minutes - 0 + 1440) % 1440 
          : (minutes - end + 1440) % 1440) : undefined,
        total: isAnotherHour ? duration : undefined,
        displayFormat: isAnotherHour ? 'fraction' : 'normal'
      },
      periodName,
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
      shortLabel: segment.type === 'designed' ? 'Core' : segment.label.includes('Morning') ? 'AM' : 'PM',
      startMinutes: segment.startTime,
      durationMinutes: segment.duration,
      scaleFactor: segment.scaleFactor
    }));
  }

  /**
   * Get configuration summary for display purposes
   * @param {Object} config - Mode configuration
   * @returns {Object} Human-readable configuration summary
   */
  getConfigSummary(config) {
    const coreStartHours = Math.floor(config.coreTimeStart / 60);
    const coreStartMinutes = config.coreTimeStart % 60;
    const coreEndHours = Math.floor(config.coreTimeEnd / 60);
    const coreEndMinutes = config.coreTimeEnd % 60;
    const coreDuration = config.coreTimeEnd - config.coreTimeStart;

    return {
      coreTime: {
        start: `${coreStartHours.toString().padStart(2, '0')}:${coreStartMinutes.toString().padStart(2, '0')}`,
        end: `${coreEndHours.toString().padStart(2, '0')}:${coreEndMinutes.toString().padStart(2, '0')}`,
        duration: this.formatDuration(coreDuration)
      },
      morningAH: {
        duration: this.formatDuration(config.coreTimeStart)
      },
      eveningAH: {
        duration: this.formatDuration(1440 - config.coreTimeEnd)
      },
      scaleFactor: coreDuration > 0 ? (1440 / coreDuration).toFixed(2) : '1.00'
    };
  }
}