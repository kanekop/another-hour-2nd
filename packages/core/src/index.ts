/**
 * Another Hour Core - Main exports
 *
 * This module provides the core time calculation functionality and type definitions
 * for the Another Hour project. It enables custom time scaling and clock calculations
 * based on user-defined time design patterns.
 *
 * @module AnotherHourCore
 * @version 1.0.0
 */

// Export all time calculation functions
export * from './time-calculation';
export * from './validation';
export * from './types';

// Time Design Modes exports
export { TimeDesignManager } from './TimeDesignManager';
export { BaseMode } from './modes/BaseMode';
export { ClassicMode } from './modes/ClassicMode';
export { CoreTimeMode } from './modes/CoreTimeMode';
export { SolarMode } from './modes/SolarMode';
export { WakeBasedMode } from './modes/WakeBasedMode';

// Re-export types from time-modes
export * from './types/time-modes';

// Import TimeDesignManager for singleton instance creation
import { TimeDesignManager } from './TimeDesignManager';

// Create timeDesignManager singleton instance for compatibility with JavaScript implementations
const timeDesignManagerInstance = TimeDesignManager.getInstance();

// Import modes and register them
import { ClassicMode } from './modes/ClassicMode';
import { CoreTimeMode } from './modes/CoreTimeMode';
import { WakeBasedMode } from './modes/WakeBasedMode';
import { SolarMode } from './modes/SolarMode';

// Register all modes
timeDesignManagerInstance.registerMode('classic', ClassicMode);
timeDesignManagerInstance.registerMode('coretime', CoreTimeMode);
timeDesignManagerInstance.registerMode('wakebased', WakeBasedMode);
timeDesignManagerInstance.registerMode('solar', SolarMode);

// Export timeDesignManager instance for direct use
export const timeDesignManager = timeDesignManagerInstance;

// Note: Type definitions are provided in accompanying .d.ts files
