import { $, $$ } from '../utils/dom.js';

export class ModeSelector {
    /**
     * @param {HTMLElement} element - The root element for the mode selector.
     * @param {Function} onSelect - Callback function when a mode is selected.
     */
    constructor(element, onSelect) {
        this.element = element;
        this.onSelect = onSelect;
        this.listElement = $('.mode-selector__list', this.element);

        if (!this.listElement) {
            console.error('ModeSelector: List element not found.');
            return;
        }

        this.listElement.addEventListener('click', (e) => {
            const item = e.target.closest('.mode-selector__item');
            if (item && item.dataset.modeId) {
                this.onSelect(item.dataset.modeId);
            }
        });
    }

    /**
     * Renders the list of available modes.
     * @param {Array<object>} modes - An array of mode objects from timeDesignManager.
     */
    render(modes) {
        this.listElement.innerHTML = modes.map(mode => `
            <li class="mode-selector__item" data-mode-id="${mode.id}" role="button" tabindex="0">
                <h3 class="mode-selector__name">${mode.name}</h3>
                <p class="mode-selector__description">${mode.description}</p>
            </li>
        `).join('');
    }

    /**
     * Sets the visual active state for a mode.
     * @param {string} modeId - The ID of the mode to activate.
     */
    setActive(modeId) {
        $$('.mode-selector__item', this.listElement).forEach(el => {
            el.classList.toggle('mode-selector__item--active', el.dataset.modeId === modeId);
        });
    }

    setError(message) {
        this.listElement.innerHTML = `
            <li class="mode-selector__item mode-selector__item--error">
                <h3>Error</h3>
                <p>${message}</p>
            </li>
        `;
    }
} 