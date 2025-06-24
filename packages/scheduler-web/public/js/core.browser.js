/**
 * core.browser.js - Browser bundle for time-design-core package
 * 
 * This file imports and re-exports the time-design-core package for browser use.
 * It replaces the previous compiled bundle with direct ES module imports.
 */

// Import the time-design-core package
// Note: This requires the package to be accessible from the browser
// In a development environment, this should work with proper module resolution

// Re-export everything from time-design-core for compatibility
export * from '../../node_modules/@another-hour/time-design-core/src/index.js';

// Specifically export timeDesignManager instance for existing code
export { timeDesignManager } from '../../node_modules/@another-hour/time-design-core/src/index.js';

// Legacy exports for backward compatibility
export { 
  ClassicMode,
  CoreTimeMode, 
  SolarMode,
  WakeBasedMode,
  TimeDesignManager 
} from '../../node_modules/@another-hour/time-design-core/src/index.js';