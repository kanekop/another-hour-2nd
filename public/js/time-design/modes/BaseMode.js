
// BaseMode.js - Base class for all Time Design Modes

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string[]} [errors]
 */

/**
 * @typedef {Object} TimeCalculationResult
 * @property {number} hours
 * @property {number} minutes
 * @property {number} seconds
 * @property {number} scaleFactor
 * @property {boolean} isAnotherHour
 * @property {object} segmentInfo
 */

export class BaseMode {
  constructor(id, name, description, configSchema) {
    if (this.constructor === BaseMode) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.id = id;
    this.name = name;
    this.description = description;
    this.configSchema = configSchema || {};
  }

  /**
   * @param {object} config
   * @returns {ValidationResult}
   */
  validate(config) {
    throw new Error('validate() must be implemented');
  }

  /**
   * @param {Date} date
   * @param {string} timezone
   * @param {object} config
   * @returns {TimeCalculationResult}
   */
  calculate(date, timezone, config) {
    throw new Error('calculate() must be implemented');
  }

  /**
   * @returns {object}
   */
  getDefaultConfig() {
    throw new Error('getDefaultConfig() must be implemented');
  }

  // --- Common utility methods ---

  createSegment(type, startTime, endTime, scaleFactor, label) {
    return {
      id: `${type}-${startTime}-${endTime}`,
      type,
      startTime,
      endTime,
      scaleFactor,
      label
    };
  }

  getMinutesSinceMidnight(date, timezone) {
    const localTime = moment(date).tz(timezone);
    return localTime.hours() * 60 + localTime.minutes();
  }

  findActiveSegment(minutes, segments) {
    return segments.find(segment =>
      minutes >= segment.startTime && minutes < segment.endTime
    );
  }

  getName() {
    throw new Error('getName() must be implemented by subclass');
  }

  getDisplayName() {
    throw new Error('getDisplayName() must be implemented by subclass');
  }

  getDescription() {
    throw new Error('getDescription() must be implemented by subclass');
  }

  getConfigSchema() {
    return {};
  }

  calculateAngles(date, timezone, config) {
    throw new Error('calculateAngles() must be implemented by subclass');
  }

  // Utility methods for angle calculations
  timeToAngle(hours, minutes, seconds = 0) {
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    return (totalMinutes / (24 * 60)) * 360;
  }

  normalizeAngle(angle) {
    while (angle < 0) angle += 360;
    while (angle >= 360) angle -= 360;
    return angle;
  }

  // Standard time calculations
  getStandardAngles(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return {
      hourAngle: this.normalizeAngle((hours % 12) * 30 + minutes * 0.5 + seconds * (0.5 / 60)),
      minuteAngle: this.normalizeAngle(minutes * 6 + seconds * 0.1),
      secondAngle: this.normalizeAngle(seconds * 6)
    };
  }
}
