// public/js/time-design/TimeDesignManager.js

import { ModeRegistry } from './ModeRegistry.js';
import { ClassicMode } from './modes/ClassicMode.js';
import { CoreTimeMode } from './modes/CoreTimeMode.js';
import { WakeBasedMode } from './modes/WakeBasedMode.js';
import { SolarMode } from './modes/SolarMode.js';

/**
 * TimeDesignManager - Central orchestrator for time design modes
 * Manages mode registration, configuration, and time calculations
 */
export class TimeDesignManager {
  constructor() {
    this.registry = new ModeRegistry();
    this.currentMode = null;
    this.config = null;
    this.listeners = new Set();
    this.initialized = false;
    this.cache = new Map();
    this.cacheTimeout = 1000; // 1 second cache
  }

  /**
   * Initialize the Time Design system
   */
  async initialize() {
    if (this.initialized) {
      console.warn('TimeDesignManager already initialized');
      return;
    }

    try {
      // Register built-in modes
      this.registerBuiltInModes();

      // Load saved configuration
      await this.loadConfiguration();

      // Set up storage listeners for cross-tab sync
      this.setupStorageSync();

      // Set up periodic cache cleanup
      this.setupCacheCleanup();

      this.initialized = true;
      console.log('TimeDesignManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TimeDesignManager:', error);
      throw error;
    }
  }

  /**
   * Register all built-in modes
   */
  registerBuiltInModes() {
    const modes = [
      new ClassicMode(),
      new CoreTimeMode(),
      new WakeBasedMode(),
      new SolarMode()
    ];

    modes.forEach(mode => {
      this.registry.register(mode);
    });
  }

  /**
   * Set the active mode with configuration
   */
  async setMode(modeId, config = null) {
    const mode = this.registry.get(modeId);
    if (!mode) {
      throw new Error(`Unknown mode: ${modeId}`);
    }

    // Use default config if none provided
    const finalConfig = config || mode.getDefaultConfig();

    // Validate configuration
    const validation = mode.validate(finalConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Clear cache when mode changes
    this.cache.clear();

    // Update state
    this.currentMode = mode;
    this.config = finalConfig;

    // Save to storage
    await this.saveConfiguration();

    // Notify listeners
    this.notifyListeners({
      type: 'MODE_CHANGED',
      mode: modeId,
      config: finalConfig
    });

    return { success: true, mode: modeId };
  }

  /**
   * Calculate time based on current mode and configuration
   */
  calculate(date, timezone) {
    if (!this.currentMode) {
      throw new Error('No mode selected. Call setMode() first.');
    }

    // Check cache first
    const cacheKey = this.getCacheKey(date, timezone);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }

    // Perform calculation
    const result = this.currentMode.calculate(date, timezone, this.config);

    // Add metadata
    result.mode = this.currentMode.id;
    result.timestamp = date.getTime();

    // Cache result
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    return result;
  }

  /**
   * Get angles for clock display (backward compatibility)
   */
  getClockAngles(date, timezone) {
    const calc = this.calculate(date, timezone);

    return {
      hourAngle: (calc.hours % 12) * 30 + (calc.minutes * 0.5),
      minuteAngle: calc.minutes * 6 + (calc.seconds * 0.1),
      secondAngle: calc.seconds * 6,
      aphHours: calc.hours,
      aphMinutes: calc.minutes,
      aphSeconds: calc.seconds,
      isPersonalizedAhPeriod: calc.isAnotherHour,
      scaleFactor: calc.scaleFactor,
      segmentInfo: calc.segmentInfo
    };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners(event) {
    event.timestamp = Date.now();
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in TimeDesign listener:', error);
      }
    });
  }

  /**
   * Load configuration from storage
   */
  async loadConfiguration() {
    try {
      const stored = localStorage.getItem('timeDesignConfig');
      if (!stored) {
        // Set default mode
        await this.setMode('classic');
        return;
      }

      const config = JSON.parse(stored);

      // Validate version
      if (config.version !== 2) {
        console.warn('Outdated config version, using defaults');
        await this.setMode('classic');
        return;
      }

      // Load saved mode
      if (config.currentMode && config.configurations[config.currentMode]) {
        await this.setMode(
          config.currentMode,
          config.configurations[config.currentMode]
        );
      } else {
        await this.setMode('classic');
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
      await this.setMode('classic');
    }
  }

  /**
   * Save current configuration to storage
   */
  async saveConfiguration() {
    if (!this.currentMode) return;

    try {
      const stored = localStorage.getItem('timeDesignConfig');
      const config = stored ? JSON.parse(stored) : {
        version: 2,
        configurations: {},
        preferences: {}
      };

      // Update configuration
      config.currentMode = this.currentMode.id;
      config.configurations[this.currentMode.id] = this.config;
      config.lastModified = new Date().toISOString();

      localStorage.setItem('timeDesignConfig', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  /**
   * Set up storage event listeners for cross-tab synchronization
   */
  setupStorageSync() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'timeDesignConfig' && event.newValue) {
        this.handleStorageChange(event.newValue);
      }
    });
  }

  /**
   * Handle storage changes from other tabs
   */
  async handleStorageChange(newValue) {
    try {
      const config = JSON.parse(newValue);
      if (config.currentMode !== this.currentMode?.id) {
        // Reload configuration if mode changed in another tab
        await this.loadConfiguration();
        this.notifyListeners({
          type: 'EXTERNAL_UPDATE',
          source: 'storage'
        });
      }
    } catch (error) {
      console.error('Failed to handle storage change:', error);
    }
  }

  /**
   * Set up periodic cache cleanup
   */
  setupCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const oldEntries = [];

      this.cache.forEach((value, key) => {
        if (now - value.timestamp > this.cacheTimeout * 10) {
          oldEntries.push(key);
        }
      });

      oldEntries.forEach(key => this.cache.delete(key));
    }, 60000); // Clean every minute
  }

  /**
   * Generate cache key for calculations
   */
  getCacheKey(date, timezone) {
    const minutes = Math.floor(date.getTime() / 60000); // Round to minute
    return `${this.currentMode?.id}-${minutes}-${timezone}`;
  }

  /**
   * Get current mode information
   */
  getCurrentMode() {
    if (!this.currentMode) return null;

    return {
      id: this.currentMode.id,
      name: this.currentMode.name,
      description: this.currentMode.description,
      config: this.config
    };
  }

  /**
   * Get all available modes
   */
  getAvailableModes() {
    return this.registry.getAll().map(mode => ({
      id: mode.id,
      name: mode.name,
      description: mode.description
    }));
  }

  /**
   * Check if manager is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Export current configuration
   */
  exportConfiguration() {
    return {
      version: 2,
      currentMode: this.currentMode?.id,
      config: this.config,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * Import configuration
   */
  async importConfiguration(data) {
    if (data.version !== 2) {
      throw new Error('Incompatible configuration version');
    }

    if (data.currentMode && data.config) {
      await this.setMode(data.currentMode, data.config);
    }
  }
}

// Create singleton instance
export const timeDesignManager = new TimeDesignManager();