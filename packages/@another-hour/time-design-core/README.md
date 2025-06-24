# @another-hour/time-design-core

Core Time Design Modes implementation for Another Hour project.

## 🎯 Purpose

This package provides a unified, single-source-of-truth implementation for all Time Design Modes, eliminating code duplication between different parts of the Another Hour application.

## 📦 Installation

```bash
npm install @another-hour/time-design-core
```

## 🚀 Usage

```javascript
import { TimeDesignManager, ClassicMode, CoreTimeMode } from '@another-hour/time-design-core';

// Initialize the manager
const manager = new TimeDesignManager();

// Use a specific mode
const classicMode = new ClassicMode();
const result = classicMode.calculate(new Date(), 'America/New_York', config);
```

## 📋 Available Modes

- **ClassicMode**: The original Another Hour experience
- **CoreTimeMode**: Define productive hours with Another Hour periods
- **WakeBasedMode**: Day designed around your wake-up time
- **SolarMode**: Time synchronized with the sun's movement

## 🔧 Development

This package is part of the Another Hour monorepo. All modes are implemented following a consistent pattern based on the abstract `BaseMode` class.

## 📄 License

MIT © Another Hour Team