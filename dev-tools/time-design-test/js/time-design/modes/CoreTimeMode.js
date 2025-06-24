// public/js/time-design/modes/CoreTimeMode.js

import { BaseMode } from './BaseMode.js';

/**
 * CoreTimeMode - Define productive hours with Another Hour periods before and after
 */
export class CoreTimeMode extends BaseMode {
  static getDefaultConfig() {
    return {
      coreTimeStart: 480, // 08:00
      coreTimeEnd: 1020, // 17:00
      dayHours: 12,
    };
  }

  constructor() {
    super(
      'core-time',
      'Core Time Mode',
      'Define your productive hours, with Another Hour periods filling the rest of the day.', {
      coreTimeStart: { type: 'number', label: 'Core Time Start', default: 540 }, // 9:00 AM
      coreTimeEnd: { type: 'number', label: 'Core Time End', default: 1020 },   // 5:00 PM
    }
    );
  }

  getDefaultConfig() {
    return {
      coreTimeStart: 540, // 9:00 AM in minutes from midnight
      coreTimeEnd: 1020,  // 5:00 PM in minutes from midnight
    };
  }

  _parseTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  validate(config) {
    const errors = [];
    if (config.coreTimeStart === undefined || config.coreTimeEnd === undefined) {
      errors.push('Core time start and end must be defined.');
    }
    if (config.coreTimeStart >= config.coreTimeEnd) {
      errors.push('Core Time start must be before Core Time end.');
    }
    return { valid: errors.length === 0, errors };
  }

  _buildSegments(config) {
    const coreStart = config.coreTimeStart;
    const coreEnd = config.coreTimeEnd;
    const coreDuration = coreEnd - coreStart;

    if (coreDuration <= 0) return []; // Invalid config

    const coreScaleFactor = (24 * 60) / coreDuration;

    const segments = [
      this.createSegment('another', 0, coreStart, 1.0, 'Morning AH'),
      this.createSegment('designed', coreStart, coreEnd, coreScaleFactor, 'Core Time'),
      this.createSegment('another', coreEnd, 1440, 1.0, 'Evening AH'),
    ];

    return segments.filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const start = config.coreTimeStart;
    const end = config.coreTimeEnd;

    const coreDuration = (end - start + 1440) % 1440;
    const morningAHRealDuration = (start - 0 + 1440) % 1440;
    const eveningAHRealDuration = (0 - end + 1440) % 1440;
    const totalRealAADuration = morningAHRealDuration + eveningAHRealDuration;
    const targetCoreDuration = 1440 - totalRealAADuration;
    const scaleFactorCore = coreDuration === 0 ? 1 : targetCoreDuration / coreDuration;

    let periodName, isAnotherHour, progress, remaining, scaleFactor, ahMinutes;

    const inCore = start <= end
      ? minutes >= start && minutes < end
      : minutes >= start || minutes < end;

    if (inCore) {
      periodName = 'Core Time';
      isAnotherHour = false;
      const elapsed = (minutes - start + 1440) % 1440;
      progress = coreDuration > 0 ? elapsed / coreDuration : 0;
      remaining = coreDuration - elapsed;
      scaleFactor = scaleFactorCore;
      ahMinutes = morningAHRealDuration + elapsed * scaleFactorCore;
    } else {
      const inMorning = minutes < start && start <= end || (start > end && minutes >= end && minutes < start);
      if (inMorning) {
        periodName = 'Morning AH';
        isAnotherHour = true;
        const elapsed = (minutes - 0 + 1440) % 1440;
        progress = morningAHRealDuration > 0 ? elapsed / morningAHRealDuration : 0;
        remaining = morningAHRealDuration - elapsed;
        scaleFactor = 1;
        ahMinutes = elapsed;
      } else {
        periodName = 'Evening AH';
        isAnotherHour = true;
        const elapsed = (minutes - end + 1440) % 1440;
        progress = eveningAHRealDuration > 0 ? elapsed / eveningAHRealDuration : 0;
        remaining = eveningAHRealDuration - elapsed;
        scaleFactor = 1;
        ahMinutes = morningAHRealDuration + coreDuration * scaleFactorCore + elapsed;
      }
    }

    const hours = Math.floor(ahMinutes / 60) % 24;
    const minutesOut = Math.floor(ahMinutes % 60);
    const seconds = Math.floor((ahMinutes * 60) % 60);

    const duration = isAnotherHour ? (periodName === 'Morning AH' ? morningAHRealDuration : eveningAHRealDuration) : coreDuration;

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
      },
      periodName,
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
      shortLabel: segment.type === 'designed' ? 'Core' : segment.label.includes('Morning') ? 'AM' : 'PM',
      startMinutes: segment.startTime,
      durationMinutes: segment.duration,
      scaleFactor: segment.scaleFactor
    }));
  }

  /**
   * Collects configuration from the UI elements.
   * @returns {object} The configuration object.
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
    // Return a default or empty object if the slider isn't ready
    return {};
  }
}