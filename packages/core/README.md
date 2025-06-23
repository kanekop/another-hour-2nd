# @another-hour/core

Core time calculation logic and Time Design Modes implementation for the Another Hour project. This package provides the unified TypeScript implementation of all time design modes and utilities.

## 📦 Installation

From the monorepo root:
```bash
npm install --workspace=@another-hour/core
```

## 🚀 Usage

### Basic Time Calculations
```javascript
const { 
  getCustomAhAngles, 
  convertToAHTime, 
  isInDesigned24 
} = require('@another-hour/core');

// Set up time parameters
const d24StartTime = new Date('2025-06-14T06:00:00');
const designed24Duration = 16; // hours
const currentTime = new Date();

// Calculate clock angles
const angles = getCustomAhAngles(currentTime, designed24Duration, d24StartTime);
console.log(`Hour hand: ${angles.hourAngle}°, Minute hand: ${angles.minuteAngle}°`);
```

### Time Design Modes
```javascript
import { TimeDesignManager, ClassicMode, TimeDesignMode } from '@another-hour/core';

// Get the singleton instance
const manager = TimeDesignManager.getInstance();

// Register and set a mode
manager.registerMode(TimeDesignMode.Classic, ClassicMode);
manager.setMode(TimeDesignMode.Classic, {
  mode: TimeDesignMode.Classic,
  parameters: { designed24Duration: 1380 } // 23 hours
});

// Calculate Another Hour time
const ahTime = manager.calculateAnotherHourTime(new Date());
console.log(`Another Hour time: ${ahTime}`);
```

### Browser Usage
```html
<script type="module">
  import { TimeDesignManager } from './node_modules/@another-hour/core/dist/core.browser.js';
  
  const manager = TimeDesignManager.getInstance();
  // Use the manager in your browser application
</script>
```

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode for development:
```bash
npm run test:watch
```

## 📊 API Reference

### Time Calculation Functions

#### `getCustomAhAngles(currentTime, designed24Duration, d24StartTime)`
Calculate clock hand angles for Another Hour display.

**Parameters:**
- `currentTime` (Date): Current time to calculate for
- `designed24Duration` (number): Duration of Designed 24 period in hours
- `d24StartTime` (Date): Start time of Designed 24 period

**Returns:** Object with `hourAngle` and `minuteAngle` (0-359 degrees)

### Time Design Modes

#### Available Modes
- **ClassicMode**: Original Another Hour experience with Designed 24 + Another Hour periods
- **CoreTimeMode**: Productivity-focused with morning/evening Another Hour + central Core Time
- **WakeBasedMode**: Dynamic scaling based on wake time
- **SolarMode**: Natural time based on solar movements

#### TimeDesignManager API

##### `getInstance()`
Get the singleton instance of TimeDesignManager.

##### `registerMode(modeName: string, modeClass: typeof BaseMode)`
Register a new time design mode.

##### `setMode(modeName: string, config: TimeDesignModeConfig)`
Set the active time design mode with configuration.

##### `calculateAnotherHourTime(realTime: Date): Date`
Calculate Another Hour time based on the current mode.

##### `getCurrentPhase(currentTime: Date): { name: string; progress: number }`
Get the current time phase and progress.

##### `getClockAngles(currentTime: Date): ClockAngles`
Get clock hand angles for the current mode.

## 🔧 Development

This package is part of the Another Hour monorepo. For development guidelines, see the [Monorepo Guide](../../docs/MONOREPO_GUIDE.md).

## 📝 License

MIT