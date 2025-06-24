/**
 * core.browser.js - Browser bundle for @another-hour/core package
 * 
 * This file imports and re-exports the core package for browser use.
 * It uses the TypeScript-compiled browser bundle from @another-hour/core.
 */

// Re-export everything from the built core package
export * from '../../node_modules/@another-hour/core/dist/core.browser.js';

// Import specific exports needed by the application
import { TimeDesignManager } from '../../node_modules/@another-hour/core/dist/core.browser.js';

// Create and export a singleton instance for existing code compatibility
export const timeDesignManager = TimeDesignManager.getInstance();

// Note: ClassicMode, CoreTimeMode, SolarMode, and WakeBasedMode are already exported
// from the core package, so they don't need to be re-exported here