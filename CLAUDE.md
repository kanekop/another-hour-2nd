# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Another Hour is a time management platform that redefines our relationship with time. It's a TypeScript monorepo using npm workspaces, consisting of multiple packages including a core library, web applications, and a website.

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server (defaults to port 3000)
npm run dev
# Or with custom port:
PORT=8080 npm run dev

# Build all packages
npm run build

# Run tests (for core package)
npm run test --workspace=@another-hour/core

# Run tests with coverage
npm run test:coverage --workspace=@another-hour/core

# Build and watch for changes
npm run build:watch

# Package-specific commands
npm run dev:website      # Start Astro website dev server
npm run build:website    # Build Astro website
npm run dev:watch        # Start watch app dev server
```

## High-Level Architecture

### Monorepo Structure
- **packages/core**: Core time calculation library in TypeScript. Contains all time design modes (Classic, Core Time, Wake-Based, Solar) and shared utilities.
- **packages/scheduler-web**: Main web application (Express.js) with UI for clock, scheduler, timer, and stopwatch features.
- **packages/website**: Astro-based marketing website.
- **packages/clock-web**: Standalone clock application.
- **packages/watch-app**: Watch application interface.

### Key Concepts

1. **Time Design Modes**: The core innovation - different ways to scale and design time:
   - Classic Mode: Original Another Hour experience with continuous scaled day
   - Core Time Mode: Places Another Hour before/after active hours
   - Wake-Based Mode: Dynamic scaling from wake time to midnight
   - Solar Mode: Syncs with sunrise/sunset times

2. **Time Calculation Flow**:
   - User settings → TimeDesignManager → Specific Mode implementation → Time calculations
   - Each mode extends BaseMode and implements its own scaling logic

3. **Architecture Pattern**:
   - Core logic in TypeScript (`@another-hour/core`)
   - Web apps consume core via npm workspace dependency
   - Client-side JavaScript mirrors core structure for browser compatibility

### Important Files

- `/packages/core/src/TimeDesignManager.ts`: Central manager for all time modes
- `/packages/core/src/modes/`: Individual mode implementations
- `/packages/scheduler-web/server.js`: Main Express server (port 3000)
- `/dev-tools/time-design-test/`: Development testing UI

### Development Notes

- The project uses TypeScript with strict type checking
- Test files use Jest and are located alongside source files
- The scheduler-web package serves both API endpoints and static files
- Time calculations are complex - always refer to mode specifications in `/docs/specifications/`