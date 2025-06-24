/**
 * ModeRegistry.js - Registry for all Time Design Modes
 * 
 * This is the unified implementation combining the best practices from both
 * dev-tools and scheduler-web implementations.
 * 
 * @author Another Hour Team
 * @version 1.0.0
 */

import { ClassicMode } from './modes/ClassicMode.js';

/**
 * Registry for managing Time Design Modes
 * 
 * Handles registration, retrieval, and management of all available
 * Time Design Modes in the system.
 */
export class ModeRegistry {
  constructor() {
    this._modes = new Map();
    this._registerDefaultModes();
  }

  /**
   * Register default modes that are always available
   * @private
   */
  _registerDefaultModes() {
    try {
      // Register ClassicMode first as it's always available
      if (typeof ClassicMode !== 'undefined') {
        this.register(new ClassicMode());
      }

      // Other modes will be registered when they are integrated
      // CoreTimeMode, WakeBasedMode, SolarMode will be added in subsequent steps
    } catch (error) {
      console.error('Error registering default modes:', error);
    }
  }

  /**
   * Register a mode instance
   * @param {BaseMode} modeInstance - Mode instance to register
   */
  register(modeInstance) {
    if (this._modes.has(modeInstance.id)) {
      console.warn(`Mode [${modeInstance.id}] is already registered. Overwriting.`);
    }
    this._modes.set(modeInstance.id, modeInstance);
  }

  /**
   * Get a mode by ID
   * @param {string} modeId - Mode identifier
   * @returns {BaseMode|null} Mode instance or null if not found
   */
  get(modeId) {
    if (!this._modes.has(modeId)) {
      console.error(`Mode [${modeId}] not found.`);
      return null;
    }
    return this._modes.get(modeId);
  }

  /**
   * Get all registered modes
   * @returns {Array<BaseMode>} Array of all mode instances
   */
  getAll() {
    return Array.from(this._modes.values());
  }

  /**
   * Get all modes as information objects (without full instances)
   * @returns {Array<Object>} Array of mode information objects
   */
  getAllAsInfo() {
    return this.getAll().map(mode => ({
      id: mode.id,
      name: mode.name,
      description: mode.description,
      configSchema: mode.configSchema,
    }));
  }

  /**
   * Check if a mode is registered
   * @param {string} modeId - Mode identifier
   * @returns {boolean} True if mode exists
   */
  hasMode(modeId) {
    return this._modes.has(modeId);
  }

  /**
   * Unregister a mode
   * @param {string} modeId - Mode identifier to remove
   * @returns {boolean} True if mode was removed
   */
  unregister(modeId) {
    return this._modes.delete(modeId);
  }

  /**
   * Clear all registered modes
   */
  clear() {
    this._modes.clear();
  }

  /**
   * Get the count of registered modes
   * @returns {number} Number of registered modes
   */
  size() {
    return this._modes.size;
  }
}