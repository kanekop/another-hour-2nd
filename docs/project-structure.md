# Project Structure

This document provides a comprehensive overview of the file and directory structure of the "Another Hour Scheduler" project.

## 🌳 Directory Tree

Here is a complete tree of the project's files and folders:

```
.
|   .gitignore
|   package.json
|   README.md
|   server.js
|
+---docs
|   |   DEVELOPMENT.md
|   |   ... (other documentation files)
|   |
|   \---time-design-modes
|       |   overview.md
|       |   ... (other specification files)
|       |
|       \---modes
|               core-time-mode.md
|               solar-mode.md
|               wake-based-mode.md
|
+---public
|   |   index.html
|   |   time-design-test.html
|   |
|   +---css
|   |       main-clock.css
|   |       ... (other style files)
|   |
|   +---js
|   |   |   main.js
|   |   |   time-design-test-main.js
|   |   |
|   |   \---time-design
|   |       |   TimeDesignManager.js
|   |       |   ModeRegistry.js
|   |       |
|   |       \---modes
|   |               BaseMode.js
|   |               ClassicMode.js
|   |               CoreTimeMode.js
|   |               SolarMode.js
|   |               WakeBasedMode.js
|   |
|   \---pages
|           main-clock.html
|           ... (other application pages)
|
\---src
    +---routes
    |       ... (server-side route handlers)
    |
    +---services
    |       ... (external API services)
    |
    \---shared
            ... (shared utilities)
```

## 📂 Top-Level Directory Guide

### `/` (Root)

-   `README.md`: The first stop for anyone new to the project. Contains a general overview and setup instructions.
-   `package.json`: Defines project metadata, dependencies, and scripts.
-   `server.js`: The main entry point for the Node.js backend server.

### `/docs`

This directory contains all project-related documentation.

-   `/docs/time-design-modes`: A crucial section containing the conceptual overview, technical specifications, and detailed guides for each Time Design Mode. This is the best place to understand the "why" and "how" behind the core logic.
    -   `/docs/time-design-modes/modes`: Contains deep-dive documents for each specific mode (`SolarMode`, `WakeBasedMode`, etc.), explaining their unique concepts and calculations.

### `/public`

Contains all static assets that are served directly to the client's browser. This is the heart of the frontend application.

-   `index.html`: The main landing page for the application.
-   `time-design-test.html`: The comprehensive test page used for developing and debugging the Time Design Modes system.
-   `/public/css`: Contains all CSS files for styling the application's various pages and components.
-   `/public/js`: The core of the client-side logic.
    -   `main.js`: The main entry point for the primary clock application.
    -   `time-design-test-main.js`: The entry point and UI logic specifically for the `time-design-test.html` page.
    -   `/public/js/time-design`: This is the most important directory for the core scheduling logic.
        -   `TimeDesignManager.js`: The central brain of the system. It manages the current mode, handles configuration changes, and performs the time calculations.
        -   `ModeRegistry.js`: Responsible for discovering and registering all available mode classes.
        -   `/public/js/time-design/modes`: Contains the individual class definitions for each mode.
            -   `BaseMode.js`: The abstract parent class that all other modes inherit from. Defines the common interface.
            -   `ClassicMode.js`, `CoreTimeMode.js`, etc.: The specific implementations for each mode, containing their unique configuration schema and calculation logic.

### `/src`

Contains server-side source code, primarily for backend services and APIs that might be needed in the future (e.g., for user accounts or calendar synchronization).

---
*This document should be kept up-to-date as the project evolves.* 