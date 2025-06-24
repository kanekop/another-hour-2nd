# Another Hour for Bangle.js2 - Technical Specification

**Version**: 1.0  
**Date**: 2025-06-13  
**Platform**: Bangle.js2 (Espruino)  
**Author**: Another Hour Project Team

## 1. Overview

Another Hour is a time management application for Bangle.js2 that allows users to redefine their relationship with time by implementing a custom time scaling system.

## 2. Core Concept

### 2.1 Time Scaling Model
- **Designed 24**: User-defined hours treated as a full day (currently fixed at 16 hours)
- **Scale Factor**: 24/16 = 1.5x (time flows 1.5 times faster)
- **Another Hour**: The remaining 8 hours experienced at normal speed

### 2.2 Operating Modes
1. **NORMAL Mode**: Standard 24-hour time display
2. **AH ON Mode**: Scaled time display using the Designed 24 system

## 3. User Interface

### 3.1 Display Layout
```
┌─────────────────┐
│                 │
│    HH:MM:SS     │  <- Time Display (center)
│                 │
│    NORMAL       │  <- Mode Status
│    SEC:ON       │  <- Seconds Display Status
│                 │
└─────────────────┘
```

### 3.2 Visual Specifications
- **Time Display**: 
  - Font: Vector
  - Size: 35 (with seconds) / 40 (without seconds)
  - Alignment: Center
  - Format: HH:MM:SS or HH:MM

- **Status Display**:
  - Mode: Font "6x8" size 2
  - Seconds status: Font "6x8" size 1
  - Position: Below time display

## 4. User Interaction

### 4.1 Touch Controls
The screen is divided into two interactive zones:

```
┌─────────────────┐
│  Upper Half:    │ -> Tap to toggle Another Hour mode
│  AH ON/OFF      │
├─────────────────┤
│  Lower Half:    │ -> Tap to toggle seconds display
│  SEC ON/OFF     │
└─────────────────┘
```

### 4.2 Hardware Button
- **Long press**: Not available (reserved by system for app exit)
- **Short press**: No function assigned

## 5. Data Management

### 5.1 Storage
Settings are persisted in `anotherhour.json`:

```javascript
{
  "designedHours": 16,      // Hours in a "designed day"
  "active": false,          // Another Hour mode state
  "showSeconds": true       // Seconds display state
}
```

### 5.2 Default Values
- `designedHours`: 16 (hardcoded in v1.0)
- `active`: false
- `showSeconds`: true

## 6. Power Management

### 6.1 Update Intervals
- **With seconds**: Screen updates every 1000ms
- **Without seconds**: Screen updates every 5000ms

### 6.2 Battery Optimization
- Dynamic refresh rate based on seconds display setting
- Minimal graphics operations (full screen clear on each update)

## 7. Time Calculation Algorithm

### 7.1 Conversion Formula
```javascript
if (AH mode active) {
  scaleFactor = 24 / designedHours
  totalSeconds = (hours * 3600) + (minutes * 60) + seconds
  scaledSeconds = floor(totalSeconds * scaleFactor)
  
  displayHours = floor(scaledSeconds / 3600) % 24
  displayMinutes = floor((scaledSeconds % 3600) / 60)
  displaySeconds = scaledSeconds % 60
}
```

### 7.2 Known Issues
- Minor calculation discrepancies in edge cases
- No handling of date transitions

## 8. Technical Constraints

### 8.1 Platform Limitations
- Memory: ~64KB available RAM
- Display: 176x176 pixels, 3-bit color
- Touch: Single touch point detection
- Storage: Limited to JSON format

### 8.2 Development Constraints
- No access to system button long press
- Limited debugging capabilities on device
- Web Bluetooth required for deployment

## 9. Installation Method

### 9.1 Requirements
- Espruino Web IDE (https://www.espruino.com/ide/)
- Chrome/Edge browser with Web Bluetooth support
- Bangle.js2 with Bluetooth enabled

### 9.2 Installation Steps
1. Connect to Bangle.js2 via Web Bluetooth
2. Upload the application code
3. App runs immediately after upload

## 10. Future Enhancements

### 10.1 Planned Features
- Configurable `designedHours` setting
- Improved time calculation accuracy
- Date display integration
- Widget version for always-on display
- Multiple time zone support

### 10.2 Potential Optimizations
- Partial screen updates for better battery life
- Custom font for improved readability
- Gesture support for additional controls

## 11. Version History

### v1.0 (2025-06-13)
- Initial release
- Basic Another Hour functionality
- Seconds display toggle
- Touch-based controls
- Settings persistence

---

*This document represents the current state of the Another Hour application for Bangle.js2. It will be updated as new features are implemented and issues are resolved.*