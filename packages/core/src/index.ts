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
import { TimeDesignManager } from './TimeDesignManager';
import { BaseMode } from './modes/BaseMode';
import { ClassicMode } from './modes/ClassicMode';
import { CoreTimeMode } from './modes/CoreTimeMode';
import { SolarMode } from './modes/SolarMode';
import { WakeBasedMode } from './modes/WakeBasedMode';

export {
    TimeDesignManager,
    BaseMode,
    ClassicMode,
    CoreTimeMode,
    SolarMode,
    WakeBasedMode
};

// Re-export types from time-modes
export * from './types/time-modes';