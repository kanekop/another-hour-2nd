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
      'Define your productive hours with Another Hour periods before and after.', {
      morningAH_start: { type: 'time', label: 'Morning AH Start', default: '05:00' },
      morningAH_duration: { type: 'number', label: 'Morning AH Duration (minutes)', min: 0, default: 120 },
      eveningAH_duration: { type: 'number', label: 'Evening AH Duration (minutes)', min: 0, default: 120 },
      eveningAH_end: { type: 'time', label: 'Evening AH End', default: '24:00' },
    }
    );
  }

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
      const totalAH = morningDuration + eveningDuration;
      if (totalAH > 1439) errors.push('Total Another Hour time cannot exceed 24 hours.');

    } catch (e) {
      errors.push('Invalid time format in config.');
    }

    return { valid: errors.length === 0, errors };
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

    const coreScaleFactor = coreDuration > 0 ? (24 * 60) / coreDuration : 1;

    // This logic creates a continuous timeline from 0 to 1440
    let lastEnd = 0;

    // Before morning AH
    if (morningStart > 0) {
      segments.push(this.createSegment('another', 0, morningStart, 1.0, 'Night'));
    }
    lastEnd = morningStart;

    // Morning AH
    if (morningDuration > 0) {
      segments.push(this.createSegment('another', morningStart, morningEnd, 1.0, 'Morning AH'));
    }
    lastEnd = morningEnd;

    // Core Time
    segments.push(this.createSegment('designed', coreStart, coreEnd, coreScaleFactor, 'Core Time'));
    lastEnd = coreEnd;

    // Evening AH
    if (eveningDuration > 0) {
      segments.push(this.createSegment('another', coreEnd, eveningEnd, 1.0, 'Evening AH'));
    }
    lastEnd = eveningEnd;

    // After evening AH
    if (lastEnd < 1440) {
      segments.push(this.createSegment('another', lastEnd, 1440, 1.0, 'Night'));
    }

    return segments.filter(s => s.duration > 0);
  }

  calculate(date, timezone, config) {
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      // Fallback for safety
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds(), scaleFactor: 1, isAnotherHour: true, segmentInfo: { type: 'another', label: 'Error' } };
    }

    let displayHours, displayMinutes, displaySeconds;

    if (activeSegment.type === 'another') {
      const d = new Date(date);
      displayHours = d.getHours();
      displayMinutes = d.getMinutes();
      displaySeconds = d.getSeconds();
    } else { // 'designed'
      let designedMinutesPassed = 0;
      for (const seg of segments) {
        if (seg.endTime <= activeSegment.startTime) {
          if (seg.type === 'designed') {
            designedMinutesPassed += seg.duration * seg.scaleFactor;
          } else {
            // In CoreTime mode, AH doesn't contribute to the 24h designed day
          }
        }
      }

      const segmentElapsed = minutes - activeSegment.startTime;
      const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
      const totalDesignedMinutes = designedMinutesPassed + scaledElapsed;

      displayHours = Math.floor(totalDesignedMinutes / 60) % 24;
      displayMinutes = Math.floor(totalDesignedMinutes % 60);
      displaySeconds = Math.floor((totalDesignedMinutes * 60) % 60);
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
}