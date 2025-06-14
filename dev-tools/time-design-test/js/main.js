// public/js/time-design-test-main.js

import { timeDesignManager } from '/js/time-design/TimeDesignManager.js';
import { $, $$ } from './utils/dom.js';
import { formatTime, formatDuration } from './utils/formatters.js';
import { Logger } from './core/logger.js';
import { ModeSelector } from './ui/ModeSelector.js';
import { TimeDisplay } from './ui/TimeDisplay.js';
import { ConfigPanel } from './ui/ConfigPanel.js';
import { Timeline } from './ui/Timeline.js';

// Global variables
let updateInterval;
const logger = new Logger($('#debugConsole'));
let modeSelector;
let timeDisplay;

// --- App Class ---

class TimeDesignTestApp {
    constructor() {
        this.logger = new Logger($('#debugConsole'));
        this.modeSelector = new ModeSelector($('.mode-selector'), this.handleModeSelect.bind(this));
        this.timeDisplay = new TimeDisplay();
        this.timeline = new Timeline($('#timelineContainer'));
        this.configPanel = new ConfigPanel($('.config-panel'), {
            onSave: this.handleConfigSave.bind(this),
            onReset: this.handleConfigReset.bind(this),
        });

        this.updateInterval = null;
    }

    async initialize() {
        this.logger.log('INIT', 'System initialization started.');
        try {
            if (typeof moment === 'undefined' || typeof noUiSlider === 'undefined') {
                throw new Error('Required libraries (Moment.js, noUiSlider) are not loaded.');
            }

            await timeDesignManager.initialize();
            this.logger.log('INIT', 'Time Design Manager initialized successfully.');

            this.setupEventListeners();
            this.startUI();

            this.logger.log('INIT', 'System initialization finished.');
        } catch (error) {
            this.logger.error('INIT', 'Initialization failed.', { message: error.message });
            this.modeSelector.setError(error.message);
        }
    }

    setupEventListeners() {
        timeDesignManager.subscribe(() => {
            this.logger.log('EVENT', 'Mode changed event received.');
            this.updateUI();
        });
    }

    startUI() {
        // Render available modes
        const modes = timeDesignManager.getAvailableModes();
        this.modeSelector.render(modes);

        // Set initial mode
        const initialMode = timeDesignManager.getCurrentMode();
        if (initialMode) {
            this.handleModeSelect(initialMode.id, true);
        }

        // Start the clock
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => this.updateTime(), 100);
    }

    updateUI() {
        this.updateTime();
        const currentMode = timeDesignManager.getCurrentMode();
        if (currentMode) {
            // Re-render config panel for the new mode
            this.configPanel.render(currentMode);
        }
    }

    updateTime() {
        try {
            const now = new Date();
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const timeData = timeDesignManager.calculate(now, timezone);
            const currentMode = timeDesignManager.getCurrentMode();
            const location = (currentMode?.id === 'solar') ? currentMode.config.location : null;

            this.timeDisplay.update({ timeData, realDate: now, location });
            this.timeline.update(timeData);
        } catch (error) {
            this.logger.log('UPDATE', 'Display update error.', { message: error.message });
        }
    }

    // --- Event Handlers ---

    async handleModeSelect(modeId, isInitialLoad = false) {
        this.logger.log('UI', `Mode selection triggered for: ${modeId}`);
        this.modeSelector.setActive(modeId);

        if (!isInitialLoad) {
            try {
                await timeDesignManager.setMode(modeId);
            } catch (error) {
                this.logger.error('UI', `Error setting mode: ${modeId}`, { message: error.message });
            }
        } else {
            // On initial load, the mode is already set, just render the config
            this.configPanel.render(timeDesignManager.getCurrentMode());
        }
    }

    async handleConfigSave(newConfig) {
        this.logger.log('CONFIG', 'Save button clicked.', newConfig);
        try {
            const currentModeId = timeDesignManager.getCurrentMode().id;
            // The core manager handles merging and validation
            await timeDesignManager.setMode(currentModeId, newConfig);
            this.logger.log('CONFIG', 'Configuration saved successfully.');
            // Optionally show a success notification
        } catch (error) {
            this.logger.error('CONFIG', 'Failed to save configuration.', { message: error.message });
        }
    }

    async handleConfigReset() {
        this.logger.log('CONFIG', 'Reset button clicked.');
        try {
            const currentModeId = timeDesignManager.getCurrentMode().id;
            // Re-setting the mode with no config will apply defaults
            await timeDesignManager.setMode(currentModeId);
            this.logger.log('CONFIG', 'Configuration reset to defaults.');
        } catch (error) {
            this.logger.error('CONFIG', 'Failed to reset configuration.', { message: error.message });
        }
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    const app = new TimeDesignTestApp();
    app.initialize();
});