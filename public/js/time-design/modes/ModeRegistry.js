// public/js/time-design/ModeRegistry.js

/**
 * ModeRegistry - Manages registration and retrieval of time design modes
 */
export class ModeRegistry {
  constructor() {
    this.modes = new Map();
    this.initializationOrder = [];
  }

  /**
   * Register a new mode
   */
  register(mode) {
    if (!mode || !mode.id) {
      throw new Error('Invalid mode: must have an id property');
    }

    if (this.modes.has(mode.id)) {
      console.warn(`Mode ${mode.id} is already registered. Overwriting.`);
    }

    // Validate mode interface
    this.validateMode(mode);

    this.modes.set(mode.id, mode);
    if (!this.initializationOrder.includes(mode.id)) {
      this.initializationOrder.push(mode.id);
    }

    console.log(`Registered mode: ${mode.id}`);
    return true;
  }

  /**
   * Validate that mode implements required interface
   */
  validateMode(mode) {
    const requiredMethods = ['validate', 'calculate', 'getDefaultConfig'];
    const requiredProperties = ['id', 'name', 'description'];

    // Check required properties
    requiredProperties.forEach(prop => {
      if (!mode[prop]) {
        throw new Error(`Mode ${mode.id} missing required property: ${prop}`);
      }
    });

    // Check required methods
    requiredMethods.forEach(method => {
      if (typeof mode[method] !== 'function') {
        throw new Error(`Mode ${mode.id} missing required method: ${method}`);
      }
    });
  }

  /**
   * Get a mode by ID
   */
  get(modeId) {
    return this.modes.get(modeId);
  }

  /**
   * Get all registered modes
   */
  getAll() {
    return this.initializationOrder.map(id => this.modes.get(id));
  }

  /**
   * Check if a mode is registered
   */
  has(modeId) {
    return this.modes.has(modeId);
  }

  /**
   * Remove a mode from registry
   */
  unregister(modeId) {
    if (this.modes.delete(modeId)) {
      const index = this.initializationOrder.indexOf(modeId);
      if (index > -1) {
        this.initializationOrder.splice(index, 1);
      }
      console.log(`Unregistered mode: ${modeId}`);
      return true;
    }
    return false;
  }

  /**
   * Get mode count
   */
  get count() {
    return this.modes.size;
  }

  /**
   * Clear all modes
   */
  clear() {
    this.modes.clear();
    this.initializationOrder = [];
  }
}