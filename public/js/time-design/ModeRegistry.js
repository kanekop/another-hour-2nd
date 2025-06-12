
// ModeRegistry.js - Registry for all Time Design Modes

class ModeRegistry {
  constructor() {
    this._modes = new Map();
    this._registerDefaultModes();
  }

  _registerDefaultModes() {
    try {
      if (typeof ClassicMode !== 'undefined') {
        this.register(new ClassicMode());
      }
      if (typeof CoreTimeMode !== 'undefined') {
        this.register(new CoreTimeMode());
      }
      if (typeof WakeBasedMode !== 'undefined') {
        this.register(new WakeBasedMode());
      }
      if (typeof SolarMode !== 'undefined') {
        this.register(new SolarMode());
      }
    } catch (error) {
      console.error('Error registering default modes:', error);
    }
  }

  register(modeInstance) {
    if (this._modes.has(modeInstance.id)) {
      console.warn(`Mode [${modeInstance.id}] is already registered. Overwriting.`);
    }
    this._modes.set(modeInstance.id, modeInstance);
  }

  get(modeId) {
    if (!this._modes.has(modeId)) {
      console.error(`Mode [${modeId}] not found.`);
      return null;
    }
    return this._modes.get(modeId);
  }

  getAll() {
    return Array.from(this._modes.values());
  }

  getAllAsInfo() {
    return this.getAll().map(mode => ({
      name: mode.id,
      displayName: mode.name,
      description: mode.description,
      configSchema: mode.configSchema,
    }));
  }

  hasMode(name) {
    return this._modes.has(name);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModeRegistry };
} else {
  // Only declare if not already declared
  if (typeof window.ModeRegistry === 'undefined') {
    window.ModeRegistry = ModeRegistry;
  }
}
