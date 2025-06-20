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

// Re-export types from time-modes
export * from './types/time-modes';

// Simple timeDesignManager export for compatibility
export const timeDesignManager = {
    initialize: () => console.log('TimeDesignManager initialized successfully'),
    // Add other methods as needed
};

// Note: Type definitions are provided in accompanying .d.ts files
