# @another-hour/core

Core time calculation logic for the Another Hour project.

## 📦 Installation

From the monorepo root:
```bash
npm install --workspace=@another-hour/core
```

## 🚀 Usage

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

// Convert to Another Hour time
const ahTime = convertToAHTime(currentTime, designed24Duration, d24StartTime);
console.log(`Another Hour time: ${ahTime.hours}:${ahTime.minutes}`);

// Check if in Designed 24 period
const inD24 = isInDesigned24(currentTime, designed24Duration, d24StartTime);
console.log(`Currently in ${inD24 ? 'Designed 24' : 'Another Hour'} period`);
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

### `getCustomAhAngles(currentTime, designed24Duration, d24StartTime)`
Calculate clock hand angles for Another Hour display.

**Parameters:**
- `currentTime` (Date): Current time to calculate for
- `designed24Duration` (number): Duration of Designed 24 period in hours
- `d24StartTime` (Date): Start time of Designed 24 period

**Returns:** Object with `hourAngle` and `minuteAngle` (0-359 degrees)

### `convertToAHTime(realTime, designed24Duration, d24StartTime)`
Convert real world time to Another Hour time.

**Parameters:**
- `realTime` (Date): Real world time to convert
- `designed24Duration` (number): Duration of Designed 24 period in hours
- `d24StartTime` (Date): Start time of Designed 24 period

**Returns:** Object with `hours` (0-23) and `minutes` (0-59)

### `getTimeScalingFactor(designed24Duration)`
Calculate the time scaling factor for Designed 24 period.

**Parameters:**
- `designed24Duration` (number): Duration of Designed 24 period in hours

**Returns:** Number representing the scaling factor

### `isInDesigned24(currentTime, designed24Duration, d24StartTime)`
Check if a given time falls within the Designed 24 period.

**Parameters:**
- `currentTime` (Date): Time to check
- `designed24Duration` (number): Duration of Designed 24 period in hours
- `d24StartTime` (Date): Start time of Designed 24 period

**Returns:** Boolean indicating if time is within Designed 24

## 🔧 Development

This package is part of the Another Hour monorepo. For development guidelines, see the [Monorepo Guide](../../docs/MONOREPO_GUIDE.md).

## 📝 License

MIT