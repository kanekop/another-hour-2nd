# Project Structure

This document outlines the monorepo structure for the Another Hour project.

## Root Directory

The root directory contains configuration files for the entire monorepo and the `packages` and `docs` directories.

```
another-hour/
├── packages/             -- Contains all individual packages (applications and libraries).
├── docs/                 -- Contains all project documentation.
├── .replit               -- Configuration for the Replit environment.
├── lerna.json            -- Configuration for Lerna, configured to use npm workspaces.
├── package.json          -- Root package file, defines workspaces and root scripts.
└── README.md             -- Main project README.
```

## `packages/` Directory

This directory houses all the independent packages of the project, managed by NPM Workspaces.

### `@another-hour/core`

This package contains shared logic, constants, and utility functions used across multiple applications. It is the foundation of the time calculation system.

-   **`src/`**: Contains the source code for the core library.
    -   **`time-calculation.js`**: Exports key functions like `getCustomAhAngles` for time scaling and clock calculations.
-   **`package.json`**: Defines dependencies and metadata for the `@another-hour/core` library.

### `@another-hour/scheduler-web`

This is the main web application for the Another Hour scheduler. It depends on `@another-hour/core` for its time logic.

-   **`public/`**: Contains all static assets like HTML, CSS, images, and client-side JavaScript for the UI.
-   **`src/`**: Contains server-side source code, primarily for handling API routes and backend logic.
-   **`server.js`**: The main entry point for the Node.js/Express server.
-   **`package.json`**: Defines dependencies (including `@another-hour/core`) and scripts specific to the `scheduler-web` application.

## `docs/` Directory

This directory contains all documentation for the project.

-   **`specifications/`**: Detailed technical specifications for core features and modes.
-   **`time-design-modes/`**: User-friendly explanations of how each time design mode works.
-   **`MONOREPO_GUIDE.md`**: This guide, explaining the structure and development workflow of the monorepo.
-   **`DEVELOPMENT.md`**: Instructions for setting up the development environment and running the project.

This structured approach allows for clear separation of concerns, easier dependency management, and better scalability as the project grows.

## 🌳 Directory Tree

Here is a simplified tree of the current project structure:

```
.
├── docs/
│   ├── ... (documentation files)
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   └── time-calculation.js
│   │   └── package.json
│   └── scheduler-web/
│       ├── public/
│       │   ├── css/
│       │   ├── js/
│       │   └── index.html
│       ├── src/
│       ├── server.js
│       └── package.json
├── lerna.json
├── package.json
└── README.md
```

## 📂 Top-Level Directory Guide

### `/` (Root)

-   `README.md`: The first stop for anyone new to the project. Contains a general overview and setup instructions.
-   `package.json`: Defines project metadata, workspaces, and root-level scripts.
-   `server.js`: The main entry point for the Node.js backend server.

### `/docs`

This directory contains all project-related documentation.

-   `/docs/time-design-modes`: A crucial section containing the conceptual overview, technical specifications, and detailed guides for each Time Design Mode. This is the best place to understand the "why" and "how" behind the core logic.
    -   `/docs/time-design-modes/modes`: Contains deep-dive documents for each specific mode (`SolarMode`, `WakeBasedMode`, etc.), explaining their unique concepts and calculations.

### `/packages`

This is the heart of the monorepo, containing all the code.

-   **/packages/core**: This is the most important library. It contains the core logic for all time calculations and concepts within the Another Hour ecosystem. Any new application should rely on this package for time-related functionality.
-   **/packages/scheduler-web**: The main web application that provides the user-facing scheduling interface. It consumes the `@another-hour/core` package.
    -   `/packages/scheduler-web/public`: Contains all static assets for the web app's frontend.
    -   `/packages/scheduler-web/server.js`: The entry point for the web server.

---
*This document should be kept up-to-date as the project evolves.* 