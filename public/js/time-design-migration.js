
// public/js/time-design-migration.js

/**
 * Migration utilities for Time Design Modes
 * Handles conversion from legacy localStorage to new configuration system
 */

/**
 * Check if migration is needed
 */
export function needsMigration() {
  const hasLegacy = localStorage.getItem('personalizedAhDurationMinutes') !== null;
  const hasNew = localStorage.getItem('timeDesignConfig') !== null;
  
  return hasLegacy && !hasNew;
}

/**
 * Migrate legacy data to Time Design system
 */
export async function migrateLegacyData() {
  if (!needsMigration()) {
    console.log('No migration needed');
    return { success: true, migrated: false };
  }

  try {
    console.log('Starting migration from legacy format...');
    
    // Import Time Design Manager
    const { timeDesignManager } = await import('./time-design/modes/TimeDesignManager.js');
    
    // Get legacy values
    const legacyDuration = localStorage.getItem('personalizedAhDurationMinutes');
    const legacyTimezone = localStorage.getItem('personalizedAhSelectedTimezone');
    const legacySettingsVisible = localStorage.getItem('personalizedAhSettingsVisible');
    const legacyCurrentView = localStorage.getItem('personalizedAhCurrentView');

    // Create configuration
    const duration = parseInt(legacyDuration, 10);
    const config = {
      designed24Duration: !isNaN(duration) ? duration : 1380,
      startHour: 0,
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        migratedFrom: 'legacy',
        legacyValues: {
          duration: legacyDuration,
          timezone: legacyTimezone,
          settingsVisible: legacySettingsVisible,
          currentView: legacyCurrentView
        }
      }
    };

    // Initialize and set classic mode
    await timeDesignManager.initialize();
    await timeDesignManager.setMode('classic', config);

    console.log('Migration completed successfully');
    
    // Create backup of legacy data
    const backup = {
      personalizedAhDurationMinutes: legacyDuration,
      personalizedAhSelectedTimezone: legacyTimezone,
      personalizedAhSettingsVisible: legacySettingsVisible,
      personalizedAhCurrentView: legacyCurrentView,
      migrationDate: new Date().toISOString()
    };
    
    localStorage.setItem('timeDesignLegacyBackup', JSON.stringify(backup));

    return { 
      success: true, 
      migrated: true, 
      config: config,
      backup: backup
    };

  } catch (error) {
    console.error('Migration failed:', error);
    return { 
      success: false, 
      error: error.message,
      migrated: false
    };
  }
}

/**
 * Restore from backup if needed
 */
export function restoreFromBackup() {
  try {
    const backup = localStorage.getItem('timeDesignLegacyBackup');
    if (!backup) {
      console.log('No backup found');
      return { success: false, reason: 'No backup found' };
    }

    const data = JSON.parse(backup);
    
    // Restore legacy keys
    Object.keys(data).forEach(key => {
      if (key !== 'migrationDate') {
        localStorage.setItem(key, data[key]);
      }
    });

    // Remove new configuration
    localStorage.removeItem('timeDesignConfig');

    console.log('Restored from backup');
    return { success: true, restored: data };

  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate migration
 */
export async function validateMigration() {
  try {
    const { timeDesignManager } = await import('./time-design/modes/TimeDesignManager.js');
    
    if (!timeDesignManager.isInitialized()) {
      await timeDesignManager.initialize();
    }

    const currentMode = timeDesignManager.getCurrentMode();
    
    if (!currentMode || currentMode.id !== 'classic') {
      return { valid: false, reason: 'Not in classic mode' };
    }

    // Test calculation
    const now = new Date();
    const result = timeDesignManager.calculate(now, 'UTC');
    
    if (!result || typeof result.hours !== 'number') {
      return { valid: false, reason: 'Invalid calculation result' };
    }

    return { 
      valid: true, 
      mode: currentMode,
      testResult: result
    };

  } catch (error) {
    return { 
      valid: false, 
      error: error.message 
    };
  }
}

/**
 * Auto-migrate on page load
 */
export async function autoMigrate() {
  if (needsMigration()) {
    console.log('Auto-migration triggered');
    const result = await migrateLegacyData();
    
    if (result.success) {
      console.log('✅ Migration completed automatically');
      
      // Validate the migration
      const validation = await validateMigration();
      if (!validation.valid) {
        console.warn('⚠️ Migration validation failed:', validation);
      }
    } else {
      console.error('❌ Auto-migration failed:', result.error);
    }
    
    return result;
  }
  
  return { success: true, migrated: false };
}
