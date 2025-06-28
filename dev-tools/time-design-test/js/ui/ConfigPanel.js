import { $ } from '../utils/dom.js';
import { formatDuration } from '../utils/formatters.js';
import SolarTimeFormatter from '../utils/SolarTimeFormatter.js';

export class ConfigPanel {
    constructor(element, { onSave, onReset }) {
        this.element = element;
        this.onSave = onSave;
        this.onReset = onReset;

        this.contentElement = $('#configContent', this.element);

        $('#saveConfigBtn', this.element).addEventListener('click', () => this.handleSave());
        $('#resetConfigBtn', this.element).addEventListener('click', () => this.onReset());

        this.addEventListeners();
    }

    render(mode) {
        if (!mode) {
            this.contentElement.innerHTML = '<p>Select a mode to configure.</p>';
            return;
        }

        let configHtml = '';
        switch (mode.id) {
            case 'classic':
                configHtml = this.generateClassicConfig(mode.config);
                break;
            case 'core-time':
                configHtml = this.generateCoreTimeConfig(mode.config);
                break;
            case 'solar':
                configHtml = this.generateSolarConfig(mode.config, mode.cities, mode.uiData);
                break;
            case 'wake-based':
                configHtml = this.generateWakeBasedConfig(mode.config, mode.schema);
                break;
            default:
                configHtml = '<p>Configuration not available for this mode.</p>';
        }
        this.contentElement.innerHTML = configHtml;

        // Post-render initialization for complex UI elements
        if (mode.id === 'core-time') {
            this.initializeCoreTimeSlider(mode.config);
        } else if (mode.id === 'solar') {
            this.initializeSolarMode(mode.config);
        }
    }

    handleSave() {
        const currentModeId = document.querySelector('.mode-selector__item--active')?.dataset.modeId;
        if (!currentModeId) return;

        const config = {};
        const inputs = this.contentElement.querySelectorAll('input[id], select[id]');

        inputs.forEach(input => {
            if (input.type === 'range' || input.type === 'number') {
                config[input.id] = parseFloat(input.value);
            } else if (input.type === 'time') {
                config[input.id] = input.value;
            } else if (input.type === 'checkbox') {
                config[input.id] = input.checked;
            } else {
                config[input.id] = input.value;
            }
        });

        // Handle complex inputs like noUiSlider specifically
        const coreTimeSlider = $('#coreTimeSlider', this.element);
        if (coreTimeSlider && coreTimeSlider.noUiSlider) {
            const values = coreTimeSlider.noUiSlider.get();
            config.coreTimeStart = parseInt(values[0], 10);
            config.coreTimeEnd = parseInt(values[1], 10);
        }

        const solarDayHoursSlider = $('#solar-day-hours-slider', this.element);
        if (solarDayHoursSlider && solarDayHoursSlider.noUiSlider) {
            config.designedDayHours = parseFloat(solarDayHoursSlider.noUiSlider.get());
        }

        // The city for solar mode is handled by its own event listener in the manager,
        // so we don't need to read it here during a general save.

        this.onSave(config);
    }

    // --- Config UI Generators ---

    generateClassicConfig(config) {
        const duration = config.designed24Duration;
        return `
            <div class="config-group">
                <label for="designed24Duration">Designed 24 Duration: <span class="config-value-display">${formatDuration(duration)}</span></label>
                <input type="range" id="designed24Duration" min="60" max="1425" value="${duration}" step="15">
            </div>
        `;
    }

    generateCoreTimeConfig(config) {
        return `
            <div class="config-group">
                <label>Core Time Range</label>
                <div id="coreTimeSlider" class="config-slider"></div>
            </div>
        `;
    }

    generateSolarConfig(config, cities = {}, uiData = {}) {
        const cityKey = config.location?.key || 'tokyo';
        const cityOptions = Object.entries(cities).map(([key, city]) =>
            `<option value="${key}" ${cityKey === key ? 'selected' : ''}>${city.name}</option>`
        ).join('');

        const { solarInfo } = uiData;

        // SolarTimeFormatterを使用してタイムゾーンを取得
        const timezone = SolarTimeFormatter.getTimezone(config.location);

        // SolarTimeFormatterを使用して太陽情報をフォーマット
        const formatted = SolarTimeFormatter.formatSolarInfo(solarInfo, timezone);

        return `
            <div class="config-group">
                <label for="solar-city">City</label>
                <select id="solar-city">${cityOptions}</select>
            </div>
            <div class="config-group info-box">
                <p><strong>Sunrise:</strong> ${formatted.sunrise}</p>
                <p><strong>Sunset:</strong> ${formatted.sunset}</p>
                <p><strong>Daylight:</strong> ${formatted.daylight}</p>
            </div>
            <div class="config-group">
                <label for="solar-day-hours-slider">Target Day Hours: <span>${config.designedDayHours.toFixed(1)}h</span></label>
                <div id="solar-day-hours-slider" class="config-slider"></div>
            </div>
        `;
    }

    generateWakeBasedConfig(config, schema = {}) {
        let html = '';
        for (const [key, item] of Object.entries(schema)) {
            const value = config[key];
            if (item.type === 'time') {
                html += `
                    <div class="config-group">
                        <label for="${key}">${item.label}</label>
                        <input type="time" id="${key}" value="${value}">
                    </div>`;
            } else if (item.type === 'number') {
                html += `
                    <div class="config-group">
                        <label for="${key}">${item.label}: <span>${value} ${item.unit || ''}</span></label>
                        <input type="range" id="${key}" min="${item.min}" max="${item.max}" value="${value}" step="${item.step || 1}">
                    </div>`;
            }
        }
        return html;
    }

    // --- UI Initializers ---

    initializeCoreTimeSlider(config) {
        const slider = $('#coreTimeSlider');
        if (!slider || typeof noUiSlider === 'undefined') return;

        noUiSlider.create(slider, {
            start: [config.coreTimeStart, config.coreTimeEnd],
            connect: true, range: { min: 0, max: 1440 }, step: 15,
            tooltips: {
                to: val => this.formatMinutesForSlider(Math.round(val))
            }
        });
    }

    initializeSolarMode(config) {
        const dayHoursSlider = $('#solar-day-hours-slider');
        if (!dayHoursSlider || typeof noUiSlider === 'undefined') return;

        noUiSlider.create(dayHoursSlider, {
            start: [config.designedDayHours],
            connect: [true, false], range: { 'min': 1, 'max': 23 }, step: 0.5,
            tooltips: { to: value => `${Number(value).toFixed(1)}h` }
        });

        // Add listeners to update labels on slide
        const durationLabel = dayHoursSlider.previousElementSibling.querySelector('span');
        dayHoursSlider.noUiSlider.on('update', (values) => {
            durationLabel.textContent = `${Number(values[0]).toFixed(1)}h`;
        });
    }

    // Add a listener to update range value displays
    addEventListeners() {
        this.contentElement.addEventListener('input', (e) => {
            if (e.target.type === 'range') {
                const display = e.target.previousElementSibling?.querySelector('.config-value-display');
                if (display) {
                    const value = Number(e.target.value);
                    if (e.target.id === 'designed24Duration') {
                        display.textContent = formatDuration(value);
                    } else {
                        display.textContent = `${value} ${e.target.dataset.unit || ''}`;
                    }
                }
            }
        });
    }

    formatMinutesForSlider(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
}