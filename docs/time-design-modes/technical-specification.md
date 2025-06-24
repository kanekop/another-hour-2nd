# Technical Specification 

# Time Design Modes Technical Specification

## 📋 Overview

This document defines the technical architecture and implementation details for the Time Design Modes feature in Another Hour. It serves as the authoritative reference for developers implementing or extending the time calculation system.

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────┐
│         Time Design Manager             │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌────────────────┐ │
│  │ Mode Engine │───▶│ Time Calculator│ │
│  └─────────────┘    └────────────────┘ │
│         │                    │          │
│         ▼                    ▼          │
│  ┌─────────────┐    ┌────────────────┐ │
│  │Mode Registry│    │ Scale Engine   │ │
│  └─────────────┘    └────────────────┘ │
└─────────────────────────────────────────┘
```

### Data Flow

```
User Input → Mode Configuration → Time Calculation → UI Update
     ↓              ↓                    ↓              ↓
localStorage   Validation          Scale Factor    Clock/Calendar
```

## 📐 Data Structures

### Time Segment

```javascript
interface TimeSegment {
  id: string;                    // Unique identifier
  type: 'designed' | 'another';  // Segment type
  startTime: number;             // Start time in minutes (0-1440)
  endTime: number;               // End time in minutes (0-1440)
  scaleFactor: number;           // Time scaling factor
  label?: string;                // Optional display label
}
```

### Mode Configuration

```javascript
interface ModeConfiguration {
  mode: TimeDesignMode;          // Mode identifier
  version: number;               // Schema version
  segments: TimeSegment[];       // Ordered array of segments
  metadata: {
    created: Date;
    modified: Date;
    timezone?: string;
  };
}
```

### Mode Definition

```javascript
interface ModeDefinition {
  id: string;                    // Unique mode identifier
  name: string;                  // Display name
  description: string;           // User-facing description
  validator: (config: ModeConfiguration) => ValidationResult;
  calculator: (date: Date, config: ModeConfiguration) => TimeCalculation;
  defaultConfig: ModeConfiguration;
}
```

## 🔧 Core Algorithms

### Time Calculation Algorithm

```javascript
function calculateTimeForMode(
  realTime: Date,
  config: ModeConfiguration
): TimeCalculation {
  // 1. Get current time in minutes since midnight
  const currentMinutes = getMinutesSinceMidnight(realTime);
  
  // 2. Find active segment
  const activeSegment = config.segments.find(segment => 
    currentMinutes >= segment.startTime && 
    currentMinutes < segment.endTime
  );
  
  // 3. Calculate scaled time within segment
  const segmentElapsed = currentMinutes - activeSegment.startTime;
  const scaledElapsed = segmentElapsed * activeSegment.scaleFactor;
  
  // 4. Calculate display time
  const displayTime = calculateDisplayTime(
    activeSegment,
    scaledElapsed,
    config
  );
  
  return {
    displayTime,
    scaleFactor: activeSegment.scaleFactor,
    segmentType: activeSegment.type,
    isTransition: isNearTransition(currentMinutes, config)
  };
}
```

### Segment Validation

```javascript
function validateSegments(segments: TimeSegment[]): ValidationResult {
  const errors: string[] = [];
  
  // 1. Check coverage
  if (!coversFullDay(segments)) {
    errors.push('Segments must cover full 24-hour period');
  }
  
  // 2. Check overlaps
  if (hasOverlaps(segments)) {
    errors.push('Segments cannot overlap');
  }
  
  // 3. Check continuity
  if (!isContinuous(segments)) {
    errors.push('Segments must be continuous');
  }
  
  // 4. Mode-specific validation
  // (Implemented by each mode)
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## 🎨 Mode Implementations

### Classic Mode

```javascript
const ClassicMode: ModeDefinition = {
  id: 'classic',
  name: 'Classic Mode',
  description: 'Original Another Hour with time at the end of day',
  
  validator: (config) => {
    // Ensure exactly 2 segments
    // First segment: designed (0:00 to X)
    // Second segment: another (X to 24:00)
    return validateClassicMode(config);
  },
  
  calculator: (date, config) => {
    // Use standard calculation with 2 segments
    return calculateTimeForMode(date, config);
  },
  
  defaultConfig: {
    mode: 'classic',
    version: 1,
    segments: [
      {
        id: 'designed-main',
        type: 'designed',
        startTime: 0,
        endTime: 1380, // 23:00
        scaleFactor: 24/23
      },
      {
        id: 'another-hour',
        type: 'another',
        startTime: 1380,
        endTime: 1440, // 24:00
        scaleFactor: 1
      }
    ]
  }
};
```

### Core Time Mode

```javascript
const CoreTimeMode: ModeDefinition = {
  id: 'core-time',
  name: 'Core Time Mode',
  
  validator: (config) => {
    // Ensure exactly 3 segments
    // Morning AH + Core Time + Evening AH
    const segments = config.segments;
    
    if (segments.length !== 3) {
      return { valid: false, errors: ['Must have exactly 3 segments'] };
    }
    
    // Additional validations...
    return { valid: true, errors: [] };
  },
  
  // Calculator uses common algorithm
  calculator: calculateTimeForMode
};
```

## 🔄 State Management

### Storage Schema

```javascript
// localStorage keys
const STORAGE_KEYS = {
  CURRENT_MODE: 'timeDesignMode',
  MODE_CONFIG: 'timeDesignConfig',
  MODE_HISTORY: 'timeDesignHistory'
};

// Storage structure
interface StorageSchema {
  version: 2,
  currentMode: string,
  configurations: {
    [modeId: string]: ModeConfiguration
  },
  preferences: {
    defaultMode: string,
    autoSwitch: boolean
  }
}
```

### State Synchronization

```javascript
class TimeDesignState {
  private listeners: Set<StateListener> = new Set();
  
  updateMode(modeId: string, config: ModeConfiguration): void {
    // 1. Validate configuration
    const mode = ModeRegistry.get(modeId);
    const validation = mode.validator(config);
    
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    
    // 2. Update storage
    this.saveConfiguration(modeId, config);
    
    // 3. Notify listeners
    this.notifyListeners({
      type: 'MODE_UPDATED',
      modeId,
      config
    });
  }
}
```

## 🔌 Integration Points

### Clock Core Integration

```javascript
// Extended clock-core.js
export function getAnglesV2(
  date: Date,
  timezone: string,
  modeConfig?: ModeConfiguration
): ClockAngles {
  // Use mode-aware calculation if config provided
  if (modeConfig) {
    const timeCalc = TimeDesignManager.calculate(date, modeConfig);
    return calculateAnglesFromTime(timeCalc);
  }
  
  // Fall back to classic calculation
  return getAngles(date, timezone);
}
```

### UI Components

```javascript
// React/Vanilla JS component interface
interface TimeDesignUI {
  // Mode selector
  onModeChange: (modeId: string) => void;
  
  // Configuration editor
  onConfigUpdate: (config: ModeConfiguration) => void;
  
  // Real-time display
  onTimeUpdate: (calculation: TimeCalculation) => void;
}
```

## 🧪 Testing Strategy

### Unit Tests

```javascript
describe('TimeDesignModes', () => {
  describe('Core Time Mode', () => {
    it('should calculate correct scale factor', () => {
      const config = createCoreTimeConfig({
        morningAH: { start: 300, duration: 120 }, // 5:00-7:00
        eveningAH: { duration: 120, end: 1440 }   // 22:00-24:00
      });
      
      const calc = CoreTimeMode.calculator(
        new Date('2025-01-01T12:00:00'),
        config
      );
      
      expect(calc.scaleFactor).toBe(1.6); // 24/15
    });
  });
});
```

### Integration Tests

```javascript
it('should transition smoothly between segments', async () => {
  const clock = new TestClock();
  const config = getCoreTimeTestConfig();
  
  // Simulate time passing through transition
  for (let i = 0; i < 60; i++) {
    clock.tick(1000); // 1 second
    const calc = TimeDesignManager.calculate(clock.now(), config);
    
    // Verify no jumps in display time
    expect(calc.displayTime).toBeMonotonic();
  }
});
```

## 🚀 Performance Considerations

### Optimization Strategies

1. **Calculation Caching**
   ```javascript
   const calculationCache = new Map<string, TimeCalculation>();
   
   function getCachedCalculation(date: Date, config: ModeConfiguration) {
     const key = `${date.getTime()}-${config.mode}`;
     
     if (calculationCache.has(key)) {
       return calculationCache.get(key);
     }
     
     const result = calculateTimeForMode(date, config);
     calculationCache.set(key, result);
     
     // Clear old entries
     if (calculationCache.size > 1000) {
       clearOldestEntries(calculationCache, 500);
     }
     
     return result;
   }
   ```

2. **Segment Lookup Optimization**
   ```javascript
   // Pre-sort segments for binary search
   class SegmentIndex {
     private sorted: TimeSegment[];
     
     constructor(segments: TimeSegment[]) {
       this.sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
     }
     
     findActive(minutes: number): TimeSegment {
       // Binary search implementation
       return binarySearch(this.sorted, minutes);
     }
   }
   ```

## 🔐 Security Considerations

- Validate all user inputs for time ranges
- Sanitize configuration before storage
- Implement rate limiting for configuration updates
- Use schema versioning for safe migrations

## 📊 Monitoring and Analytics

```javascript
interface TimeDesignMetrics {
  modeUsage: {
    [modeId: string]: number;
  };
  averageConfigTime: number;
  transitionCounts: number;
  errorRates: {
    [errorType: string]: number;
  };
}
```

## 🔮 Future Extensions

### Plugin Architecture

```javascript
interface TimeDesignPlugin {
  id: string;
  name: string;
  modes?: ModeDefinition[];
  calculators?: CalculatorExtension[];
  validators?: ValidatorExtension[];
}

// Allow third-party mode definitions
TimeDesignManager.registerPlugin(myCustomPlugin);
```

### AI-Assisted Configuration

```javascript
interface AIAssistant {
  suggestMode(userPattern: UserPattern): ModeConfiguration;
  optimizeConfig(current: ModeConfiguration, goals: UserGoals): ModeConfiguration;
}
```

---

*This technical specification is a living document and will be updated as the implementation progresses.*