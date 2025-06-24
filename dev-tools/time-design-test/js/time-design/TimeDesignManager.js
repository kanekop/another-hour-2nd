// TimeDesignManager.js - Main coordinator for Time Design Modes

import { ModeRegistry } from './ModeRegistry.js';

const STORAGE_KEYS = {
  CURRENT_MODE: 'time-design-current-mode',
  MODE_CONFIGS: 'time-design-mode-configs'
};

export class TimeDesignManager {
  constructor() {
    this.registry = new ModeRegistry();
    this.currentMode = null;
    this.currentConfig = null;
    this.listeners = new Set();
    this.initialized = false;
  }

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

  _saveState() {
    if (!this.currentMode) return;

    localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, this.currentMode.id);

    const savedConfigs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODE_CONFIGS) || '{}');
    savedConfigs[this.currentMode.id] = this.currentConfig;
    localStorage.setItem(STORAGE_KEYS.MODE_CONFIGS, JSON.stringify(savedConfigs));
  }

  getCurrentMode() {
    if (!this.currentMode) return null;
    return {
      id: this.currentMode.id,
      name: this.currentMode.name,
      description: this.currentMode.description,
      config: this.currentConfig
    };
  }

  getAvailableModes() {
    return this.registry.getAll();
  }

  calculate(date, timezone) {
    if (!this.currentMode || !this.currentConfig) {
      throw new Error('No active mode set');
    }
    return this.currentMode.calculate(date, timezone, this.currentConfig);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Utility method for backward compatibility
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

  registerMode(modeInstance) {
    this.registry.register(modeInstance);
  }

  getModeInstance(modeId) {
    return this.registry.get(modeId);
  }

  getCurrentModeId() {
    return this.currentMode ? this.currentMode.id : null;
  }

  calculateAnotherHourTime(date, timezone) {
    return this.calculate(date, timezone);
  }

  getCurrentPhase(date = new Date()) {
    if (this.currentMode && typeof this.currentMode.getCurrentPhase === 'function') {
      return this.currentMode.getCurrentPhase(date, this.currentConfig);
    }
    return null;
  }

  getScaleFactor(date = new Date()) {
    if (this.currentMode && typeof this.currentMode.getScaleFactor === 'function') {
      return this.currentMode.getScaleFactor(date, this.currentConfig);
    }
    return 1;
  }

  exportCurrentConfig() {
    return this.currentConfig || {};
  }

  getSolarInfo(date = new Date()) {
    if (this.currentMode && typeof this.currentMode.getSolarInfo === 'function') {
      return this.currentMode.getSolarInfo(date, this.currentConfig);
    }
    return null;
  }
}

export const timeDesignManager = new TimeDesignManager();
