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

// Simple timeDesignManager export for compatibility
export const timeDesignManager = {
    initialize: () => console.log('TimeDesignManager initialized successfully'),
    // Add other methods as needed
};