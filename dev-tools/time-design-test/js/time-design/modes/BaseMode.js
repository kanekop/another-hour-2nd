// BaseMode.js - Abstract base class for Time Design Modes

export class BaseMode {
  constructor(id, name, description, configSchema = {}) {
    if (this.constructor === BaseMode) {
      throw new Error('BaseMode is an abstract class and cannot be instantiated directly');
    }

    this.id = id;
    this.name = name;
    this.description = description;
    this.configSchema = configSchema;
  }

  // Get mode name
  getName() {
    return this.name;
  }

  // Abstract methods that must be implemented by subclasses
  getDefaultConfig() {
    throw new Error('getDefaultConfig() must be implemented by subclass');
  }

  validate(config) {
    throw new Error('validate() must be implemented by subclass');
  }

  calculate(date, timezone, config) {
    throw new Error('calculate() must be implemented by subclass');
  }

  collectConfigFromUI() {
    throw new Error('collectConfigFromUI() must be implemented by subclass');
  }

  // Utility methods available to all modes
  getMinutesSinceMidnight(date, timezone) {
    // Use moment.js if available, otherwise fallback to basic calculation
    if (typeof moment !== 'undefined' && typeof moment.tz !== 'undefined') {
      // Use moment.tz to interpret the date directly in the target timezone
      const localTime = moment.tz(date, timezone);

      // Add a validity check for robustness
      if (!localTime.isValid()) {
        console.error("Could not create a valid moment object.", { date, timezone });
        return NaN;
      }
      return localTime.hours() * 60 + localTime.minutes() + localTime.seconds() / 60 + localTime.milliseconds() / 60000;
    } else {
      // Fallback: convert to specified timezone
      const localDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
      return localDate.getHours() * 60 + localDate.getMinutes() + localDate.getSeconds() / 60 + localDate.getMilliseconds() / 60000;
    }
  }

  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  createSegment(type, startTime, endTime, scaleFactor, label) {
    return {
      type,           // 'designed' or 'another'
      startTime,      // minutes since midnight
      endTime,        // minutes since midnight
      scaleFactor,    // time scaling factor
      label,          // human-readable label
      duration: endTime - startTime
    };
  }

  findActiveSegment(currentMinutes, segments) {
    return segments.find(segment =>
      currentMinutes >= segment.startTime && currentMinutes < segment.endTime
    );
  }

  calculateProgress(currentMinutes, segment) {
    if (!segment) return { progress: 0, remaining: 0 };

    const elapsed = currentMinutes - segment.startTime;
    const progress = (elapsed / segment.duration) * 100;
    const remaining = segment.duration - elapsed;

    return {
      progress: Math.max(0, Math.min(100, progress)),
      remaining: Math.max(0, remaining)
    };
  }
}
