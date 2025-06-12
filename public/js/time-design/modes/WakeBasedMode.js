// public/js/time-design/modes/WakeBasedMode.js

import { BaseMode } from './BaseMode.js';

/**
 * WakeBasedMode - Time starts when you wake up
 * Dynamically scales remaining time based on wake time
 */
export class WakeBasedMode extends BaseMode {
  constructor() {
    super(
      'wake-based',
      'Wake-Based Mode',
      'Your day starts when you wake up, with dynamic time scaling'
    );
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      wakeTime: null, // Will be set on first use
      anotherHourDuration: 120, // 2 hours in minutes
      defaultWakeTime: 360, // 6:00 AM as default
      minimumDesignedPeriod: 720, // Minimum 12 hours of Designed time
      maximumScaleFactor: 2.0, // Maximum 2x speed
      autoDetectWake: false, // Future feature
      wakeHistory: [], // Track wake times for patterns
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

    // Validate Another Hour duration
    if (typeof config.anotherHourDuration !== 'number' || 
        config.anotherHourDuration < 0 || 
        config.anotherHourDuration > 360) {
      errors.push('Another Hour duration must be between 0 and 6 hours');
    }

    // Validate default wake time
    if (typeof config.defaultWakeTime !== 'number' || 
        config.defaultWakeTime < 0 || 
        config.defaultWakeTime >= 1440) {
      errors.push('Default wake time must be between 0:00 and 23:59');
    }

    // Validate minimum designed period
    if (typeof config.minimumDesignedPeriod !== 'number' || 
        config.minimumDesignedPeriod < 360 || 
        config.minimumDesignedPeriod > 1320) {
      errors.push('Minimum designed period must be between 6 and 22 hours');
    }

    // Validate maximum scale factor
    if (typeof config.maximumScaleFactor !== 'number' || 
        config.maximumScaleFactor < 1.0 || 
        config.maximumScaleFactor > 3.0) {
      errors.push('Maximum scale factor must be between 1.0 and 3.0');
    }

    // Validate wake time if set
    if (config.wakeTime !== null) {
      if (typeof config.wakeTime !== 'object' || !config.wakeTime.time) {
        errors.push('Invalid wake time format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate time based on wake time
   */
  calculate(date, timezone, config) {
    const now = new Date(date);
    const minutes = this.getMinutesSinceMidnight(now, timezone);

    // Get today's wake time
    const wakeInfo = this.getWakeTimeForDate(now, config, timezone);

    // If we haven't woken up yet today, use yesterday's cycle
    if (minutes < wakeInfo.wakeMinutes && !wakeInfo.isToday) {
      // Still in yesterday's cycle
      return this.calculateForYesterdaysCycle(now, timezone, config);
    }

    // Calculate time since wake
    const minutesSinceWake = this.getMinutesSinceWake(now, wakeInfo.wakeTime, timezone);

    // Calculate available time and scaling
    const scalingInfo = this.calculateScaling(minutesSinceWake, config);

    // Build segments
    const segments = this.buildSegments(wakeInfo, scalingInfo, config);

    // Find active segment
    const activeSegment = this.findActiveSegmentForWakeMode(minutesSinceWake, segments);

    if (!activeSegment) {
      throw new Error('No active segment found - wake time calculation error');
    }

    // Calculate display time
    const segmentElapsed = minutesSinceWake - activeSegment.startFromWake;
    let displayTime;
    let scaledElapsed;

    if (activeSegment.type === 'designed') {
      // Designed period - apply scaling
      scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
      displayTime = this.minutesToTime(scaledElapsed);
    } else {
      // Another Hour - normal time
      scaledElapsed = segmentElapsed;
      const ahStartHour = Math.floor(scalingInfo.designedDuration / 60);
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
        remaining: activeSegment.duration - segmentElapsed,
        wakeTime: this.formatTime(wakeInfo.wakeTime.getHours(), wakeInfo.wakeTime.getMinutes()),
        timeSinceWake: this.formatDuration(minutesSinceWake),
        scalingInfo: scalingInfo
      },
      displayString: this.formatTime(displayTime.hours, displayTime.minutes, displayTime.seconds),
      periodName: activeSegment.label,
      wakeBasedInfo: {
        wokeAt: wakeInfo.wakeTime,
        isToday: wakeInfo.isToday,
        hoursAwake: minutesSinceWake / 60,
        targetBedtime: new Date(wakeInfo.wakeTime.getTime() + 24 * 60 * 60 * 1000)
      }
    };
  }

  /**
   * Get wake time for a specific date
   */
  getWakeTimeForDate(date, config, timezone) {
    // Check if we have a wake time for today
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    if (config.wakeTime && config.wakeTime.date) {
      const wakeDate = new Date(config.wakeTime.date);
      if (wakeDate.toDateString() === today.toDateString()) {
        // We have today's wake time
        return {
          wakeTime: new Date(config.wakeTime.time),
          wakeMinutes: config.wakeTime.minutes,
          isToday: true
        };
      }
    }

    // Use default wake time for today
    const defaultWake = new Date(today);
    const defaultHours = Math.floor(config.defaultWakeTime / 60);
    const defaultMinutes = config.defaultWakeTime % 60;
    defaultWake.setHours(defaultHours, defaultMinutes, 0, 0);

    return {
      wakeTime: defaultWake,
      wakeMinutes: config.defaultWakeTime,
      isToday: false
    };
  }

  /**
   * Calculate minutes since wake time
   */
  getMinutesSinceWake(now, wakeTime, timezone) {
    const diff = now.getTime() - wakeTime.getTime();
    return Math.floor(diff / (1000 * 60));
  }

  /**
   * Calculate scaling based on wake time
   */
  calculateScaling(minutesSinceWake, config) {
    const hoursAwake = minutesSinceWake / 60;
    const remainingRealHours = Math.max(0, 24 - hoursAwake - (config.anotherHourDuration / 60));

    // Ensure minimum designed period
    const targetDesignedHours = Math.max(
      config.minimumDesignedPeriod / 60,
      24 - (config.anotherHourDuration / 60)
    );

    // Calculate scale factor
    let scaleFactor = remainingRealHours > 0 ? targetDesignedHours / remainingRealHours : 1;

    // Apply maximum scale factor limit
    scaleFactor = Math.min(scaleFactor, config.maximumScaleFactor);

    return {
      hoursAwake,
      remainingRealHours,
      targetDesignedHours,
      scaleFactor,
      designedDuration: remainingRealHours * 60, // in minutes
      willReachAH: remainingRealHours > 0
    };
  }

  /**
   * Build segments for wake-based mode
   */
  buildSegments(wakeInfo, scalingInfo, config) {
    const segments = [];

    if (scalingInfo.remainingRealHours > 0) {
      // Designed period
      segments.push({
        type: 'designed',
        startFromWake: 0,
        endFromWake: scalingInfo.designedDuration,
        duration: scalingInfo.designedDuration,
        scaleFactor: scalingInfo.scaleFactor,
        label: 'Designed Time'
      });

      // Another Hour period
      if (config.anotherHourDuration > 0) {
        segments.push({
          type: 'another',
          startFromWake: scalingInfo.designedDuration,
          endFromWake: scalingInfo.designedDuration + config.anotherHourDuration,
          duration: config.anotherHourDuration,
          scaleFactor: 1.0,
          label: 'Another Hour'
        });
      }
    } else {
      // Already past 24 hours - everything is Another Hour
      segments.push({
        type: 'another',
        startFromWake: 0,
        endFromWake: 1440,
        duration: 1440,
        scaleFactor: 1.0,
        label: 'Extended Day'
      });
    }

    return segments;
  }

  /**
   * Find active segment for wake-based mode
   */
  findActiveSegmentForWakeMode(minutesSinceWake, segments) {
    return segments.find(segment => 
      minutesSinceWake >= segment.startFromWake && 
      minutesSinceWake < segment.endFromWake
    ) || segments[segments.length - 1]; // Default to last segment
  }

  /**
   * Calculate for yesterday's cycle (before waking up today)
   */
  calculateForYesterdaysCycle(now, timezone, config) {
    // This is a simplified version - in production, would need to track yesterday's wake time
    const yesterdayWake = new Date(now);
    yesterdayWake.setDate(yesterdayWake.getDate() - 1);
    yesterdayWake.setHours(Math.floor(config.defaultWakeTime / 60), config.defaultWakeTime % 60, 0, 0);

    const minutesSinceWake = this.getMinutesSinceWake(now, yesterdayWake, timezone);

    // If more than 24 hours since yesterday's wake, we're in extended Another Hour
    return {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: now.getSeconds(),
      scaleFactor: 1.0,
      isAnotherHour: true,
      segmentInfo: {
        type: 'another',
        label: 'Extended Another Hour',
        progress: 0,
        elapsed: minutesSinceWake - 1440,
        duration: 1440,
        remaining: 0
      },
      displayString: this.formatTime(now.getHours(), now.getMinutes(), now.getSeconds()),
      periodName: 'Extended Another Hour (Waiting for Wake)',
      wakeBasedInfo: {
        wokeAt: yesterdayWake,
        isToday: false,
        hoursAwake: minutesSinceWake / 60,
        needsWakeTimeUpdate: true
      }
    };
  }

  /**
   * Record wake time
   */
  recordWakeTime(wakeTime, config) {
    const wakeMinutes = wakeTime.getHours() * 60 + wakeTime.getMinutes();

    // Update current wake time
    config.wakeTime = {
      time: wakeTime.toISOString(),
      date: wakeTime.toDateString(),
      minutes: wakeMinutes
    };

    // Add to history
    if (!config.wakeHistory) {
      config.wakeHistory = [];
    }

    config.wakeHistory.push({
      date: wakeTime.toDateString(),
      time: wakeTime.toISOString(),
      minutes: wakeMinutes
    });

    // Keep only last 30 days
    if (config.wakeHistory.length > 30) {
      config.wakeHistory = config.wakeHistory.slice(-30);
    }

    config.metadata.modified = new Date().toISOString();

    return config;
  }

  /**
   * Get average wake time from history
   */
  getAverageWakeTime(config) {
    if (!config.wakeHistory || config.wakeHistory.length === 0) {
      return config.defaultWakeTime;
    }

    const totalMinutes = config.wakeHistory.reduce((sum, entry) => sum + entry.minutes, 0);
    return Math.round(totalMinutes / config.wakeHistory.length);
  }
}