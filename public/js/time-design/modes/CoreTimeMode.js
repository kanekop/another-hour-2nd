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
      'Define your productive hours with Another Hour periods before and after.',
      {
        morningAH_start: { type: 'time', label: 'Morning AH Start', default: '05:00' },
        morningAH_duration: { type: 'number', label: 'Morning AH Duration (minutes)', min: 0, default: 120 },
        eveningAH_duration: { type: 'number', label: 'Evening AH Duration (minutes)', min: 0, default: 120 },
        eveningAH_end: { type: 'time', label: 'Evening AH End', default: '24:00' },
      }
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      morningAH_start: '05:00',
      morningAH_duration: 120,
      eveningAH_duration: 120,
      eveningAH_end: '24:00', // Represents 24:00 which is end of day
    };
  }

  _parseTime(timeStr) {
    if (timeStr === '24:00') return 1440;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Validate configuration
   */
  validate(config) {
    const errors = [];
    try {
      const morningStart = this._parseTime(config.morningAH_start);
      const morningDuration = Number(config.morningAH_duration);
      const eveningDuration = Number(config.eveningAH_duration);
      const eveningEnd = this._parseTime(config.eveningAH_end);

      const coreStart = morningStart + morningDuration;
      const coreEnd = eveningEnd - eveningDuration;
      const coreDuration = coreEnd - coreStart;

      if (coreDuration < 0) errors.push('Core Time duration cannot be negative. Check AH durations and times.');
      if (totalAH > 1439) errors.push('Total Another Hour time cannot exceed 24 hours.');

    } catch (e) {
      errors.push('Invalid time format in config.');
    }

    return { valid: errors.length === 0, errors };
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
    const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;

    let displayHours, displayMinutes, displaySeconds;

    if (activeSegment.type === 'another') {
      const d = new Date(date);
      displayHours = d.getHours();
      displayMinutes = d.getMinutes();
      displaySeconds = d.getSeconds();
    } else { // 'designed'
      const coreTimeStartAsDesigned = this._buildSegments(config).filter(s => s.type === 'another' && s.endTime <= activeSegment.startTime).reduce((acc, s) => acc + (s.endTime - s.startTime), 0) / 60;

      const scaledTotalMinutes = (coreTimeStartAsDesigned * 60) + scaledElapsed;
      displayHours = Math.floor(scaledTotalMinutes / 60) % 24;
      displayMinutes = Math.floor(scaledTotalMinutes % 60);
      displaySeconds = Math.floor((scaledTotalMinutes * 60) % 60);
    }

    const hourAngle = (displayHours % 12 + displayMinutes / 60) * 30;
    const minuteAngle = (displayMinutes + displaySeconds / 60) * 6;
    const secondAngle = displaySeconds * 6;

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: displaySeconds,
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: { type: activeSegment.type, label: activeSegment.label },
      hourAngle, minuteAngle, secondAngle,
    };
  }

  _buildSegments(config) {
    const segments = [];
    const morningStart = this._parseTime(config.morningAH_start);
    const morningDuration = Number(config.morningAH_duration);
    const eveningDuration = Number(config.eveningAH_duration);
    const eveningEnd = this._parseTime(config.eveningAH_end);

    const morningEnd = morningStart + morningDuration;
    const coreStart = morningEnd;
    const coreEnd = eveningEnd - eveningDuration;
    const coreDuration = coreEnd - coreStart;

    if (coreDuration < 0) return []; // Invalid config

    // Morning AH
    if (morningDuration > 0) {
      segments.push(this.createSegment('another', 0, morningStart, 1.0, 'Pre-Morning'));
      segments.push(this.createSegment('another', morningStart, morningEnd, 1.0, 'Morning AH'));
    }

    // Core Time
    const coreScaleFactor = coreDuration > 0 ? (24 * 60) / coreDuration : 1;
    segments.push(this.createSegment('designed', coreStart, coreEnd, coreScaleFactor, 'Core Time'));

    // Evening AH
    if (eveningDuration > 0) {
      segments.push(this.createSegment('another', coreEnd, eveningEnd, 1.0, 'Evening AH'));
      segments.push(this.createSegment('another', eveningEnd, 1440, 1.0, 'Post-Evening'));
    }

    // Fill gaps
    segments.sort((a, b) => a.startTime - b.startTime);
    const filledSegments = [];
    let lastEnd = 0;
    for (const seg of segments) {
      if (seg.startTime > lastEnd) {
        filledSegments.push(this.createSegment('another', lastEnd, seg.startTime, 1.0, 'Gap'));
      }
      filledSegments.push(seg);
      lastEnd = seg.endTime;
    }
    if (lastEnd < 1440) {
      filledSegments.push(this.createSegment('another', lastEnd, 1440, 1.0, 'Gap'));
    }

    return filledSegments;
  }

  /**
   * Get configuration summary for display
   */
  getConfigSummary(config) {
    const morningAHEnd = this._parseTime(config.morningAH_start) + Number(config.morningAH_duration);
    const eveningAHStart = this._parseTime(config.eveningAH_end) - Number(config.eveningAH_duration);
    const coreDuration = eveningAHStart - this._parseTime(config.morningAH_start);

    return {
      morningAH: {
        start: this.minutesToTimeString(this._parseTime(config.morningAH_start)),
        end: this.minutesToTimeString(morningAHEnd),
        duration: this.formatDuration(Number(config.morningAH_duration))
      },
      coreTime: {
        start: this.minutesToTimeString(this._parseTime(config.morningAH_start)),
        end: this.minutesToTimeString(eveningAHStart),
        duration: this.formatDuration(coreDuration),
        scaleFactor: (1440 / coreDuration).toFixed(2)
      },
      eveningAH: {
        start: this.minutesToTimeString(eveningAHStart),
        end: this.minutesToTimeString(this._parseTime(config.eveningAH_end)),
        duration: this.formatDuration(Number(config.eveningAH_duration))
      },
      totalAH: this.formatDuration(Number(config.morningAH_duration) + Number(config.eveningAH_duration))
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
