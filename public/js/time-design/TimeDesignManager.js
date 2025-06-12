
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

<<<<<<< HEAD
    const finalConfig = config || mode.getDefaultConfig();
    const validation = mode.validate(finalConfig);
    if (!validation.valid) {
      console.error(`Invalid config for mode ${modeId}:`, validation.errors);
      return false;
    }

    this.currentModeId = modeId;
    this.currentConfig = finalConfig;
    this.saveConfiguration();
=======
    this.currentMode = new ModeClass();
    this.config = { ...this.currentMode.getDefaultConfig(), ...config };

    // Save to localStorage
    this.saveState();

    // Notify listeners
    this.notifyListeners();

>>>>>>> 370dc0f (Assistant checkpoint: Fix duplicate declarations and module loading issues)
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
<<<<<<< HEAD
    if (!this.currentModeId) return null;
    const mode = this.registry.get(this.currentModeId);
=======
    if (!this.currentMode) return null;

>>>>>>> 370dc0f (Assistant checkpoint: Fix duplicate declarations and module loading issues)
    return {
      name: mode.id,
      displayName: mode.name,
      description: mode.description,
      config: this.currentConfig
    };
=======
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize registry first
      await this.registry.initialize();
      
      // Load saved state or set default
      if (!this.loadState()) {
        await this.setMode('classic');
      }
      
      this.initialized = true;
      console.log('TimeDesignManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TimeDesignManager:', error);
      throw error;
    }
  }

  async setMode(modeName, config = {}) {
    try {
      const mode = this.registry.get(modeName);
      if (!mode) {
        throw new Error(`Mode '${modeName}' not found`);
      }

      this.currentMode = mode;
      this.config = { ...mode.getDefaultConfig(), ...config };

      // Save to localStorage
      this.saveState();

      // Notify listeners
      this.notifyListeners({
        type: 'modeChanged',
        mode: modeName,
        config: this.config
      });

      return true;
    } catch (error) {
      console.error('Failed to set mode:', error);
      throw error;
    }
  }

  getCurrentMode() {
    return this.currentMode ? {
      id: this.currentMode.getName(),
      name: this.currentMode.getDisplayName(),
      description: this.currentMode.getDescription(),
      config: this.config
    } : null;
  }

  getAvailableModes() {
    return this.registry.getAvailableModes();
  }

  calculate(date = new Date(), timezone = 'UTC') {
    if (!this.currentMode) {
      throw new Error('No mode selected');
    }

    return this.currentMode.calculateAngles(date, timezone, this.config);
  }

  // Configuration management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
    this.notifyListeners({
      type: 'configChanged',
      config: this.config
    });
>>>>>>> 9b8090b (Assistant checkpoint: Fix Time Design module structure and dependencies)
  }

  getConfig() {
    return this.currentConfig;
  }

<<<<<<< HEAD
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
=======
  // State persistence
  saveState() {
    const state = {
      modeName: this.currentMode?.getName(),
      config: this.config
    };
    localStorage.setItem('timeDesignState', JSON.stringify(state));
  }

  loadState() {
    try {
      const saved = localStorage.getItem('timeDesignState');
      if (saved) {
        const state = JSON.parse(saved);
        if (state.modeName && this.registry.has(state.modeName)) {
          this.setMode(state.modeName, state.config || {});
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load Time Design state:', error);
    }
    return false;
  }

  // Event system
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
>>>>>>> 9b8090b (Assistant checkpoint: Fix Time Design module structure and dependencies)
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }
}

// Create and export singleton instance
export const timeDesignManager = new TimeDesignManager();
