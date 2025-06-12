import { timeDesignManager } from './time-design/TimeDesignManager.js';

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

        if (!isInitialLoad) {
            await timeDesignManager.setMode(modeId);
        }

        debug(`Mode set successfully: ${modeId}`);
        loadModeConfig();

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

    // Start with buttons and status message container
    let configHtml = `
        <div class="button-group">
            <button class="btn-primary" id="saveConfigBtn">Save Configuration</button>
            <button class="btn-secondary" id="resetConfigBtn">Reset to Default</button>
        </div>
        <div class="status-message" id="statusMessage" style="display: none;"></div>
        <hr>
    `;

    // Append mode-specific config UI
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
    }

    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('resetConfigBtn').addEventListener('click', resetConfig);
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
    let html = '';
    const schema = timeDesignManager.registry.get('solar').configSchema;

    for (const key in schema) {
        const item = schema[key];
        const value = config[key];
        switch (item.type) {
            case 'number':
                html += generateRangeConfig({ id: key, ...item }, value);
                break;
            case 'select':
                html += generateSelectConfig({ id: key, ...item }, value);
                break;
        }
    }
    return html;
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
        document.getElementById('realTime').textContent = now.toTimeString().substring(0, 8);
        document.getElementById('progress').textContent = Math.round(result.segmentInfo.progress) + '%';
        document.getElementById('remaining').textContent = formatDuration(result.segmentInfo.remaining);
        document.getElementById('phase').textContent = result.segmentInfo.type === 'designed' ? 'Designed' : 'Another Hour';
        document.getElementById('phaseInfo').textContent = result.segmentInfo.label;

        // --- New Core Time Duration Display Logic ---
        const currentMode = timeDesignManager.getCurrentMode();
        const coreTimeInfoCard = document.getElementById('coreTimeInfoCard');
        if (currentMode && currentMode.id === 'core-time') {
            const config = currentMode.config;
            const coreTimeMinutes = config.coreTimeEnd - config.coreTimeStart;
            document.getElementById('coreTimeDuration').textContent = formatDuration(coreTimeMinutes);
            coreTimeInfoCard.style.display = 'block';
        } else if (coreTimeInfoCard) {
            coreTimeInfoCard.style.display = 'none';
        }
        // --- End of New Logic ---

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
    } else {
        valueDiv.textContent = `${input.value} min`;
    }
};

async function saveConfig() {
    try {
        const current = timeDesignManager.getCurrentMode();
        if (!current) return;
        let newConfig = { ...current.config };

        // Special handling for Core Time slider
        if (current.id === 'core-time') {
            const slider = document.getElementById('coreTimeSlider').noUiSlider;
            const values = slider.get();
            newConfig.coreTimeStart = parseInt(values[0]);
            newConfig.coreTimeEnd = parseInt(values[1]);
        } else {
            const schema = timeDesignManager.registry.get(current.id).configSchema;
            for (const key in schema) {
                const el = document.getElementById(key);
                if (el) {
                    switch (schema[key].type) {
                        case 'number':
                            newConfig[key] = parseInt(el.value);
                            break;
                        case 'select':
                        case 'time':
                            newConfig[key] = el.value;
                            break;
                    }
                }
            }
        }

        if (current.id === 'solar') {
            newConfig.city = document.getElementById('solar-city').value;
            newConfig.dayHours = parseFloat(document.getElementById('solar-day-hours').noUiSlider.get());
        }

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

function formatTime(h, m, s) { return [h, m, s].map(v => String(Math.floor(v)).padStart(2, '0')).join(':'); }
function formatDuration(m) { return m > 60 ? `${Math.floor(m / 60)}h ${Math.floor(m % 60)}m` : `${Math.floor(m)}m`; }

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

// Solar Mode Controls
const solarCitySelect = document.getElementById('solar-city');
const solarDayHoursSlider = document.getElementById('solar-day-hours');
const solarDayHoursValue = document.getElementById('solar-day-hours-value');
const sunriseTimeEl = document.getElementById('sunrise-time');
const sunsetTimeEl = document.getElementById('sunset-time');
const daylightDurationEl = document.getElementById('daylight-duration');

if (solarDayHoursSlider) {
    noUiSlider.create(solarDayHoursSlider, {
        start: 12,
        step: 0.5,
        connect: [true, false],
        range: { 'min': 1, 'max': 23 },
        pips: { mode: 'values', values: [1, 6, 12, 18, 23], density: 4 },
    });
    solarDayHoursSlider.noUiSlider.on('update', (values) => {
        const value = parseFloat(values[0]);
        solarDayHoursValue.textContent = `${value.toFixed(1)}h`;
    });
}

function updateSolarInfo(city) {
    const solarMode = timeDesignManager.modes.solar;
    if (!solarMode) return;

    const sunTimes = solarMode.getSunTimes(city);
    if (sunTimes) {
        const format = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sunriseTimeEl.textContent = format(sunTimes.sunrise);
        sunsetTimeEl.textContent = format(sunTimes.sunset);

        const durationMs = sunTimes.sunset - sunTimes.sunrise;
        const durationHours = Math.floor(durationMs / 3600000);
        const durationMins = Math.floor((durationMs % 3600000) / 60000);
        daylightDurationEl.textContent = `${durationHours}h ${durationMins}m`;

        const daylightHours = durationMs / 3600000;
        if (solarDayHoursSlider) {
            // Set the slider to the actual daylight hours as the default
            solarDayHoursSlider.noUiSlider.set(daylightHours);
        }
    }
}

function setupMode(mode) {
    if (mode.id === 'solar') {
        const city = mode.config.city || 'tokyo';
        solarCitySelect.value = city;
        updateSolarInfo(city);
        if (solarDayHoursSlider) {
            solarDayHoursSlider.noUiSlider.set(mode.config.dayHours || 12);
        }
    }
}

// Event Listeners
if (solarCitySelect) {
    solarCitySelect.addEventListener('change', () => {
        updateSolarInfo(solarCitySelect.value);
        // We don't save automatically on city change, but we could.
        // Let's let the user hit "Save".
    });
}

// --- Main Execution ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 