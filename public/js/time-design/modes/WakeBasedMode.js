// WakeBasedMode.js - Another Hour period based on wake time
import { BaseMode } from './BaseMode.js';

export class WakeBasedMode extends BaseMode {
  constructor() {
    super(
      'wake-based',
      'Wake-Based Mode',
      'Another Hour period starts after waking up'
    );
  }

  getDefaultConfig() {
    return {
      anotherHourDuration: 90, // minutes
      defaultWakeTime: 420, // 7:00 AM in minutes
      wakeTime: null // { time: Date, date: string }
    };
  }

  validate(config) {
    const errors = [];
    
    if (typeof config.anotherHourDuration !== 'number' || config.anotherHourDuration < 0) {
      errors.push('Another Hour duration must be a positive number');
    }
    
    if (typeof config.defaultWakeTime !== 'number' || config.defaultWakeTime < 0 || config.defaultWakeTime >= 1440) {
      errors.push('Default wake time must be between 0 and 1439 minutes');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculate(date, timezone, config) {
    const now = new Date(date);
    const today = now.toDateString();

    // Determine wake time for today
    let wakeTime = config.defaultWakeTime;
    if (config.wakeTime && config.wakeTime.date === today) {
      const wakeDate = new Date(config.wakeTime.time);
      wakeTime = wakeDate.getHours() * 60 + wakeDate.getMinutes();
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const anotherHourStart = wakeTime;
    const anotherHourEnd = wakeTime + config.anotherHourDuration;

    // Check if in Another Hour period
    const isAnotherHour = currentMinutes >= anotherHourStart && currentMinutes < anotherHourEnd;

    let scaleFactor = 1;
    let periodName = 'Standard Time';
    let segmentInfo = {
      type: 'standard',
      label: 'Regular Time',
      progress: 0,
      remaining: 0
    };

    if (isAnotherHour) {
      scaleFactor = 0.5;
      periodName = 'Another Hour';

      const progress = (currentMinutes - anotherHourStart) / config.anotherHourDuration;
      segmentInfo = {
        type: 'designed',
        label: 'Post-Wake AH',
        progress: progress * 100,
        remaining: anotherHourEnd - currentMinutes
      };
    }

    // Calculate time since wake
    const hoursAwake = Math.max(0, (currentMinutes - wakeTime) / 60);

    // Calculate scaled time
    const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const scaledSeconds = totalSeconds * scaleFactor;

    const hours = Math.floor(scaledSeconds / 3600) % 24;
    const minutes = Math.floor((scaledSeconds % 3600) / 60);
    const seconds = scaledSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      periodName,
      scaleFactor,
      segmentInfo,
      wakeBasedInfo: {
        wakeTime: wakeTime,
        hoursAwake: hoursAwake
      }
    };
  }

  recordWakeTime(wakeTime, config) {
    return {
      ...config,
      wakeTime: {
        time: wakeTime.getTime(),
        date: wakeTime.toDateString()
      }
    };
  }
}