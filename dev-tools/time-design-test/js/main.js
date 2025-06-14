// public/js/time-design-test-main.js

import { timeDesignManager } from '/vendor/@another-hour/core/index.js';

// Global variables
let updateInterval;

// Debug logger
function debug(message, data = null) {
    const debugPanel = document.getElementById('debugOutput');
    if (!debugPanel) return;
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8);
    let output = `[${timestamp}] ${message}`;
    if (data) {
        output += '\n' + JSON.stringify(data, (key, value) =>
            typeof value === 'object' && value !== null && value.constructor.name !== 'Object' ? `[${value.constructor.name}]` : value, 2);
    }
    debugPanel.textContent = output + '\n\n' + debugPanel.textContent.substring(0, 2000);
}

// Initialize the system
async function initialize() {
    try {
        if (typeof moment === 'undefined') {
            throw new Error('Moment.js is not loaded');
        }

        debug('Initializing Time Design Manager...');
        await timeDesignManager.initialize();
        debug('Time Design Manager initialized successfully');

        loadModes();
        startTimeUpdate();

        timeDesignManager.subscribe((event) => {
            debug('Mode changed event:', event);
            updateDisplay();
            loadModeConfig();
        });

        // Setup event listeners for config buttons
        document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
        document.getElementById('resetConfigBtn').addEventListener('click', resetConfig);

        // Initial load
        const initialMode = timeDesignManager.getCurrentMode();
        if (initialMode) {
            selectMode(initialMode.id, true);
        }

    } catch (error) {
        debug('Initialization error:', error.message);
        console.error('Failed to initialize:', error);
        document.getElementById('modeList').innerHTML = `<div style="color: red; padding: 20px;"><h3>Initialization Error</h3><p>${error.message}</p><button onclick="location.reload()">Retry</button></div>`;
    }
}

function loadModes() {
    const modeList = document.getElementById('modeList');
    const modes = timeDesignManager.getAvailableModes();
    debug('Available modes:', modes.map(m => m.id));

    modeList.innerHTML = modes.map(mode => `
        <div class="mode-option" data-mode="${mode.id}">
            <h3>${mode.name}</h3>
            <p>${mode.description}</p>
        </div>
    `).join('');

    modeList.querySelectorAll('.mode-option').forEach(option => {
        option.addEventListener('click', () => selectMode(option.dataset.mode));
    });
}

async function selectMode(modeId, isInitialLoad = false) {
    try {
        debug(`Selecting mode: ${modeId}`);
        document.querySelectorAll('.mode-option').forEach(el => {
            el.classList.toggle('active', el.dataset.mode === modeId);
        });

        if (isInitialLoad) {
            // On initial load, the mode is already set by the manager.
            // We just need to load the config UI.
            loadModeConfig();
        } else {
            // For user-driven changes, set the mode in the manager.
            // The subscription will handle UI updates.
            await timeDesignManager.setMode(modeId);
        }
    } catch (error) {
        debug(`Error setting mode: ${error.message}`);
        console.error('Failed to set mode:', error);
    }
}

function loadModeConfig() {
    const configContent = document.getElementById('configContent');
    const current = timeDesignManager.getCurrentMode();

    if (!current) {
        configContent.innerHTML = '<p>No mode selected</p>';
        return;
    }
    debug('Loading config for mode:', current.id);

    // Append mode-specific config UI
    let configHtml = '';
    switch (current.id) {
        case 'classic':
            configHtml += generateClassicConfig(current.config);
            break;
        case 'core-time':
            configHtml += generateCoreTimeConfig(current.config);
            break;
        case 'solar':
            configHtml += generateSolarConfig(current.config);
            break;
        case 'wake-based':
            configHtml += generateWakeBasedConfig(current.config);
            break;
        default:
            configHtml += '<p>Configuration not available for this mode</p>';
    }

    configContent.innerHTML = configHtml;

    if (current.id === 'core-time') {
        initializeCoreTimeSlider(current.config);
    } else if (current.id === 'solar') {
        initializeSolarMode(current.config);
    }
}

function generateClassicConfig(config) {
    const hours = Math.floor(config.designed24Duration / 60);
    const minutes = config.designed24Duration % 60;
    return `<div class="config-group"><label>Designed 24 Duration</label><input type="range" id="designed24Duration" min="1" max="1440" value="${config.designed24Duration}" oninput="updateRangeValue(this)"><div class="range-value">${hours}h ${minutes}m</div></div>`;
}

function generateCoreTimeConfig(config) {
    return `
        <div class="config-group">
            <label>Core Time Range</label>
            <div id="coreTimeSlider" style="margin: 30px 10px 40px;"></div>
            <div id="coreTimeValue" style="text-align: center; font-weight: 600;"></div>
        </div>
    `;
}

function generateSolarConfig(config) {
    const solarMode = timeDesignManager.registry.get('solar');
    const currentCityKey = config.location?.key || 'tokyo';

    const cityOptions = Object.entries(solarMode.cities).map(([key, city]) =>
        `<option value="${key}" ${currentCityKey === key ? 'selected' : ''}>${city.name}</option>`
    ).join('');

    const uiData = solarMode.getConfigUI(config);
    const solarInfo = uiData ? uiData.solarInfo : null;

    const formatTime = (date, tz) => {
        if (!date || !tz) return '--:--';
        return new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date(date));
    };

    const formatDuration = (minutes) => {
        if (minutes === null || isNaN(minutes)) return '--h --m';
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    let solarDetailsHtml = '';
    if (solarInfo) {
        const cityTz = config.location.timezone;
        solarDetailsHtml = `
            <p><strong>Sun Rise:</strong> <span id="sunrise-time">${formatTime(solarInfo.sunrise, cityTz)}</span></p>
            <p><strong>Solar Noon:</strong> <span id="solarnoon-time">${formatTime(solarInfo.solarNoon, cityTz)}</span></p>
            <p><strong>Sun Set:</strong> <span id="sunset-time">${formatTime(solarInfo.sunset, cityTz)}</span></p>
            <p><strong>Daytime:</strong> <span id="daylight-duration">${formatDuration(solarInfo.daylightMinutes)}</span></p>
        `;
    } else {
        solarDetailsHtml = '<p>Could not retrieve solar data. Please select a city.</p>';
    }

    return `
        <div class="config-group">
            <label for="solar-city">City</label>
            <select id="solar-city">${cityOptions}</select>
        </div>
        <div class="solar-info" id="solar-info-display" style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
            ${solarDetailsHtml}
        </div>
        <div class="config-group">
            <label for="solar-day-hours">Day Hours</label>
            <div id="solar-day-hours-slider" style="margin: 20px 0;"></div>
            <div class="range-value" id="solar-day-hours-value">${config.designedDayHours.toFixed(1)} hours</div>
        </div>
    `;
}

function generateWakeBasedConfig(config) {
    let html = '';
    const schema = timeDesignManager.registry.get('wake-based').configSchema;

    for (const key in schema) {
        const item = schema[key];
        const value = config[key];
        switch (item.type) {
            case 'time':
                html += `<div class="config-group"><label>${item.label}</label><input type="time" id="${key}" value="${value}"></div>`;
                break;
            case 'number':
                html += generateRangeConfig({ id: key, ...item }, value);
                break;
        }
    }
    return html;
}

function generateRangeConfig(item, value) {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    let displayValue = `${value}`;
    if (item.id === 'designed24Duration') {
        displayValue = `${hours}h ${minutes}m`;
    } else if (item.id === 'dayHours') {
        displayValue = `${value} hours`;
    } else if (item.id === 'anotherHourDuration') {
        displayValue = `${value} min`;
    } else {
        displayValue = `${value} min`;
    }

    return `<div class="config-group"><label>${item.label}</label><input type="range" id="${item.id}" min="${item.min}" max="${item.max}" value="${value}" oninput="updateRangeValue(this)"><div class="range-value">${displayValue}</div></div>`;
}

function generateSelectConfig(item, value) {
    const options = item.options.map(opt =>
        `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.text}</option>`
    ).join('');
    return `<div class="config-group"><label>${item.label}</label><select id="${item.id}">${options}</select></div>`;
}

function updateDisplay() {
    try {
        const now = new Date();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const result = timeDesignManager.calculate(now, timezone);

        document.getElementById('timeDisplay').textContent = formatTime(result.hours, result.minutes, result.seconds);
        document.getElementById('periodLabel').textContent = result.periodName;
        document.getElementById('scaleFactor').textContent = result.scaleFactor.toFixed(2) + 'x';

        // --- REAL TIME display logic ---
        const currentMode = timeDesignManager.getCurrentMode();
        let realTimeString = now.toTimeString().substring(0, 8); // Default to browser time

        if (currentMode && currentMode.id === 'solar') {
            const location = currentMode.config.location;
            if (location && location.timezone) {
                try {
                    realTimeString = new Intl.DateTimeFormat('en-GB', {
                        timeZone: location.timezone,
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        hour12: false
                    }).format(now);
                } catch (e) {
                    console.error(`Could not format real time for timezone ${location.timezone}`, e);
                }
            }
        }
        document.getElementById('realTime').textContent = realTimeString;

        // --- PROGRESS display logic ---
        const progressContainer = document.getElementById('progressDisplay');
        if (result.segmentInfo && result.segmentInfo.progress !== undefined) {
            const progress = result.segmentInfo.progress * 100;
            const remaining = result.segmentInfo.remaining;
            progressContainer.innerHTML = `
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progress.toFixed(2)}%;"></div>
                </div>
                <div class="progress-label">${formatDuration(remaining)} remaining in phase</div>
            `;
        } else {
            progressContainer.innerHTML = '-';
        }

    } catch (error) {
        // debug('Update error:', error.message);
    }
}

function startTimeUpdate() {
    updateDisplay();
    updateInterval = setInterval(updateDisplay, 100);
}

// Global helpers that are called from HTML
window.updateRangeValue = function (input) {
    const valueDiv = input.nextElementSibling;
    if (input.id === 'designed24Duration') {
        const hours = Math.floor(input.value / 60);
        const minutes = input.value % 60;
        valueDiv.textContent = `${hours}h ${minutes}m`;
    } else if (input.id === 'dayHours') {
        valueDiv.textContent = `${input.value} hours`;
    } else if (input.id === 'anotherHourDuration') {
        valueDiv.textContent = `${input.value} min`;
    } else {
        valueDiv.textContent = `${input.value} min`;
    }
};

async function saveConfig() {
    try {
        const current = timeDesignManager.getCurrentMode();
        if (!current) return;

        // Get the actual mode object from the registry
        const modeInstance = timeDesignManager.registry.get(current.id);
        if (!modeInstance) {
            throw new Error(`Mode instance for ${current.id} not found.`);
        }

        // Each mode now knows how to collect its own config from the UI.
        // The complex if/else logic is no longer needed here.
        const newConfig = modeInstance.collectConfigFromUI();

        await timeDesignManager.setMode(current.id, newConfig);
        showStatus('Configuration saved successfully!', 'success');
        debug('Configuration saved:', newConfig);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        debug('Save error:', error.message);
    }
}

async function resetConfig() {
    try {
        const current = timeDesignManager.getCurrentMode();
        if (!current) return;
        await timeDesignManager.setMode(current.id);
        loadModeConfig();
        showStatus('Configuration reset to default', 'success');
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    }
}

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
}

function formatTime(h, m, s) {
    return [h, m, s].map(v => String(Math.floor(v)).padStart(2, '0')).join(':');
}

function formatDuration(m) {
    return m > 60 ? `${Math.floor(m / 60)}h ${Math.floor(m % 60)}m` : `${Math.floor(m)}m`;
}

function initializeCoreTimeSlider(config) {
    const slider = document.getElementById('coreTimeSlider');
    const valueDisplay = document.getElementById('coreTimeValue');

    const format = (value) => {
        const h = Math.floor(value / 60);
        const m = value % 60;
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    noUiSlider.create(slider, {
        start: [config.coreTimeStart, config.coreTimeEnd],
        connect: true,
        range: {
            'min': 0,
            'max': 1440
        },
        step: 15,
        tooltips: {
            to: format
        }
    });

    slider.noUiSlider.on('update', (values) => {
        const [start, end] = values.map(v => parseInt(v));
        const duration = end - start;
        valueDisplay.textContent = `${format(start)} - ${format(end)} (${formatDuration(duration)})`;
    });
}

function initializeSolarMode(config) {
    // City Selector
    const citySelector = document.getElementById('solar-city');
    citySelector.addEventListener('change', async (e) => {
        const newCityKey = e.target.value;
        debug(`City changed to: ${newCityKey}`);

        const current = timeDesignManager.getCurrentMode();
        const solarMode = timeDesignManager.registry.get('solar');
        const newCityData = solarMode.cities[newCityKey];

        const newConfig = {
            ...current.config,
            location: {
                key: newCityKey,
                lat: newCityData.lat,
                lng: newCityData.lng,
                name: newCityData.name,
                timezone: newCityData.tz
            }
        };

        await timeDesignManager.setMode('solar', newConfig);
    });

    // Day Hours Slider
    const dayHoursSlider = document.getElementById('solar-day-hours-slider');
    const dayHoursValue = document.getElementById('solar-day-hours-value');

    // Assuming a slider library like noUiSlider is used
    if (typeof noUiSlider !== 'undefined') {
        if (dayHoursSlider.noUiSlider) {
            dayHoursSlider.noUiSlider.destroy();
        }

        noUiSlider.create(dayHoursSlider, {
            start: [config.designedDayHours],
            connect: [true, false],
            range: { 'min': 1, 'max': 23 },
            step: 0.5,
            tooltips: {
                to: value => `${Number(value).toFixed(1)}h`
            }
        });

        dayHoursSlider.noUiSlider.on('update', (values) => {
            dayHoursValue.textContent = `${Number(values[0]).toFixed(1)} hours`;
        });

        dayHoursSlider.noUiSlider.on('set', async (values) => {
            const newDayHours = Number(values[0]);
            const current = timeDesignManager.getCurrentMode();
            const newConfig = {
                ...current.config,
                designedDayHours: newDayHours,
                autoAdjust: false // Manual change disables auto-adjust
            };
            await timeDesignManager.setMode('solar', newConfig);
        });
    }
}

function updateSolarInfo(cityKey) {
    const solarMode = timeDesignManager.registry.get('solar');
    if (!solarMode) {
        console.error("SolarMode not found in registry.");
        return;
    }

    const cityData = solarMode.getCityData(cityKey);
    if (!cityData) {
        console.error(`No data for city: ${cityKey}`);
        return;
    }

    const sunTimes = solarMode.getSunTimes(cityKey);
    if (sunTimes) {
        const format = (date) => new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: cityData.tz,
            hour12: true,
        }).format(date);

        const sunriseTimeEl = document.getElementById('sunrise-time');
        const sunsetTimeEl = document.getElementById('sunset-time');

        sunriseTimeEl.textContent = format(sunTimes.sunrise);
        sunsetTimeEl.textContent = format(sunTimes.sunset);

        const durationMs = sunTimes.sunset - sunTimes.sunrise;
        const durationHours = Math.floor(durationMs / 3600000);
        const durationMins = Math.floor((durationMs % 3600000) / 60000);
        document.getElementById('daylight-duration').textContent = `${durationHours}h ${durationMins}m`;

        const solarDayHoursSlider = document.getElementById('solar-day-hours-slider');
        if (solarDayHoursSlider) {
            // Set the slider to the actual daylight hours as the default
            solarDayHoursSlider.noUiSlider.set(sunTimes.daylightHours);
        }
    }
}

// Main Execution
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}