
// TimeDesignManager.js - Main coordinator for Time Design Modes

class TimeDesignManager {
  constructor() {
    this.registry = null;
    this.currentMode = null;
    this.currentConfig = null;
    this.listeners = [];
    this.initialized = false;

    // Define storage keys
    this.STORAGE_KEYS = {
      CURRENT_MODE: 'time-design-current-mode',
      MODE_CONFIGS: 'time-design-mode-configs'
    };
  }

  async initialize() {
    try {
      // Initialize mode registry
      this.registry = new ModeRegistry();

      // Load saved mode and config from localStorage
      const savedMode = localStorage.getItem(this.STORAGE_KEYS.CURRENT_MODE);
      const savedConfigs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MODE_CONFIGS) || '{}');

      // Set initial mode (default to classic)
      const initialMode = savedMode || 'classic';
      const initialConfig = savedConfigs[initialMode];

      await this.setMode(initialMode, initialConfig);
      this.initialized = true;

      console.log('TimeDesignManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TimeDesignManager:', error);
      throw error;
    }
  }

  async setMode(modeId, config = null) {
    if (!this.registry) {
      throw new Error('TimeDesignManager not initialized');
    }

    const mode = this.registry.get(modeId);
    if (!mode) {
      throw new Error(`Mode '${modeId}' not found`);
    }

    // Use provided config or mode's default config
    const modeConfig = config || mode.getDefaultConfig();

    // Validate configuration
    if (!mode.validate(modeConfig)) {
      throw new Error(`Invalid configuration for mode '${modeId}'`);
    }

    // Set current mode and config
    this.currentMode = mode;
    this.currentConfig = modeConfig;

    // Save to localStorage
    localStorage.setItem(this.STORAGE_KEYS.CURRENT_MODE, modeId);
    
    const savedConfigs = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.MODE_CONFIGS) || '{}');
    savedConfigs[modeId] = modeConfig;
    localStorage.setItem(this.STORAGE_KEYS.MODE_CONFIGS, JSON.stringify(savedConfigs));

    // Notify listeners
    this.notifyListeners({
      type: 'MODE_CHANGED',
      modeId: modeId,
      config: modeConfig
    });
  }

  getCurrentMode() {
    if (!this.currentMode) {
      return null;
    }

    return {
      id: this.currentMode.id,
      name: this.currentMode.name,
      description: this.currentMode.description,
      config: this.currentConfig
    };
  }

  getAvailableModes() {
    if (!this.registry) {
      return [];
    }

    return this.registry.getAll().map(mode => ({
      id: mode.id,
      name: mode.name,
      description: mode.description
    }));
  }

  calculate(date, timezone) {
    if (!this.currentMode || !this.currentConfig) {
      throw new Error('No active mode set');
    }

    try {
      return this.currentMode.calculate(date, timezone, this.currentConfig);
    } catch (error) {
      console.error('Calculation error:', error);
      throw error;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
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
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TimeDesignManager };
} else {
  window.TimeDesignManager = TimeDesignManager;
  window.timeDesignManager = new TimeDesignManager();
}
