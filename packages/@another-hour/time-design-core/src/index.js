/**
 * @another-hour/time-design-core
 * Core Time Design Modes implementation for Another Hour project
 * 
 * This package provides the unified implementation of all Time Design Modes,
 * eliminating code duplication between dev-tools and scheduler-web.
 */

// Export all modes
export { BaseMode } from './modes/BaseMode.js';
export { ClassicMode } from './modes/ClassicMode.js';
export { CoreTimeMode } from './modes/CoreTimeMode.js';
export { SolarMode } from './modes/SolarMode.js';
export { WakeBasedMode } from './modes/WakeBasedMode.js';

// Export TimeDesignManager
export { TimeDesignManager, timeDesignManager } from './TimeDesignManager.js';
export { ModeRegistry } from './ModeRegistry.js';

// Export utilities
export * from './utils/index.js';

// Default export for convenience
export default {
  BaseMode: './modes/BaseMode.js',
  ClassicMode: './modes/ClassicMode.js',
  CoreTimeMode: './modes/CoreTimeMode.js',
  SolarMode: './modes/SolarMode.js',
  WakeBasedMode: './modes/WakeBasedMode.js',
  TimeDesignManager: './TimeDesignManager.js',
  ModeRegistry: './ModeRegistry.js'
};