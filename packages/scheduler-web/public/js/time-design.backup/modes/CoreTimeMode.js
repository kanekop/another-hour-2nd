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
    const segments = this._buildSegments(config);
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      return { hours: date.getHours(), minutes: date.getMinutes(), seconds: date.getSeconds(), scaleFactor: 1, isAnotherHour: true, segmentInfo: { type: 'another', label: 'Error' } };
    }

    const { progress, remaining } = this.calculateProgress(minutes, activeSegment);
    
    // segmentElapsedを最初に定義
    const segmentElapsed = minutes - activeSegment.startTime;

    let displayHours, displayMinutes, displaySeconds;

    if (activeSegment.type === 'another') {
      // Another Hour期間の経過時間を計算（0から開始）
      // 0時起点の時間として計算
      displayHours = Math.floor(segmentElapsed / 60);
      displayMinutes = Math.floor(segmentElapsed % 60);
      displaySeconds = Math.floor((segmentElapsed * 60) % 60);
    } else { // 'designed'
      const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
      const totalDesignedMinutes = scaledElapsed;

      displayHours = Math.floor(totalDesignedMinutes / 60) % 24;
      displayMinutes = Math.floor(totalDesignedMinutes % 60);
      displaySeconds = Math.floor((totalDesignedMinutes * 60) % 60);
    }

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
        duration: activeSegment.duration,
        // Another Hour用の追加情報
        elapsed: activeSegment.type === 'another' ? segmentElapsed : undefined,
        total: activeSegment.type === 'another' ? activeSegment.duration : undefined,
        displayFormat: activeSegment.type === 'another' ? 'fraction' : 'normal'
      },
      periodName: activeSegment.label,
    };
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