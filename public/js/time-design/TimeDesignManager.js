
// TimeDesignManager.js - Main coordinator for Time Design Modes
import { ModeRegistry } from './ModeRegistry.js';

const STORAGE_KEYS = {
  CURRENT_MODE: 'timeDesignMode',
  MODE_CONFIG_PREFIX: 'timeDesignConfig_',
};

export class TimeDesignManager {
  constructor() {
    this.registry = new ModeRegistry();
    this.currentModeId = null;
    this.currentConfig = null;
    this.listeners = new Set();
    this.loadConfiguration();
  }

  loadConfiguration() {
    const savedModeId = localStorage.getItem(STORAGE_KEYS.CURRENT_MODE) || 'classic';
    const mode = this.registry.get(savedModeId);
    if (!mode) {
      this.setMode('classic'); // Fallback to classic
      return;
    }

    const savedConfigStr = localStorage.getItem(this._getConfigKey(savedModeId));
    let config;
    try {
      config = savedConfigStr ? JSON.parse(savedConfigStr) : mode.getDefaultConfig();
    } catch (e) {
      console.error("Failed to parse config, using default", e);
      config = mode.getDefaultConfig();
    }

    this.setMode(savedModeId, config);
  }

  saveConfiguration() {
    if (!this.currentModeId) return;
    localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, this.currentModeId);
    localStorage.setItem(this._getConfigKey(this.currentModeId), JSON.stringify(this.currentConfig));
    this.notifyListeners();
  }

  _getConfigKey(modeId) {
    return `${STORAGE_KEYS.MODE_CONFIG_PREFIX}${modeId}`;
  }

  setMode(modeId, config = null) {
    const mode = this.registry.get(modeId);
    if (!mode) {
      console.error(`Attempted to set unknown mode: ${modeId}`);
      return false;
    }

    const finalConfig = config || mode.getDefaultConfig();
    const validation = mode.validate(finalConfig);
    if (!validation.valid) {
      console.error(`Invalid config for mode ${modeId}:`, validation.errors);
      return false;
    }

    this.currentModeId = modeId;
    this.currentConfig = finalConfig;
    this.saveConfiguration();
    return true;
  }

  updateConfig(configUpdate) {
    if (!this.currentModeId) return false;
    const newConfig = { ...this.currentConfig, ...configUpdate };
    return this.setMode(this.currentModeId, newConfig);
  }

  getTimeAngles(date, timezone) {
    if (!this.currentModeId) {
      throw new Error('No mode selected');
    }
    const mode = this.registry.get(this.currentModeId);
    return mode.calculate(date, timezone, this.currentConfig);
  }

  getAvailableModes() {
    return this.registry.getAllAsInfo();
  }

  getCurrentModeInfo() {
    if (!this.currentModeId) return null;
    const mode = this.registry.get(this.currentModeId);
    return {
      name: mode.id,
      displayName: mode.name,
      description: mode.description,
      config: this.currentConfig
    };
  }

  getConfig() {
    return this.currentConfig;
  }

  addListener(listener) {
    this.listeners.add(listener);
  }

  removeListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners() {
    const modeInfo = this.getCurrentModeInfo();
    this.listeners.forEach(listener => {
      try {
        listener(modeInfo);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }
}

// Create and export singleton instance
export const timeDesignManager = new TimeDesignManager();
