// public/js/time-design-test-main.js

// Import from unified core package instead of local implementation
import { timeDesignManager } from '../../../packages/@another-hour/time-design-core/src/index.js';
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

        // Status elements
        this.statusIndicator = $('#statusIndicator');
        this.statusText = $('#statusText');

        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        this.fps = 0;
        this.updateCount = 0;
        this.lastStatsUpdate = Date.now();
    }

    async initialize() {
        this.logger.log('INIT', 'System initialization started.');
        this.updateStatus('initializing', 'Initializing...');

        try {
            // Check required libraries
            this.logger.log('INIT', 'Checking required libraries...');
            if (typeof moment === 'undefined') {
                throw new Error('moment.js is not loaded');
            }
            if (typeof noUiSlider === 'undefined') {
                throw new Error('noUiSlider is not loaded');
            }
            if (typeof SunCalc === 'undefined' && typeof suncalc === 'undefined') {
                this.logger.log('INIT', 'Warning: SunCalc is not loaded (required for Solar Mode)');
            }
            this.logger.log('INIT', 'All required libraries are loaded.');

            // Initialize TimeDesignManager
            this.logger.log('INIT', 'Initializing TimeDesignManager...');
            await timeDesignManager.initialize();
            this.logger.log('INIT', 'Time Design Manager initialized successfully.');

            // Setup event listeners
            this.logger.log('INIT', 'Setting up event listeners...');
            this.setupEventListeners();

            // Start UI
            this.logger.log('INIT', 'Starting UI...');
            this.startUI();

            this.logger.log('INIT', 'System initialization finished.');
            this.updateStatus('ready', 'Ready');
        } catch (error) {
            this.logger.error('INIT', 'Initialization failed.', {
                message: error.message,
                stack: error.stack
            });
            this.modeSelector.setError(error.message);
            this.updateStatus('error', `Initialization failed: ${error.message}`);
            throw error;
        }
    }

    updateStatus(state, text) {
        if (this.statusIndicator) {
            this.statusIndicator.className = `status-indicator status-indicator--${state}`;
        }
        if (this.statusText) {
            this.statusText.textContent = text;
        }
    }

    setupEventListeners() {
        timeDesignManager.subscribe(() => {
            this.logger.log('EVENT', 'Mode changed event received.');
            this.updateUI();
        });

        // Add event listener for the config panel container
        this.configPanel.element.addEventListener('change', (event) => {
            if (event.target.id === 'solar-city') {
                this.handleCityChange(event.target.value);
            }
        });

        // Export button
        const exportBtn = $('#exportConfigBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleConfigExport());
        }

        // Tab switching
        const tabButtons = $$('[role="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTabSwitch(e.target));
        });
    }

    startUI() {
        // Render available modes
        const modes = timeDesignManager.getAvailableModes();
        this.modeSelector.render(modes);

        // Set initial mode and render its UI
        const initialMode = timeDesignManager.getCurrentMode();
        if (initialMode) {
            this.handleModeSelect(initialMode.id, true);
        }

        // Start the clock
        if (this.updateInterval) clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => this.updateTime(), 100);

        // Start performance monitoring
        this.startPerformanceMonitoring();
    }

    startPerformanceMonitoring() {
        const updateStats = () => {
            // Calculate FPS
            const now = performance.now();
            const delta = now - this.lastFpsUpdate;
            if (delta >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / delta);
                this.frameCount = 0;
                this.lastFpsUpdate = now;

                // Update debug stats display
                this.updateDebugStats();
            }
            this.frameCount++;

            requestAnimationFrame(updateStats);
        };
        requestAnimationFrame(updateStats);
    }

    updateDebugStats() {
        const statsEl = $('.debug-panel__stats');
        if (!statsEl) return;

        const now = Date.now();
        const timeSinceLastUpdate = (now - this.lastStatsUpdate) / 1000;
        const updatesPerSecond = timeSinceLastUpdate > 0 ? (this.updateCount / timeSinceLastUpdate).toFixed(1) : 0;

        statsEl.innerHTML = `
            <div class="debug-stat">
                <span class="debug-stat__label">FPS:</span>
                <span class="debug-stat__value">${this.fps}</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat__label">Updates/sec:</span>
                <span class="debug-stat__value">${updatesPerSecond}</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat__label">Mode:</span>
                <span class="debug-stat__value">${timeDesignManager.getCurrentMode()?.name || 'None'}</span>
            </div>
            <div class="debug-stat">
                <span class="debug-stat__label">Elements:</span>
                <span class="debug-stat__value">${document.querySelectorAll('*').length}</span>
            </div>
        `;

        this.updateCount = 0;
        this.lastStatsUpdate = now;
    }

    updateUI() {
        this.logger.log('UI', 'Updating UI for mode change.');
        const currentMode = timeDesignManager.getCurrentMode();
        if (!currentMode) {
            this.logger.warn('UI', 'updateUI called with no current mode.');
            return;
        }

        // Get the rich controller object from the manager's registry
        const modeController = timeDesignManager.registry.get(currentMode.id);
        if (!modeController) {
            this.logger.error('UI', `Could not find controller for mode ${currentMode.id}.`);
            return;
        }

        // Prepare a rich data object for the views
        const viewData = {
            id: currentMode.id,
            name: currentMode.name,
            config: currentMode.config,
            cities: modeController.cities,
            schema: modeController.configSchema,
            // getSegments and getConfigUI are methods on the mode controller instance
            segments: modeController.getSegments ? modeController.getSegments(currentMode.config) : [],
            uiData: modeController.getConfigUI ? modeController.getConfigUI(currentMode.config) : {},
        };

        // Pass the rich data to the components for a full re-render
        this.timeline.render(viewData.segments);
        this.configPanel.render(viewData);

        // Also update the clock immediately to prevent lag
        this.updateTime();
    }

    updateTime() {
        try {
            const now = new Date();
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const timeData = timeDesignManager.calculate(now, timezone);
            const currentMode = timeDesignManager.getCurrentMode();
            const location = (currentMode?.id === 'solar') ? currentMode.config.location : null;

            this.timeDisplay.update({ timeData, realDate: now, location });

            // Calculate real time progress (0-1) for the timeline marker
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const seconds = now.getSeconds();
            const totalMinutes = hours * 60 + minutes + seconds / 60;
            const dayProgress = totalMinutes / (24 * 60);

            // Update the marker in the fast loop
            this.timeline.updateMarker(dayProgress);

            // Update last update time
            const lastUpdateEl = $('#lastUpdate');
            if (lastUpdateEl) {
                lastUpdateEl.textContent = now.toLocaleTimeString();
            }

            // Update memory usage if available
            const memoryEl = $('#memoryUsage');
            if (memoryEl && performance.memory) {
                const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(1);
                const totalMB = (performance.memory.totalJSHeapSize / 1048576).toFixed(1);
                memoryEl.textContent = `${usedMB}MB / ${totalMB}MB`;
            } else if (memoryEl) {
                memoryEl.textContent = 'N/A';
            }

            this.updateCount++;
        } catch (error) {
            this.logger.log('UPDATE', 'Display update error.', { message: error.message });
        }
    }

    // --- Event Handlers ---

    async handleModeSelect(modeId, isInitialLoad = false) {
        this.logger.log('UI', `Mode selection triggered for: ${modeId}`);
        this.modeSelector.setActive(modeId);

        if (isInitialLoad) {
            // On initial load, the mode is already set, so just render the UI.
            this.updateUI();
        } else {
            // On user selection, change the mode. The subscription will trigger updateUI.
            try {
                await timeDesignManager.setMode(modeId);
            } catch (error) {
                this.logger.error('UI', `Error setting mode: ${modeId}`, { message: error.message });
            }
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

    async handleCityChange(cityKey) {
        this.logger.log('CONFIG', `City changed to: ${cityKey}`);
        try {
            // 現在のモードコントローラーを取得
            const modeController = timeDesignManager.registry.get('solar');
            if (!modeController) {
                throw new Error('Solar mode controller not found');
            }

            // 都市データを取得
            const cityData = modeController.getCityData(cityKey);
            if (!cityData) {
                throw new Error(`City data not found for: ${cityKey}`);
            }

            // 現在の設定を取得
            const currentMode = timeDesignManager.getCurrentMode();
            const currentConfig = currentMode?.id === 'solar' ? currentMode.config : {};

            // 新しい設定を作成（既存の設定を保持しつつ、locationを更新）
            const newConfig = {
                ...currentConfig,
                location: {
                    key: cityKey,
                    ...cityData,
                    timezone: cityData.tz  // timezoneプロパティも確実に設定
                }
            };

            // Set the mode with the updated configuration for the new city
            await timeDesignManager.setMode('solar', newConfig);
            this.logger.log('CONFIG', 'Successfully updated config for new city.');
        } catch (error) {
            this.logger.error('CONFIG', `Failed to update config for city: ${cityKey}`, { message: error.message });
        }
    }

    handleConfigExport() {
        this.logger.log('CONFIG', 'Export button clicked.');
        try {
            const currentMode = timeDesignManager.getCurrentMode();
            if (!currentMode) {
                throw new Error('No mode selected');
            }

            const exportData = {
                mode: currentMode.id,
                name: currentMode.name,
                config: currentMode.config,
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `time-design-${currentMode.id}-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.logger.log('CONFIG', 'Configuration exported successfully.');
        } catch (error) {
            this.logger.error('CONFIG', 'Failed to export configuration.', { message: error.message });
        }
    }

    handleTabSwitch(tabButton) {
        const tabName = tabButton.dataset.tab;
        this.logger.log('UI', `Tab switched to: ${tabName}`);

        // Update tab states
        const allTabs = $$('[role="tab"]');
        allTabs.forEach(tab => {
            tab.setAttribute('aria-selected', tab === tabButton ? 'true' : 'false');
            tab.classList.toggle('tab-list__item--active', tab === tabButton);
        });

        // For now, just log the tab switch
        // In a full implementation, this would show/hide different content panels
        this.logger.log('UI', `Tab content for '${tabName}' would be displayed here`);
    }
}

// --- Main Execution ---
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusText) {
        statusText.textContent = `Error: ${event.error.message}`;
    }
    if (statusIndicator) {
        statusIndicator.className = 'status-indicator status-indicator--error';
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusText) {
        statusText.textContent = `Error: ${event.reason}`;
    }
    if (statusIndicator) {
        statusIndicator.className = 'status-indicator status-indicator--error';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');
    const app = new TimeDesignTestApp();
    window.app = app; // デバッグ用にグローバルに公開
    app.initialize().catch(error => {
        console.error('Failed to initialize app:', error);
        const statusText = document.getElementById('statusText');
        if (statusText) {
            statusText.textContent = `Initialization failed: ${error.message}`;
        }
    });
});