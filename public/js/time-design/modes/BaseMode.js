// BaseMode.js - Abstract base class for Time Design Modes

class BaseMode {
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

  // Utility methods available to all modes
  getMinutesSinceMidnight(date, timezone) {
    // Convert to specified timezone
    const localDate = new Date(date.toLocaleString("en-US", {timeZone: timezone}));
    return localDate.getHours() * 60 + localDate.getMinutes();
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
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BaseMode };
} else {
  window.BaseMode = BaseMode;
}