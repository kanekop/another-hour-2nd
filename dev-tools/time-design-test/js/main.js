// public/js/time-design-test-main.js

import { TimeDesignManager } from './time-design/TimeDesignManager.js';
import { ClassicMode } from './time-design/modes/ClassicMode.js';
import { CoreTimeMode } from './time-design/modes/CoreTimeMode.js';
import { SolarMode } from './time-design/modes/SolarMode.js';
import { WakeBasedMode } from './time-design/modes/WakeBasedMode.js';
import { $, $$ } from './utils/dom.js';
import { formatTime, formatDuration } from './utils/formatters.js';
import { Logger } from './core/logger.js';
import { ModeSelector } from './ui/ModeSelector.js';
import { TimeDisplay } from './ui/TimeDisplay.js';
import { ConfigPanel } from './ui/ConfigPanel.js';
import { Timeline } from './ui/Timeline.js';

// Global variables
let modeSelector;
let timeDisplay;

// --- App Class ---

class TimeDesignTestApp {
    constructor() {
        this.timeDesignManager = new TimeDesignManager();
        this.logger = null;
        this.updateInterval = null;
        this.modeSelector = null;
        this.timeDisplay = null;
        this.configPanel = null;
        this.timeline = null;
    }

    initComponents() {
        this.logger = new Logger($('#debugConsole'));
        this.modeSelector = new ModeSelector(
            $('.mode-selector'),
            this.handleModeSelect.bind(this)
        );
        this.timeDisplay = new TimeDisplay($('.time-display'));
        this.configPanel = new ConfigPanel(
            $('.config-panel'),
            this.timeDesignManager
        );
        this.timeline = new Timeline($('.timeline'));
    }

    async initialize() {
        // Initialize components that need the DOM first
        this.initComponents();

        this.logger.log('App: Initializing...');
        this.setupEventListeners();

        try {
            await this.timeDesignManager.initialize('classic');
            this.logger.log('App: TimeDesignManager initialized.');
            this.startUI();
        } catch (error) {
            this.logger.error('App: Initialization failed.', error);
            console.error(error);
        }
    }

    setupEventListeners() {
        this.timeDesignManager.subscribe((event) => {
            if (event.type === 'MODE_CHANGED') {
                const { modeId, config } = event;
                this.logger.log(`Event: Mode changed to '${modeId}'`, config);
                this.updateUIForNewMode(modeId);
            }
            if (event.type === 'CONFIG_UPDATED') {
                const { modeId, config } = event;
                this.logger.log(`Event: Config updated for '${modeId}'`, config);
                this.updateUIForNewMode(modeId);
            }
        });

        $('#exportConfigBtn')?.addEventListener('click', () => this.handleConfigExport());

        $$('[role="tab"]').forEach(button => {
            button.addEventListener('click', () => this.handleTabSwitch(button));
        });
    }

    startUI() {
        const availableModes = this.timeDesignManager.getAvailableModes();
        this.modeSelector.render(availableModes);

        const currentModeId = this.timeDesignManager.getCurrentModeId();
        if (currentModeId) {
            this.updateUIForNewMode(currentModeId);
        }

        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => this.updateLoop(), 1000);
            this.logger.log('App: UI started, update loop running.');
        }
    }

    updateUIForNewMode(modeId) {
        this.modeSelector.setActive(modeId);

        const mode = this.timeDesignManager.getModeInstance(modeId);
        if (!mode) {
            this.logger.error(`Could not get instance for mode '${modeId}'`);
            return;
        }

        const schema = mode.constructor.getConfigSchema();
        const config = mode.getConfig();
        const solarInfo = modeId === 'solar' ? mode.getSolarInfo() : null;

        console.log('updateUIForNewMode:', { modeId, mode, schema, config, solarInfo });

        this.timeline.render(modeId, mode.getTimelineSegments());
        this.configPanel.render(modeId, schema, config, solarInfo);
        this.updateLoop(); // Immediate update on change
    }

    updateLoop() {
        const realTime = new Date();
        const ahTime = this.timeDesignManager.calculateAnotherHourTime(realTime);

        console.log('updateLoop:', { ahTime, realTime });

        if (!ahTime) {
            this.logger.error('updateLoop: ahTime is null/undefined');
            return;
        }

        const timeData = {
            ah: ahTime,
            real: realTime,
            phase: this.timeDesignManager.getCurrentPhase(realTime),
            scaleFactor: this.timeDesignManager.getScaleFactor(realTime)
        };

        console.log('updateLoop: timeData', timeData);

        this.timeDisplay.update(timeData);
        this.timeline.update(realTime);

        // Specifically update solar info in config panel if it's the active mode
        const currentModeId = this.timeDesignManager.getCurrentModeId();
        if (currentModeId === 'solar') {
            const mode = this.timeDesignManager.getModeInstance('solar');
            const schema = mode.constructor.getConfigSchema();
            const config = mode.getConfig();
            const solarInfo = mode.getSolarInfo(realTime); // Pass current time
            this.configPanel.render('solar', schema, config, solarInfo);
        }
    }

    handleModeSelect(modeId) {
        this.logger.log(`UI: Mode selected - ${modeId}`);
        try {
            this.timeDesignManager.setMode(modeId);
        } catch (error) {
            this.logger.error('UI: Failed to set mode', error);
            console.error(error);
        }
    }

    handleConfigExport() {
        this.logger.log('UI: Export button clicked.');
        try {
            const currentModeId = this.timeDesignManager.getCurrentModeId();
            if (!currentModeId) throw new Error('No mode selected');

            const config = this.timeDesignManager.exportCurrentConfig();
            if (!config) throw new Error('Could not export config.');

            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `time-design-${currentModeId}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.logger.log('UI: Configuration exported successfully.');
        } catch (error) {
            this.logger.error('UI: Failed to export configuration.', error);
            console.error(error);
        }
    }

    handleTabSwitch(tabButton) {
        const tabName = tabButton.dataset.tab;
        this.logger.log('UI', `Tab switched to: ${tabName}`);

        $$('[role="tabpanel"]').forEach(panel => {
            panel.classList.toggle('hidden', panel.id !== `${tabName}-panel`);
        });

        $$('[role="tab"]').forEach(tab => {
            tab.setAttribute('aria-selected', 'false');
            tab.classList.remove('tab-list__item--active');
        });

        tabButton.setAttribute('aria-selected', 'true');
        tabButton.classList.add('tab-list__item--active');
    }
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    const app = new TimeDesignTestApp();
    app.initialize().catch(error => {
        // Since logger might not be initialized, log to console as a fallback.
        console.error('[CRITICAL] Failed to initialize the application:', error);
        const statusText = $('#statusText');
        if (statusText) {
            statusText.textContent = 'Error during initialization. Check console for details.';
        }
    });
});