/**
 * BaseMode.js - Abstract base class for Time Design Modes
 * 
 * This is the unified implementation combining the best practices from both
 * dev-tools and scheduler-web implementations. Since both versions were
 * identical, this maintains the complete functionality.
 * 
 * @author Another Hour Team
 * @version 1.0.0
 */

/**
 * Abstract base class for all Time Design Modes
 * 
 * All Time Design Modes must extend this class and implement the required
 * abstract methods. This class provides common utilities and enforces
 * a consistent interface across all modes.
 */
export class BaseMode {
  /**
   * Constructor for BaseMode
   * 
   * @param {string} id - Unique identifier for this mode
   * @param {string} name - Human-readable name for this mode
   * @param {string} description - Description of what this mode does
   * @param {Object} configSchema - Schema defining the configuration options
   */
  constructor(id, name, description, configSchema = {}) {
    if (this.constructor === BaseMode) {
      throw new Error('BaseMode is an abstract class and cannot be instantiated directly');
    }

    this.id = id;
    this.name = name;
    this.description = description;
    this.configSchema = configSchema;
  }

  /**
   * Get the human-readable name of this mode
   * @returns {string} The mode name
   */
  getName() {
    return this.name;
  }

  // ========================================
  // Abstract methods - must be implemented by subclasses
  // ========================================

  /**
   * Get the default configuration for this mode
   * @abstract
   * @returns {Object} Default configuration object
   * @throws {Error} If not implemented by subclass
   */
  getDefaultConfig() {
    throw new Error('getDefaultConfig() must be implemented by subclass');
  }

  /**
   * Validate a configuration object for this mode
   * @abstract
   * @param {Object} config - Configuration to validate
   * @returns {Object} Validation result with { valid: boolean, errors: string[] }
   * @throws {Error} If not implemented by subclass
   */
  validate(config) {
    throw new Error('validate() must be implemented by subclass');
  }

  /**
   * Calculate the current Another Hour time based on real time and config
   * @abstract
   * @param {Date} date - Current real date/time
   * @param {string} timezone - Timezone identifier (e.g., 'America/New_York')
   * @param {Object} config - Mode-specific configuration
   * @returns {Object} Time calculation result
   * @throws {Error} If not implemented by subclass
   */
  calculate(date, timezone, config) {
    throw new Error('calculate() must be implemented by subclass');
  }

  /**
   * Collect configuration from UI elements
   * @abstract
   * @returns {Object} Configuration object from UI
   * @throws {Error} If not implemented by subclass
   */
  collectConfigFromUI() {
    throw new Error('collectConfigFromUI() must be implemented by subclass');
  }

  // ========================================
  // Utility methods available to all modes
  // ========================================

  /**
   * Get minutes elapsed since midnight in a specific timezone
   * 
   * Uses moment.js for robust timezone handling when available,
   * falls back to basic calculation otherwise.
   * 
   * @param {Date} date - The date to convert
   * @param {string} timezone - Target timezone
   * @returns {number} Minutes since midnight (0-1439)
   */
  getMinutesSinceMidnight(date, timezone) {
    // Use moment.js if available, otherwise fallback to basic calculation
    if (typeof moment !== 'undefined' && typeof moment.tz !== 'undefined') {
      // 正しい方法: Dateオブジェクトをmomentオブジェクトに変換してからタイムゾーンを適用
      const localTime = moment(date).tz(timezone);
      
      if (!localTime.isValid()) {
        console.error(`Invalid date or timezone: date=${date}, timezone=${timezone}`);
        // Fallback to basic calculation
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return hours * 60 + minutes;
      }
      
      return localTime.hours() * 60 + localTime.minutes();
    } else {
      // Fallback to basic calculation
      const hours = date.getHours();
      const minutes = date.getMinutes();
      return hours * 60 + minutes;
    }
  }

  /**
   * Format a duration in minutes to human-readable string
   * 
   * @param {number} minutes - Duration in minutes
   * @returns {string} Formatted duration (e.g., "2h 30m" or "45m")
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  /**
   * Create a time segment for timeline display
   * 
   * @param {string} type - Segment type ('designed' or 'another')
   * @param {number} startTime - Start time in minutes since midnight
   * @param {number} endTime - End time in minutes since midnight
   * @param {number} scaleFactor - Time scaling factor for this segment
   * @param {string} label - Human-readable label for this segment
   * @returns {Object} Segment object
   */
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

  /**
   * Find the active segment for the current time
   * 
   * @param {number} currentMinutes - Current time in minutes since midnight
   * @param {Array} segments - Array of time segments
   * @returns {Object|undefined} Active segment or undefined if none found
   */
  findActiveSegment(currentMinutes, segments) {
    return segments.find(segment =>
      currentMinutes >= segment.startTime && currentMinutes < segment.endTime
    );
  }

  /**
   * Calculate progress within a time segment
   * 
   * @param {number} currentMinutes - Current time in minutes since midnight
   * @param {Object} segment - Time segment object
   * @returns {Object} Progress information { progress: number, remaining: number }
   */
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