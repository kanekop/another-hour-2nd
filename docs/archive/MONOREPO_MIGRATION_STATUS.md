# Another Hour Monorepo Development Guide

## 📋 Overview

This guide documents the monorepo architecture of the Another Hour project and provides instructions for developers working with or extending the system.

## 🗓️ Last Updated: 2025-06-14

## 🏗️ Project Architecture

### Current Structure

```
another-hour/
├── packages/
│   ├── scheduler-web/      ✅ Web-based scheduler application
│   ├── core/              🔄 Shared time calculation logic (planned)
│   ├── clock-web/         📋 Basic clock application (planned)
│   └── watch-app/         📋 Smartwatch application (planned)
├── docs/                   📚 Project documentation
├── scripts/               🔧 Build and utility scripts
├── package.json           📦 Workspace configuration
├── lerna.json            🔗 Monorepo management
└── README.md             📖 Project overview
```

### Package Descriptions

#### `@another-hour/scheduler-web` (Implemented)
- Full-featured web scheduler with Google Calendar integration
- Dual-time display (Real time + Another Hour time)
- Event management with time conversion
- Status: **Production Ready**

#### `@another-hour/core` (Next Priority)
- Shared time calculation logic
- Time Design Modes implementation
- Constants and utilities
- Status: **In Planning**

#### `@another-hour/clock-web` (Future)
- Simplified clock interface
- Focus on time display and basic features
- No calendar integration
- Status: **Planned**

#### `@another-hour/watch-app` (Future)
- Native smartwatch applications
- Optimized for small screens
- Battery-efficient design
- Status: **Planned**

## 🚀 Development Workflow

### Setting Up the Development Environment

```bash
# Clone the repository
git clone https://github.com/kanekop/another-hour.git
cd another-hour

# Install dependencies
npm install

# Run the scheduler application
npm run start
# or
npm run start --workspace=@another-hour/scheduler-web
```

### Working with Packages

```bash
# Add a dependency to a specific package
npm install <package-name> --workspace=@another-hour/scheduler-web

# Run scripts in a specific package
npm run <script> --workspace=@another-hour/<package-name>

# Run scripts in all packages
npm run <script> --workspaces
```

### Creating a New Package

1. **Create package directory**
   ```bash
   mkdir -p packages/<package-name>/src
   cd packages/<package-name>
   ```

2. **Initialize package**
   ```bash
   npm init -y
   # Edit package.json to set name as @another-hour/<package-name>
   ```

3. **Update root configuration**
   - Ensure the package path is included in workspaces

4. **Install dependencies**
   ```bash
   npm install --workspace=@another-hour/<package-name>
   ```

## 🔄 Migration History

### Phase 1: Monorepo Setup ✅
- Restructured from single repository to monorepo
- Moved scheduler to `packages/scheduler-web/`
- Configured npm workspaces
- Maintained all existing functionality

### Phase 2: Core Extraction 🔄
**Next Steps:**
1. Create `@another-hour/core` package
2. Extract common logic from `scheduler-web/public/clock-core.js`
3. Key functions to extract:
   - `getCustomAhAngles()`
   - `convertToAHTime()`
   - Time scaling calculations
4. Update scheduler-web to use core package

### Phase 3: Additional Applications 📋
- Implement clock-web for users who want just the clock
- Develop watch-app for wearable devices
- Each app will depend on the shared core

## 🛠️ Technical Guidelines

### Package Naming Convention
- All packages use scoped names: `@another-hour/<package-name>`
- Use kebab-case for package names
- Be descriptive but concise

### Dependency Management
- Shared dependencies go in the root `package.json`
- Package-specific dependencies go in the package's `package.json`
- Use workspace protocol for internal dependencies: `"@another-hour/core": "workspace:*"`

### Code Organization
```
packages/<package-name>/
├── src/               # Source code
├── public/            # Static assets (for web packages)
├── tests/             # Test files
├── package.json       # Package configuration
└── README.md          # Package-specific documentation
```

### Testing Strategy
- Unit tests for core logic
- Integration tests for package interactions
- E2E tests for user-facing applications

## 📝 Important Notes

### Environment Considerations
- **Replit**: Full functionality including OAuth
- **Local Development**: Limited to non-OAuth features
- Google Calendar integration requires proper OAuth setup

### Current Limitations
- OAuth only works in deployed environments (not localhost)
- Some features may require Replit-specific configuration
- See individual package READMEs for specific limitations

## 🎯 Roadmap

### Immediate (Q3 2025)
- [ ] Complete core package extraction
- [ ] Add comprehensive tests
- [ ] Update documentation

### Short-term (Q4 2025)
- [ ] Launch clock-web package
- [ ] Implement Time Design Modes
- [ ] Add TypeScript support

### Long-term (2026)
- [ ] Release watch-app for multiple platforms
- [ ] Add more calendar integrations
- [ ] Implement team/shared time features

## 🤝 Contributing

1. **Understand the Architecture**: Read this guide thoroughly
2. **Choose the Right Package**: Add code to the appropriate package
3. **Follow Conventions**: Maintain consistency with existing code
4. **Test Thoroughly**: Ensure changes don't break other packages
5. **Document Changes**: Update relevant documentation

## 📚 Additional Resources

- [Time Design Modes Documentation](./time-design-modes/)
- [API Reference](./api/)
- [Original Clock Project](https://github.com/kanekop/another-hour-clock)

---

*This document serves as the primary guide for developers working with the Another Hour monorepo. Keep it updated as the architecture evolves.*