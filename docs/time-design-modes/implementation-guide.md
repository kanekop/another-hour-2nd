# Implementation Guide 

# Time Design Modes Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions for implementing Time Design Modes in the Another Hour project. It covers the migration from the current single-mode system to a flexible multi-mode architecture.

## 🎯 Implementation Strategy

### Phase 1: Foundation (Week 1-2)
- Create mode registry system
- Implement base interfaces
- Set up configuration management
- Add backward compatibility layer

### Phase 2: Core Time Mode (Week 3-4)
- Implement Core Time Mode as proof of concept
- Update UI components
- Add mode switching capability
- Test with existing features

### Phase 3: Advanced Modes (Week 5-8)
- Implement Wake-Based Mode
- Implement Solar Mode
- Add mode-specific UI components
- Integration testing

### Phase 4: Polish & Release (Week 9-10)
- Performance optimization
- Documentation updates
- User testing
- Production deployment

## 🏗️ Architecture Changes

### Current Architecture
```
clock-core.js
     ↓
getCustomAhAngles() → Single calculation method
     ↓
UI Components
```

### New Architecture
```
TimeDesignManager
     ↓
Mode Registry → Multiple modes
     ↓
Mode Engine → Mode-specific calculations
     ↓
Unified API → Backward compatible
     ↓
UI Components
```

## 📁 File Structure

### New Files to Create

```
public/js/time-design/
├── TimeDesignManager.js       # Main orchestrator
├── ModeRegistry.js            # Mode registration and management
├── modes/
│   ├── BaseMode.js           # Abstract base class
│   ├── ClassicMode.js        # Current behavior
│   ├── CoreTimeMode.js       # Core Time implementation
│   ├── WakeBasedMode.js      # Wake-Based implementation
│   └── SolarMode.js          # Solar implementation
├── calculators/
│   ├── TimeCalculator.js     # Core calculation logic
│   └── ScaleCalculator.js    # Scale factor calculations
└── ui/
    ├── ModeSelector.js       # Mode selection component
    ├── ModeConfigurator.js   # Mode-specific settings
    └── TimeDisplay.js        # Enhanced time display
```

### Modified Files

```
public/
├── clock-core.js             # Add compatibility layer
├── js/
│   ├── personalized-ah-clock-ui.js  # Update to use new system
│   ├── scheduler-ui.js              # Update time calculations
│   └── scaling-utils.js             # Integrate with new system
└── pages/
    └── personalized-ah-clock.html   # Add mode selection UI
```

## 🔧 Core Implementation

### Step 1: Create Base Infrastructure

**TimeDesignManager.js**
```javascript
// public/js/time-design/TimeDesignManager.js

export class TimeDesignManager {
  constructor() {
    this.registry = new ModeRegistry();
    this.currentMode = null;
    this.config = null;
    this.listeners = new Set();
  }

  initialize() {
    // Register built-in modes
    this.registry.register(new ClassicMode());
    this.registry.register(new CoreTimeMode());
    this.registry.register(new WakeBasedMode());
    this.registry.register(new SolarMode());
    
    // Load saved configuration
    this.loadConfiguration();
    
    // Set up storage listeners
    this.setupStorageSync();
  }

  setMode(modeId, config = null) {
    const mode = this.registry.get(modeId);
    if (!mode) {
      throw new Error(`Unknown mode: ${modeId}`);
    }

    // Validate configuration
    const finalConfig = config || mode.getDefaultConfig();
    const validation = mode.validate(finalConfig);
    
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.currentMode = mode;
    this.config = finalConfig;
    this.saveConfiguration();
    this.notifyListeners();
  }

  calculate(date, timezone) {
    if (!this.currentMode) {
      throw new Error('No mode selected');
    }

    return this.currentMode.calculate(date, timezone, this.config);
  }

  // Observer pattern for UI updates
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    const event = {
      mode: this.currentMode.id,
      config: this.config,
      timestamp: Date.now()
    };

    this.listeners.forEach(listener => listener(event));
  }
}

// Singleton instance
export const timeDesignManager = new TimeDesignManager();
```

### Step 2: Implement Base Mode Class

**BaseMode.js**
```javascript
// public/js/time-design/modes/BaseMode.js

export class BaseMode {
  constructor(id, name, description) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  // Abstract methods - must be implemented by subclasses
  validate(config) {
    throw new Error('validate() must be implemented');
  }

  calculate(date, timezone, config) {
    throw new Error('calculate() must be implemented');
  }

  getDefaultConfig() {
    throw new Error('getDefaultConfig() must be implemented');
  }

  // Common utilities
  createSegment(type, startTime, endTime, scaleFactor, label) {
    return {
      id: `${type}-${startTime}-${endTime}`,
      type,
      startTime,
      endTime,
      scaleFactor,
      label
    };
  }

  getMinutesSinceMidnight(date, timezone) {
    const localTime = moment(date).tz(timezone);
    return localTime.hours() * 60 + localTime.minutes();
  }

  findActiveSegment(minutes, segments) {
    return segments.find(segment => 
      minutes >= segment.startTime && minutes < segment.endTime
    );
  }
}
```

### Step 3: Implement Core Time Mode

**CoreTimeMode.js**
```javascript
// public/js/time-design/modes/CoreTimeMode.js

import { BaseMode } from './BaseMode.js';

export class CoreTimeMode extends BaseMode {
  constructor() {
    super(
      'core-time',
      'Core Time Mode',
      'Define your productive hours with Another Hour periods before and after'
    );
  }

  getDefaultConfig() {
    return {
      morningAH: {
        start: 300,    // 5:00
        duration: 120  // 2 hours
      },
      eveningAH: {
        duration: 120, // 2 hours
        end: 1440     // 24:00
      }
    };
  }

  validate(config) {
    const errors = [];

    // Check morning AH
    if (config.morningAH.start < 0 || config.morningAH.start > 720) {
      errors.push('Morning AH must start between 0:00 and 12:00');
    }

    if (config.morningAH.duration < 0 || config.morningAH.duration > 360) {
      errors.push('Morning AH duration must be between 0 and 6 hours');
    }

    // Check evening AH
    if (config.eveningAH.duration < 0 || config.eveningAH.duration > 360) {
      errors.push('Evening AH duration must be between 0 and 6 hours');
    }

    // Check total AH doesn't exceed 12 hours
    const totalAH = config.morningAH.duration + config.eveningAH.duration;
    if (totalAH > 720) {
      errors.push('Total Another Hour time cannot exceed 12 hours');
    }

    // Calculate Core Time
    const coreStart = config.morningAH.start + config.morningAH.duration;
    const coreEnd = config.eveningAH.end - config.eveningAH.duration;
    const coreDuration = coreEnd - coreStart;

    if (coreDuration < 720) {
      errors.push('Core Time must be at least 12 hours');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  calculate(date, timezone, config) {
    const minutes = this.getMinutesSinceMidnight(date, timezone);
    
    // Build segments
    const segments = this.buildSegments(config);
    const activeSegment = this.findActiveSegment(minutes, segments);

    if (!activeSegment) {
      throw new Error('No active segment found');
    }

    // Calculate time within segment
    const segmentElapsed = minutes - activeSegment.startTime;
    const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;

    // Calculate display time
    let displayHours, displayMinutes;
    
    if (activeSegment.type === 'another') {
      // Another Hour - use real time
      displayHours = Math.floor(minutes / 60);
      displayMinutes = minutes % 60;
    } else {
      // Core Time - use scaled time
      const coreTimeBase = config.morningAH.duration / 60; // Hours into the day
      const scaledHours = coreTimeBase + (scaledElapsed / 60);
      displayHours = Math.floor(scaledHours);
      displayMinutes = Math.floor(scaledElapsed % 60);
    }

    return {
      hours: displayHours,
      minutes: displayMinutes,
      seconds: 0, // Calculate if needed
      scaleFactor: activeSegment.scaleFactor,
      isAnotherHour: activeSegment.type === 'another',
      segmentInfo: {
        type: activeSegment.type,
        label: activeSegment.label,
        progress: segmentElapsed / (activeSegment.endTime - activeSegment.startTime)
      }
    };
  }

  buildSegments(config) {
    const segments = [];

    // Morning AH
    if (config.morningAH.duration > 0) {
      segments.push(this.createSegment(
        'another',
        config.morningAH.start,
        config.morningAH.start + config.morningAH.duration,
        1.0,
        'Morning Another Hour'
      ));
    }

    // Core Time
    const coreStart = config.morningAH.start + config.morningAH.duration;
    const coreEnd = config.eveningAH.end - config.eveningAH.duration;
    const coreDuration = (coreEnd - coreStart) / 60; // in hours
    const coreScaleFactor = 24 / coreDuration;

    segments.push(this.createSegment(
      'designed',
      coreStart,
      coreEnd,
      coreScaleFactor,
      'Core Time'
    ));

    // Evening AH
    if (config.eveningAH.duration > 0) {
      segments.push(this.createSegment(
        'another',
        coreEnd,
        config.eveningAH.end,
        1.0,
        'Evening Another Hour'
      ));
    }

    return segments;
  }
}
```

### Step 4: Update Clock Core Integration

**clock-core.js (modifications)**
```javascript
// Add to public/clock-core.js

import { timeDesignManager } from './js/time-design/TimeDesignManager.js';

// Keep existing functions for backward compatibility
export { SCALE_AH, getAngles, getCustomAhAngles };

// New unified function
export function getTimeDesignAngles(date, timezone, modeId = null, config = null) {
  // If no mode specified, fall back to classic behavior
  if (!modeId) {
    const savedMode = localStorage.getItem('timeDesignMode');
    if (!savedMode || savedMode === 'classic') {
      // Use existing getCustomAhAngles for backward compatibility
      const duration = parseInt(localStorage.getItem('personalizedAhDurationMinutes')) || 1380;
      return getCustomAhAngles(date, timezone, duration);
    }
    modeId = savedMode;
  }

  // Use Time Design Manager for new modes
  if (!timeDesignManager.currentMode || timeDesignManager.currentMode.id !== modeId) {
    timeDesignManager.setMode(modeId, config);
  }

  const calculation = timeDesignManager.calculate(date, timezone);
  
  // Convert to angles format
  return {
    hourAngle: (calculation.hours % 12) * 30 + (calculation.minutes * 0.5),
    minuteAngle: calculation.minutes * 6 + (calculation.seconds * 0.1),
    secondAngle: calculation.seconds * 6,
    aphHours: calculation.hours,
    aphMinutes: calculation.minutes,
    aphSeconds: calculation.seconds,
    isPersonalizedAhPeriod: calculation.isAnotherHour,
    // Additional info for UI
    scaleFactor: calculation.scaleFactor,
    segmentInfo: calculation.segmentInfo
  };
}
```

### Step 5: Create UI Components

**ModeSelector.js**
```javascript
// public/js/time-design/ui/ModeSelector.js

export class ModeSelector {
  constructor(containerId, onModeChange) {
    this.container = document.getElementById(containerId);
    this.onModeChange = onModeChange;
    this.modes = [];
  }

  initialize(modes) {
    this.modes = modes;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="mode-selector">
        <h3>Time Design Mode</h3>
        <div class="mode-options">
          ${this.modes.map(mode => `
            <label class="mode-option">
              <input type="radio" name="time-mode" value="${mode.id}">
              <div class="mode-info">
                <h4>${mode.name}</h4>
                <p>${mode.description}</p>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    `;

    // Add event listeners
    this.container.querySelectorAll('input[name="time-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.onModeChange(e.target.value);
      });
    });
  }

  setMode(modeId) {
    const radio = this.container.querySelector(`input[value="${modeId}"]`);
    if (radio) {
      radio.checked = true;
    }
  }
}
```

## 🔄 Migration Steps

### Step 1: Add Feature Flag
```javascript
// Add to initialization
const TIME_DESIGN_MODES_ENABLED = localStorage.getItem('timeDesignModesEnabled') === 'true';

if (TIME_DESIGN_MODES_ENABLED) {
  timeDesignManager.initialize();
}
```

### Step 2: Update Existing UI
```javascript
// In personalized-ah-clock-ui.js
function initializeWithTimeDesignModes() {
  // Check if new system is enabled
  if (TIME_DESIGN_MODES_ENABLED) {
    // Initialize mode selector
    const modeSelector = new ModeSelector('mode-selector-container', (modeId) => {
      timeDesignManager.setMode(modeId);
      updateClock(); // Trigger redraw
    });
    
    modeSelector.initialize(timeDesignManager.registry.getAll());
    
    // Subscribe to mode changes
    timeDesignManager.subscribe((event) => {
      updateClockDisplay(event);
    });
  } else {
    // Use existing initialization
    initializeSlider();
  }
}
```

### Step 3: Test Migration Path
```javascript
// Test script to verify backward compatibility
async function testMigration() {
  // 1. Save current settings
  const oldSettings = {
    duration: localStorage.getItem('personalizedAhDurationMinutes'),
    timezone: localStorage.getItem('personalizedAhSelectedTimezone')
  };

  // 2. Enable new system
  localStorage.setItem('timeDesignModesEnabled', 'true');
  
  // 3. Reload and verify
  location.reload();
  
  // 4. Check that classic mode produces same results
  const oldResult = getCustomAhAngles(new Date(), oldSettings.timezone, oldSettings.duration);
  const newResult = getTimeDesignAngles(new Date(), oldSettings.timezone, 'classic');
  
  console.assert(
    Math.abs(oldResult.hourAngle - newResult.hourAngle) < 0.01,
    'Hour angles should match'
  );
}
```

## 🧪 Testing Strategy

### Unit Tests
```javascript
// tests/time-design/modes/CoreTimeMode.test.js
describe('CoreTimeMode', () => {
  let mode;
  
  beforeEach(() => {
    mode = new CoreTimeMode();
  });

  test('validates configuration correctly', () => {
    const validConfig = {
      morningAH: { start: 300, duration: 120 },
      eveningAH: { duration: 120, end: 1440 }
    };
    
    expect(mode.validate(validConfig).valid).toBe(true);
  });

  test('calculates scale factor correctly', () => {
    const config = {
      morningAH: { start: 300, duration: 120 }, // 5:00-7:00
      eveningAH: { duration: 120, end: 1440 }   // 22:00-24:00
    };
    
    const result = mode.calculate(
      new Date('2025-01-01T12:00:00'),
      'UTC',
      config
    );
    
    // Core time is 15 hours (7:00-22:00)
    // Scale factor should be 24/15 = 1.6
    expect(result.scaleFactor).toBeCloseTo(1.6);
  });
});
```

### Integration Tests
```javascript
// tests/integration/time-design-clock.test.js
describe('Time Design Clock Integration', () => {
  test('clock updates when mode changes', async () => {
    // Initialize manager
    timeDesignManager.initialize();
    
    // Set initial mode
    timeDesignManager.setMode('classic');
    
    // Get initial time
    const initial = getTimeDesignAngles(new Date(), 'UTC');
    
    // Change mode
    timeDesignManager.setMode('core-time');
    
    // Get new time
    const updated = getTimeDesignAngles(new Date(), 'UTC');
    
    // Should have different scale factors
    expect(updated.scaleFactor).not.toBe(initial.scaleFactor);
  });
});
```

## 🚀 Deployment Checklist

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Backward compatibility verified
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Feature flag tested
- [ ] Rollback plan prepared
- [ ] User communication prepared

## 📊 Performance Considerations

### Optimization Targets
- Mode switching: < 100ms
- Time calculation: < 10ms
- UI update: < 16ms (60fps)
- Memory usage: < 10MB additional

### Caching Strategy
```javascript
class CalculationCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < 1000) {
      return item.value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}
```

## 🔐 Security Considerations

- Validate all user inputs
- Sanitize configuration before storage
- Prevent prototype pollution in mode registry
- Rate limit configuration changes

## 📝 Next Steps

1. Complete Core Time Mode implementation
2. Add comprehensive test suite
3. Create mode configuration UI
4. Implement Wake-Based Mode
5. Implement Solar Mode
6. Performance optimization
7. User testing
8. Production release

---

*This implementation guide will be updated as development progresses.*