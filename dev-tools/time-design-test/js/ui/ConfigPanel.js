import { $, $$ } from '../utils/dom.js';
import { formatDuration } from '../utils/formatters.js';
import SolarTimeFormatter from '../utils/SolarTimeFormatter.js';
import { CITIES } from '../utils/city-timezones.js';

export class ConfigPanel {
    constructor(element, timeDesignManager) {
        if (!element) throw new Error("ConfigPanel requires a valid DOM element.");
        this.element = element;
        this.timeDesignManager = timeDesignManager;
        this.contentElement = $('.config-panel__content', this.element);
        this.addEventListeners();
    }

    render(modeId, schema, currentConfig, solarInfo = null) {
        if (!this.contentElement) return;

        if (!schema || Object.keys(schema).length === 0) {
            this.contentElement.innerHTML = '<p class="config-panel__placeholder">No configuration available for this mode.</p>';
            return;
        }

        let contentHtml = '';

        if (modeId === 'solar') {
            contentHtml = this.generateSolarConfig(schema, currentConfig, solarInfo);
        } else {
            contentHtml = this.generateGenericConfig(schema, currentConfig);
        }

        this.contentElement.innerHTML = contentHtml;
        this.addInputListeners();
    }

    generateGenericConfig(schema, config) {
        return Object.entries(schema).map(([key, item]) => {
            const value = config[key] ?? item.default;
            switch (item.type) {
                case 'slider':
                    return `
                        <div class="config-group">
                            <label for="${key}">${item.label}</label>
                            <div class="config-slider">
                                <input type="range" id="${key}" data-key="${key}" min="${item.min}" max="${item.max}" step="${item.step}" value="${value}">
                                <span class="config-value-display">${value}${item.unit || ''}</span>
                            </div>
                        </div>`;
                case 'time':
                    return `
                        <div class="config-group">
                            <label for="${key}">${item.label}</label>
                            <input type="time" id="${key}" data-key="${key}" value="${value}" class="config-input">
                        </div>`;
                default:
                    return '';
            }
        }).join('');
    }

    generateSolarConfig(schema, config, solarInfo) {
        const currentCityKey = Object.keys(CITIES).find(key =>
            CITIES[key].latitude === config.location?.latitude &&
            CITIES[key].longitude === config.location?.longitude
        ) || 'tokyo';

        const cityOptions = Object.entries(CITIES).map(([key, city]) =>
            `<option value="${key}" ${currentCityKey === key ? 'selected' : ''}>${city.name}</option>`
        ).join('');

        const timezone = CITIES[currentCityKey]?.tz;
        const formatted = SolarTimeFormatter.formatSolarInfo(solarInfo, timezone);

        let html = `
            <div class="config-group">
                <label for="solar-city-select">City</label>
                <select id="solar-city-select" data-key="location" class="config-select">${cityOptions}</select>
            </div>
            <div class="info-box">
                <div class="info-box__item">
                    <span class="info-box__label">Sunrise</span>
                    <span class="info-box__value">${formatted.sunrise}</span>
                </div>
                <div class="info-box__item">
                    <span class="info-box__label">Sunset</span>
                    <span class="info-box__value">${formatted.sunset}</span>
                </div>
                <div class="info-box__item">
                    <span class="info-box__label">Daylight</span>
                    <span class="info-box__value">${formatted.daylight}</span>
                </div>
            </div>
        `;

        html += this.generateGenericConfig(schema, config);
        return html;
    }

    addEventListeners() {
        this.element.addEventListener('input', (e) => {
            const target = e.target;
            if (target.matches('input[type="range"]')) {
                const display = target.nextElementSibling;
                if (display) {
                    const unit = target.dataset.unit || '';
                    display.textContent = `${target.value}${unit}`;
                }
            }
        });

        this.element.addEventListener('change', (e) => {
            const target = e.target;
            if (target.matches('input, select')) {
                this.handleConfigChange(target);
            }
        });
    }

    addInputListeners() {
        $$('input[type="range"]', this.contentElement).forEach(slider => {
            const display = slider.nextElementSibling;
            if (display) {
                slider.addEventListener('input', () => {
                    display.textContent = `${slider.value}${slider.dataset.unit || ''}`;
                });
            }
        });
    }

    handleConfigChange(target) {
        const key = target.dataset.key;
        if (!key) return;

        let value;
        switch (target.type) {
            case 'range':
                value = parseFloat(target.value);
                break;
            case 'select-one':
                if (key === 'location') {
                    value = CITIES[target.value];
                } else {
                    value = target.value;
                }
                break;
            default:
                value = target.value;
        }

        this.timeDesignManager.updateModeConfig({ [key]: value });
    }

    // Deprecated methods below, will be removed after refactoring
    handleSave() {
        console.warn("handleSave is deprecated.");
    }

    generateClassicConfig(config) {
        console.warn("generateClassicConfig is deprecated.");
    }

    generateCoreTimeConfig(config) {
        console.warn("generateCoreTimeConfig is deprecated.");
    }

    generateWakeBasedConfig(config, schema = {}) {
        console.warn("generateWakeBasedConfig is deprecated.");
    }

    initializeCoreTimeSlider(config) {
        console.warn("initializeCoreTimeSlider is deprecated.");
    }

    initializeSolarMode(config) {
        console.warn("initializeSolarMode is deprecated.");
    }

    formatMinutesForSlider(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
} 