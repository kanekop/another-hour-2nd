
// ModeRegistry.js - Registry for all Time Design Modes
import { ClassicMode } from './modes/ClassicMode.js';
import { CoreTimeMode } from './modes/CoreTimeMode.js';
import { WakeBasedMode } from './modes/WakeBasedMode.js';
import { SolarMode } from './modes/SolarMode.js';

export class ModeRegistry {
  constructor() {
    this.modes = new Map();
    this.registerDefaultModes();
  }

  registerDefaultModes() {
    this.register('classic', ClassicMode);
    this.register('coreTime', CoreTimeMode);
    this.register('wakeBased', WakeBasedMode);
    this.register('solar', SolarMode);
  }

  register(name, ModeClass) {
    this.modes.set(name, ModeClass);
  }

  getMode(name) {
    return this.modes.get(name);
  }

  getAvailableModes() {
    const modeList = [];
    for (const [name, ModeClass] of this.modes) {
      const instance = new ModeClass();
      modeList.push({
        name,
        displayName: instance.getDisplayName(),
        description: instance.getDescription(),
        configSchema: instance.getConfigSchema()
      });
    }
    return modeList;
  }

  hasMode(name) {
    return this.modes.has(name);
  }
}
