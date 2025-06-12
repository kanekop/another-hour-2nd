// ModeRegistry.js - Registry for all Time Design Modes

class ModeRegistry {
  constructor() {
    this._modes = new Map();
    this._registerDefaultModes();
  }

  _registerDefaultModes() {
    this.register(new ClassicMode());
    this.register(new CoreTimeMode());
    this.register(new WakeBasedMode());
    this.register(new SolarMode());
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
  window.ModeRegistry = ModeRegistry;
}
