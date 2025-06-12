
// TimeDesignManager.js - Main coordinator for Time Design Modes
import { ModeRegistry } from './ModeRegistry.js';

export class TimeDesignManager {
  constructor() {
    this.registry = new ModeRegistry();
    this.currentMode = null;
    this.config = {};
    this.listeners = new Set();
    
    // Initialize with default mode
    this.setMode('classic');
  }

  // Set active mode
  setMode(modeName, config = {}) {
    const ModeClass = this.registry.getMode(modeName);
    if (!ModeClass) {
      console.error(`Mode '${modeName}' not found`);
      return false;
    }

    this.currentMode = new ModeClass();
    this.config = { ...this.currentMode.getDefaultConfig(), ...config };
    
    // Save to localStorage
    this.saveState();
    
    // Notify listeners
    this.notifyListeners();
    
    return true;
  }

  // Get current time angles using active mode
  getTimeAngles(date = new Date(), timezone = 'UTC') {
    if (!this.currentMode) {
      console.error('No active mode');
      return null;
    }

    return this.currentMode.calculateAngles(date, timezone, this.config);
  }

  // Get mode information
  getCurrentModeInfo() {
    if (!this.currentMode) return null;
    
    return {
      name: this.currentMode.getName(),
      displayName: this.currentMode.getDisplayName(),
      description: this.currentMode.getDescription(),
      config: this.config
    };
  }

  // Configuration management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveState();
    this.notifyListeners();
  }

  getConfig() {
    return { ...this.config };
  }

  // Available modes
  getAvailableModes() {
    return this.registry.getAvailableModes();
  }

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
        this.setMode(state.modeName || 'classic', state.config || {});
        return true;
      }
    } catch (error) {
      console.error('Failed to load Time Design state:', error);
    }
    return false;
  }

  // Event system
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getCurrentModeInfo());
      } catch (error) {
        console.error('Error in Time Design listener:', error);
      }
    });
  }

  // Migration from existing personalized AH settings
  static migrateFromPersonalizedAH() {
    const personalizedDuration = localStorage.getItem('personalizedAhDurationMinutes');
    if (personalizedDuration) {
      const manager = new TimeDesignManager();
      manager.setMode('classic', {
        normalDayDurationMinutes: parseInt(personalizedDuration, 10)
      });
      return manager;
    }
    return new TimeDesignManager();
  }
}

// Global instance
export const timeDesignManager = TimeDesignManager.migrateFromPersonalizedAH();
