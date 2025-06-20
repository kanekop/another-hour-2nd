# Migration Plan 

# Time Design Modes Migration Plan

## 📋 Overview

This document outlines the migration strategy from the current single-mode Another Hour system to the new Time Design Modes architecture. The migration is designed to be gradual, safe, and completely backward compatible.

## 🎯 Migration Goals

1. **Zero Downtime**: Users experience no interruption
2. **Data Preservation**: All user settings are maintained
3. **Gradual Rollout**: Feature flags enable controlled deployment
4. **Easy Rollback**: Can revert at any point
5. **Clear Communication**: Users understand the changes

## 📊 Current State Analysis

### Existing Data Structure
```javascript
// Current localStorage schema
{
  "personalizedAhDurationMinutes": "1380",    // 23 hours
  "personalizedAhSelectedTimezone": "Asia/Tokyo",
  "clockFaceTheme": "classic",
  "colorThemeScaled24": "default",
  "colorThemeAH": "default"
}
```

### Current Code Dependencies
```
clock-core.js
├── getCustomAhAngles()      // Main calculation function
├── SCALE_AH constant        // Fixed 24/23 scaling
└── Used by:
    ├── personalized-ah-clock-ui.js
    ├── scheduler-ui.js
    ├── stopwatch-ui.js
    └── timer-ui.js
```

## 🔄 Migration Phases

### Phase 0: Preparation (Week 1)
- [ ] Create feature flag system
- [ ] Set up A/B testing infrastructure
- [ ] Implement telemetry for migration monitoring
- [ ] Create rollback procedures

### Phase 1: Shadow Mode (Week 2-3)
- [ ] Deploy new Time Design system alongside existing
- [ ] Run parallel calculations for validation
- [ ] Log discrepancies for analysis
- [ ] No user-visible changes

### Phase 2: Opt-in Beta (Week 4-5)
- [ ] Enable feature flag for beta users
- [ ] Add "Try New Time Modes" option in settings
- [ ] Collect feedback and usage data
- [ ] Fix identified issues

### Phase 3: Gradual Rollout (Week 6-7)
- [ ] 10% of users → 25% → 50% → 100%
- [ ] Monitor performance and errors
- [ ] Adjust based on metrics
- [ ] Prepare support documentation

### Phase 4: Full Migration (Week 8)
- [ ] Make Time Design Modes the default
- [ ] Keep legacy mode available
- [ ] Update all documentation
- [ ] Communicate changes to users

## 🔧 Technical Migration Steps

### Step 1: Data Migration Script

```javascript
// public/js/migration/v2-migration.js

export class TimeDesignMigration {
  static MIGRATION_VERSION = 2;
  
  static migrate() {
    const migrationDone = localStorage.getItem('timeDesignMigrationVersion');
    
    if (migrationDone >= this.MIGRATION_VERSION) {
      console.log('Migration already completed');
      return;
    }
    
    try {
      this.backupCurrentData();
      this.migrateToTimeDesignFormat();
      this.validateMigration();
      this.markMigrationComplete();
    } catch (error) {
      console.error('Migration failed:', error);
      this.rollbackMigration();
      throw error;
    }
  }
  
  static backupCurrentData() {
    const backup = {
      timestamp: Date.now(),
      version: 1,
      data: {
        personalizedAhDurationMinutes: localStorage.getItem('personalizedAhDurationMinutes'),
        personalizedAhSelectedTimezone: localStorage.getItem('personalizedAhSelectedTimezone'),
        clockFaceTheme: localStorage.getItem('clockFaceTheme'),
        colorThemeScaled24: localStorage.getItem('colorThemeScaled24'),
        colorThemeAH: localStorage.getItem('colorThemeAH')
      }
    };
    
    localStorage.setItem('anotherHourBackup_v1', JSON.stringify(backup));
    console.log('Backup created:', backup);
  }
  
  static migrateToTimeDesignFormat() {
    const oldDuration = parseInt(localStorage.getItem('personalizedAhDurationMinutes')) || 1380;
    const timezone = localStorage.getItem('personalizedAhSelectedTimezone') || 'UTC';
    
    // Convert to Classic Mode configuration
    const classicModeConfig = {
      mode: 'classic',
      version: 2,
      segments: [
        {
          id: 'designed-main',
          type: 'designed',
          startTime: 0,
          endTime: oldDuration,
          scaleFactor: 1440 / oldDuration  // 24 hours / designed hours
        },
        {
          id: 'another-hour',
          type: 'another',
          startTime: oldDuration,
          endTime: 1440,
          scaleFactor: 1
        }
      ],
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        timezone: timezone,
        migratedFrom: 'v1'
      }
    };
    
    // Save new format
    const timeDesignConfig = {
      version: 2,
      currentMode: 'classic',
      configurations: {
        classic: classicModeConfig
      },
      preferences: {
        defaultMode: 'classic',
        autoSwitch: false,
        enableExperimental: false
      }
    };
    
    localStorage.setItem('timeDesignConfig', JSON.stringify(timeDesignConfig));
    localStorage.setItem('timeDesignMode', 'classic');
    
    console.log('Migrated to Time Design format:', timeDesignConfig);
  }
  
  static validateMigration() {
    // Run validation checks
    const config = JSON.parse(localStorage.getItem('timeDesignConfig'));
    
    if (!config || config.version !== 2) {
      throw new Error('Migration validation failed: Invalid config version');
    }
    
    if (!config.configurations.classic) {
      throw new Error('Migration validation failed: Classic mode not found');
    }
    
    // Verify calculations match
    const oldDuration = parseInt(localStorage.getItem('personalizedAhDurationMinutes')) || 1380;
    const newDuration = config.configurations.classic.segments[0].endTime;
    
    if (oldDuration !== newDuration) {
      throw new Error(`Duration mismatch: ${oldDuration} vs ${newDuration}`);
    }
    
    console.log('Migration validation passed');
  }
  
  static markMigrationComplete() {
    localStorage.setItem('timeDesignMigrationVersion', this.MIGRATION_VERSION.toString());
    localStorage.setItem('timeDesignMigrationDate', new Date().toISOString());
    console.log('Migration marked as complete');
  }
  
  static rollbackMigration() {
    console.warn('Rolling back migration...');
    
    // Remove new format data
    localStorage.removeItem('timeDesignConfig');
    localStorage.removeItem('timeDesignMode');
    localStorage.removeItem('timeDesignMigrationVersion');
    
    // Restore backup if needed
    const backup = localStorage.getItem('anotherHourBackup_v1');
    if (backup) {
      const backupData = JSON.parse(backup);
      Object.entries(backupData.data).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
    }
    
    console.log('Rollback completed');
  }
}
```

### Step 2: Compatibility Layer

```javascript
// public/js/migration/compatibility-layer.js

export class CompatibilityLayer {
  static initialize() {
    // Intercept old function calls and redirect to new system
    this.shimOldFunctions();
    this.setupStorageProxy();
    this.monitorUsage();
  }
  
  static shimOldFunctions() {
    // Save original function
    const originalGetCustomAhAngles = window.getCustomAhAngles;
    
    // Create shim
    window.getCustomAhAngles = function(date, timezone, duration) {
      console.log('Legacy function called: getCustomAhAngles');
      
      // Check if new system is available
      if (window.timeDesignManager && window.timeDesignManager.isInitialized()) {
        // Use new system with classic mode
        return window.getTimeDesignAngles(date, timezone, 'classic', {
          segments: [
            {
              type: 'designed',
              startTime: 0,
              endTime: duration,
              scaleFactor: 1440 / duration
            },
            {
              type: 'another',
              startTime: duration,
              endTime: 1440,
              scaleFactor: 1
            }
          ]
        });
      }
      
      // Fall back to original
      return originalGetCustomAhAngles.call(this, date, timezone, duration);
    };
  }
  
  static setupStorageProxy() {
    // Intercept localStorage calls to maintain compatibility
    const originalSetItem = Storage.prototype.setItem;
    
    Storage.prototype.setItem = function(key, value) {
      // If setting old key, also update new format
      if (key === 'personalizedAhDurationMinutes') {
        CompatibilityLayer.updateNewFormatDuration(value);
      }
      
      // Call original
      return originalSetItem.call(this, key, value);
    };
  }
  
  static updateNewFormatDuration(durationMinutes) {
    try {
      const config = JSON.parse(localStorage.getItem('timeDesignConfig'));
      if (config && config.configurations.classic) {
        const duration = parseInt(durationMinutes);
        config.configurations.classic.segments[0].endTime = duration;
        config.configurations.classic.segments[0].scaleFactor = 1440 / duration;
        config.configurations.classic.segments[1].startTime = duration;
        config.configurations.classic.metadata.modified = new Date().toISOString();
        
        localStorage.setItem('timeDesignConfig', JSON.stringify(config));
      }
    } catch (error) {
      console.error('Failed to update new format:', error);
    }
  }
  
  static monitorUsage() {
    // Track usage of legacy vs new APIs
    window.anotherHourTelemetry = {
      legacyCalls: 0,
      newCalls: 0,
      errors: []
    };
    
    // Send telemetry periodically
    setInterval(() => {
      if (window.anotherHourTelemetry.legacyCalls > 0 || 
          window.anotherHourTelemetry.newCalls > 0) {
        this.sendTelemetry(window.anotherHourTelemetry);
        // Reset counters
        window.anotherHourTelemetry.legacyCalls = 0;
        window.anotherHourTelemetry.newCalls = 0;
      }
    }, 60000); // Every minute
  }
  
  static sendTelemetry(data) {
    // In production, send to analytics service
    console.log('Telemetry:', data);
  }
}
```

### Step 3: Feature Flag System

```javascript
// public/js/migration/feature-flags.js

export class FeatureFlags {
  static FLAGS = {
    TIME_DESIGN_MODES: 'timeDesignModesEnabled',
    WAKE_BASED_MODE: 'wakeBasedModeEnabled',
    SOLAR_MODE: 'solarModeEnabled',
    MIGRATION_BANNER: 'showMigrationBanner'
  };
  
  static async initialize() {
    // Check for server-side flags
    try {
      const response = await fetch('/api/feature-flags');
      const serverFlags = await response.json();
      this.applyServerFlags(serverFlags);
    } catch (error) {
      console.log('Using local feature flags');
    }
    
    // Apply user overrides
    this.applyUserOverrides();
  }
  
  static isEnabled(flagName) {
    // Check URL parameters first (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const urlFlag = urlParams.get(`flag_${flagName}`);
    if (urlFlag !== null) {
      return urlFlag === 'true';
    }
    
    // Check localStorage
    const stored = localStorage.getItem(`featureFlag_${flagName}`);
    if (stored !== null) {
      return stored === 'true';
    }
    
    // Default values
    const defaults = {
      [this.FLAGS.TIME_DESIGN_MODES]: false,
      [this.FLAGS.WAKE_BASED_MODE]: false,
      [this.FLAGS.SOLAR_MODE]: false,
      [this.FLAGS.MIGRATION_BANNER]: true
    };
    
    return defaults[flagName] || false;
  }
  
  static enable(flagName) {
    localStorage.setItem(`featureFlag_${flagName}`, 'true');
    this.notifyFlagChange(flagName, true);
  }
  
  static disable(flagName) {
    localStorage.setItem(`featureFlag_${flagName}`, 'false');
    this.notifyFlagChange(flagName, false);
  }
  
  static notifyFlagChange(flagName, enabled) {
    window.dispatchEvent(new CustomEvent('featureFlagChanged', {
      detail: { flag: flagName, enabled }
    }));
  }
}
```

### Step 4: UI Migration Components

```javascript
// public/js/migration/migration-ui.js

export class MigrationUI {
  static showMigrationBanner() {
    if (!FeatureFlags.isEnabled(FeatureFlags.FLAGS.MIGRATION_BANNER)) {
      return;
    }
    
    const banner = document.createElement('div');
    banner.className = 'migration-banner';
    banner.innerHTML = `
      <div class="migration-banner-content">
        <h3>🎉 New Feature: Time Design Modes</h3>
        <p>Discover new ways to customize how time flows in your day!</p>
        <div class="migration-banner-actions">
          <button class="btn-primary" onclick="MigrationUI.startMigration()">
            Try New Modes
          </button>
          <button class="btn-secondary" onclick="MigrationUI.dismissBanner()">
            Maybe Later
          </button>
        </div>
      </div>
      <style>
        .migration-banner {
          position: fixed;
          bottom: 20px;
          right: 20px;
          max-width: 400px;
          background: #4CAF50;
          color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .migration-banner h3 {
          margin: 0 0 10px 0;
        }
        
        .migration-banner p {
          margin: 0 0 15px 0;
        }
        
        .migration-banner-actions {
          display: flex;
          gap: 10px;
        }
        
        .migration-banner button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .btn-primary {
          background: white;
          color: #4CAF50;
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
      </style>
    `;
    
    document.body.appendChild(banner);
  }
  
  static startMigration() {
    // Enable Time Design Modes
    FeatureFlags.enable(FeatureFlags.FLAGS.TIME_DESIGN_MODES);
    
    // Run migration
    TimeDesignMigration.migrate();
    
    // Redirect to settings
    window.location.href = '/pages/personalized-ah-clock.html?showModes=true';
  }
  
  static dismissBanner() {
    // Hide banner
    document.querySelector('.migration-banner')?.remove();
    
    // Don't show again for 7 days
    localStorage.setItem('migrationBannerDismissed', Date.now());
    
    // Track dismissal
    this.trackEvent('migration_banner_dismissed');
  }
  
  static showMigrationGuide() {
    const guide = document.createElement('div');
    guide.className = 'migration-guide-overlay';
    guide.innerHTML = `
      <div class="migration-guide">
        <button class="close-guide" onclick="this.parentElement.parentElement.remove()">×</button>
        
        <h2>Welcome to Time Design Modes! 🎨</h2>
        
        <div class="guide-section">
          <h3>What's New?</h3>
          <ul>
            <li><strong>Classic Mode</strong>: Your current setup (unchanged)</li>
            <li><strong>Core Time Mode</strong>: Morning & evening Another Hours</li>
            <li><strong>Wake-Based Mode</strong>: Start your day when YOU wake up</li>
            <li><strong>Solar Mode</strong>: Sync with sunrise and sunset</li>
          </ul>
        </div>
        
        <div class="guide-section">
          <h3>Your Settings Are Safe</h3>
          <p>All your current settings have been preserved in "Classic Mode". 
             You can switch between modes anytime!</p>
        </div>
        
        <div class="guide-section">
          <h3>Try It Out!</h3>
          <ol>
            <li>Click on "Time Design Mode" in settings</li>
            <li>Select a mode that fits your lifestyle</li>
            <li>Customize the settings</li>
            <li>Experience time in a new way!</li>
          </ol>
        </div>
        
        <button class="btn-primary" onclick="this.parentElement.parentElement.remove()">
          Got it!
        </button>
      </div>
    `;
    
    document.body.appendChild(guide);
  }
  
  static trackEvent(eventName, data = {}) {
    // Analytics tracking
    console.log('Track event:', eventName, data);
  }
}
```

## 📊 Monitoring & Rollback

### Monitoring Dashboard

```javascript
// public/js/migration/monitoring.js

export class MigrationMonitor {
  static metrics = {
    migrations: {
      attempted: 0,
      successful: 0,
      failed: 0,
      rolledBack: 0
    },
    usage: {
      classicMode: 0,
      coreTimeMode: 0,
      wakeBasedMode: 0,
      solarMode: 0
    },
    errors: [],
    performance: {
      avgCalculationTime: 0,
      maxCalculationTime: 0
    }
  };
  
  static startMonitoring() {
    // Monitor migrations
    this.monitorMigrations();
    
    // Monitor mode usage
    this.monitorModeUsage();
    
    // Monitor performance
    this.monitorPerformance();
    
    // Send metrics periodically
    setInterval(() => this.sendMetrics(), 300000); // Every 5 minutes
  }
  
  static monitorMigrations() {
    // Hook into migration events
    window.addEventListener('migrationStarted', () => {
      this.metrics.migrations.attempted++;
    });
    
    window.addEventListener('migrationCompleted', () => {
      this.metrics.migrations.successful++;
    });
    
    window.addEventListener('migrationFailed', (event) => {
      this.metrics.migrations.failed++;
      this.metrics.errors.push({
        type: 'migration_failed',
        error: event.detail.error,
        timestamp: Date.now()
      });
    });
  }
  
  static monitorModeUsage() {
    // Track mode switches
    window.addEventListener('modeChanged', (event) => {
      const mode = event.detail.mode;
      this.metrics.usage[mode]++;
    });
  }
  
  static monitorPerformance() {
    // Wrap calculation functions
    const originalCalculate = window.timeDesignManager?.calculate;
    if (originalCalculate) {
      window.timeDesignManager.calculate = function(...args) {
        const start = performance.now();
        const result = originalCalculate.apply(this, args);
        const duration = performance.now() - start;
        
        MigrationMonitor.recordPerformance(duration);
        
        return result;
      };
    }
  }
  
  static recordPerformance(duration) {
    // Update running average
    const count = this.metrics.performance.count || 0;
    const avg = this.metrics.performance.avgCalculationTime;
    
    this.metrics.performance.avgCalculationTime = 
      (avg * count + duration) / (count + 1);
    this.metrics.performance.count = count + 1;
    
    // Update max
    if (duration > this.metrics.performance.maxCalculationTime) {
      this.metrics.performance.maxCalculationTime = duration;
    }
  }
  
  static async sendMetrics() {
    try {
      await fetch('/api/metrics/migration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          metrics: this.metrics
        })
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}
```

### Rollback Procedures

```javascript
// public/js/migration/rollback.js

export class MigrationRollback {
  static async executeRollback(reason) {
    console.warn('Executing rollback:', reason);
    
    try {
      // 1. Disable feature flags
      this.disableAllFeatureFlags();
      
      // 2. Restore old data format
      this.restoreOldFormat();
      
      // 3. Clear new data
      this.clearNewData();
      
      // 4. Notify users
      this.notifyUsersOfRollback(reason);
      
      // 5. Log rollback
      await this.logRollback(reason);
      
      return true;
    } catch (error) {
      console.error('Rollback failed:', error);
      return false;
    }
  }
  
  static disableAllFeatureFlags() {
    Object.values(FeatureFlags.FLAGS).forEach(flag => {
      FeatureFlags.disable(flag);
    });
  }
  
  static restoreOldFormat() {
    const backup = localStorage.getItem('anotherHourBackup_v1');
    if (backup) {
      const data = JSON.parse(backup);
      Object.entries(data.data).forEach(([key, value]) => {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      });
    }
  }
  
  static clearNewData() {
    const keysToRemove = [
      'timeDesignConfig',
      'timeDesignMode',
      'timeDesignMigrationVersion',
      'timeDesignMigrationDate'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
  
  static notifyUsersOfRollback(reason) {
    const notification = document.createElement('div');
    notification.className = 'rollback-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h3>⚠️ Feature Temporarily Disabled</h3>
        <p>We've temporarily disabled Time Design Modes to ensure 
           the best experience. Your settings have been restored.</p>
        <button onclick="this.parentElement.parentElement.remove()">OK</button>
      </div>
    `;
    
    document.body.appendChild(notification);
  }
  
  static async logRollback(reason) {
    try {
      await fetch('/api/rollback/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: Date.now(),
          reason: reason,
          version: TimeDesignMigration.MIGRATION_VERSION
        })
      });
    } catch (error) {
      console.error('Failed to log rollback:', error);
    }
  }
}
```

## 📅 Timeline

### Week 1-2: Preparation
- Set up feature flags
- Deploy monitoring
- Create backup system

### Week 3-4: Shadow Deployment
- Deploy new code (disabled)
- Run parallel calculations
- Monitor for issues

### Week 5-6: Beta Testing
- Enable for 1% of users
- Gather feedback
- Fix critical issues

### Week 7-8: Gradual Rollout
- 10% → 25% → 50% → 100%
- Monitor metrics closely
- Be ready to rollback

### Week 9-10: Cleanup
- Remove compatibility shims
- Deprecate old APIs
- Update all documentation

## ✅ Success Criteria

- Migration success rate > 99.9%
- No increase in error rates
- Performance within 5% of current
- User satisfaction maintained or improved
- All automated tests passing

## 🚨 Rollback Triggers

Automatic rollback if:
- Error rate increases by > 10%
- Performance degrades by > 20%
- Migration failure rate > 1%
- Critical bug discovered

## 📝 Communication Plan

### For Users
1. **Pre-migration**: Blog post about upcoming features
2. **During migration**: In-app banner and guide
3. **Post-migration**: Email about new capabilities

### For Developers
1. **Documentation**: Updated API docs
2. **Migration guide**: Step-by-step instructions
3. **Support channel**: Dedicated Slack channel

## 🔐 Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss | High | Automated backups, validation |
| Performance degradation | Medium | Caching, monitoring |
| User confusion | Medium | Clear UI, documentation |
| Integration breaks | High | Compatibility layer, testing |

---

*This migration plan is a living document and will be updated throughout the migration process.*