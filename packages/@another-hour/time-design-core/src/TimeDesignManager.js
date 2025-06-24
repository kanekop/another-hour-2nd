/**
 * TimeDesignManager.js - Main coordinator for Time Design Modes
 * 
 * This is the unified implementation combining the best practices from both
 * dev-tools and scheduler-web implementations.
 * 
 * @author Another Hour Team
 * @version 1.0.0
 */

import { ModeRegistry } from './ModeRegistry.js';

const STORAGE_KEYS = {
  CURRENT_MODE: 'time-design-current-mode',
  MODE_CONFIGS: 'time-design-mode-configs'
};

/**
 * Main coordinator for Time Design Modes
 * 
 * Manages mode registration, configuration persistence,
 * and provides a unified interface for time calculations.
 */
class TimeDesignManager {
  constructor() {
    this.registry = new ModeRegistry();
    this.currentMode = null;
    this.currentConfig = null;
    this.listeners = new Set();
    this.initialized = false;
  }

  /**
   * Initialize the TimeDesignManager
   * Loads saved mode and configuration from localStorage
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const savedModeId = localStorage.getItem(STORAGE_KEYS.CURRENT_MODE) || 'classic';
      const savedConfigs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODE_CONFIGS) || '{}');

      const config = savedConfigs[savedModeId];

      await this.setMode(savedModeId, config);
      this.initialized = true;

      console.log('TimeDesignManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TimeDesignManager:', error);
      throw error;
    }
  }

  /**
   * Set the active mode with configuration
   * @param {string} modeId - Mode identifier
   * @param {Object|null} config - Mode configuration
   * @returns {Promise<void>}
   */
  async setMode(modeId, config = null) {
    const mode = this.registry.get(modeId);
    if (!mode) {
      throw new Error(`Mode '${modeId}' not found`);
    }

    // Perform a safer merge for the configuration
    const defaultConfig = mode.getDefaultConfig();
    const providedConfig = config || {};
    const modeConfig = {
      ...defaultConfig,
      ...providedConfig,
      // Ensure the location object is properly merged, not just overwritten
      location: {
        ...(defaultConfig.location || {}),
        ...(providedConfig.location || {})
      }
    };

    // HACK: Migrate legacy config from localStorage to prevent validation errors.
    // This handles the renaming of 'designed24Minutes' to 'designed24Duration'.
    if (modeId === 'classic' && modeConfig.designed24Minutes !== undefined) {
      modeConfig.designed24Duration = modeConfig.designed24Minutes;
      delete modeConfig.designed24Minutes;
    }

    const validation = mode.validate(modeConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration for mode '${modeId}': ${validation.errors.join(', ')}`);
    }

    this.currentMode = mode;
    this.currentConfig = modeConfig;

    this._saveState();
    this.notifyListeners({ type: 'MODE_CHANGED', modeId, config: modeConfig });
  }

  /**
   * Save current state to localStorage
   * @private
   */
  _saveState() {
    if (!this.currentMode) return;

    localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, this.currentMode.id);

    const savedConfigs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODE_CONFIGS) || '{}');
    savedConfigs[this.currentMode.id] = this.currentConfig;
    localStorage.setItem(STORAGE_KEYS.MODE_CONFIGS, JSON.stringify(savedConfigs));
  }

  /**
   * Get current active mode information
   * @returns {Object|null} Current mode information
   */
  getCurrentMode() {
    if (!this.currentMode) return null;
    return {
      id: this.currentMode.id,
      name: this.currentMode.name,
      description: this.currentMode.description,
      config: this.currentConfig
    };
  }

  /**
   * Get all available modes
   * @returns {Array} Array of available modes
   */
  getAvailableModes() {
    return this.registry.getAll();
  }

  /**
   * Calculate Another Hour time using current mode
   * @param {Date} date - Current real date/time
   * @param {string} timezone - Timezone identifier
   * @returns {Object} Time calculation result
   */
  calculate(date, timezone) {
    if (!this.currentMode || !this.currentConfig) {
      throw new Error('No active mode set');
    }
    return this.currentMode.calculate(date, timezone, this.currentConfig);
  }

  /**
   * Subscribe to mode change events
   * @param {Function} callback - Event callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of an event
   * @param {Object} event - Event object
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Utility method for backward compatibility with legacy clock interfaces
   * @param {Date} date - Current date
   * @param {string} timezone - Timezone identifier
   * @param {number} designed24Duration - Duration for classic mode (optional)
   * @returns {Object} Clock angles and time information
   */
  getCustomAhAngles(date, timezone, designed24Duration = 1380) {
    try {
      // Set classic mode temporarily if needed
      if (!this.currentMode || this.currentMode.id !== 'classic') {
        this.setMode('classic', { designed24Duration });
      }

      const result = this.calculate(date, timezone);

      return {
        aphHours: result.hours,
        aphMinutes: result.minutes,
        aphSeconds: result.seconds,
        scaleFactor: result.scaleFactor,
        isPersonalizedAhPeriod: result.segmentInfo.type === 'another',
        hourAngle: (result.hours % 12) * 30 + result.minutes * 0.5,
        minuteAngle: result.minutes * 6 + result.seconds * 0.1,
        secondAngle: result.seconds * 6
      };
    } catch (error) {
      console.error('Error in getCustomAhAngles:', error);
      // Fallback to original function if available
      if (typeof window.getCustomAhAngles === 'function') {
        return window.getCustomAhAngles(date, timezone, designed24Duration);
      }
      throw error;
    }
  }
}

// Export singleton instance
export const timeDesignManager = new TimeDesignManager();
export { TimeDesignManager };