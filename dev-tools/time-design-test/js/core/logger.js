import { $ } from '../utils/dom.js';

export class Logger {
    /**
     * @param {HTMLElement} consoleElement - The element to log messages to.
     */
    constructor(consoleElement) {
        this.consoleElement = consoleElement;
        if (!this.consoleElement) {
            console.error('Logger: Console element not found.');
        }
    }

    /**
     * Logs a message to the debug console and the browser console.
     * @param {string} event - The type of event or message (e.g., 'INIT', 'MODE_CHANGE').
     * @param {string} message - The main log message.
     * @param {any} [data=null] - Optional data to be serialized and displayed.
     */
    log(event, message, data = null) {
        console.log(`[${event}]`, message, data);

        if (!this.consoleElement) return;

        const timestamp = new Date().toLocaleTimeString('en-GB');

        const entry = document.createElement('div');
        entry.className = 'debug-entry';

        const timeEl = document.createElement('span');
        timeEl.className = 'debug-entry__time';
        timeEl.textContent = timestamp;

        const eventEl = document.createElement('span');
        eventEl.className = 'debug-entry__event';
        eventEl.textContent = event;

        const messageEl = document.createElement('span');
        messageEl.className = 'debug-entry__message';
        messageEl.textContent = message;

        entry.append(timeEl, eventEl, messageEl);

        if (data) {
            const dataEl = document.createElement('pre');
            dataEl.className = 'debug-entry__data';
            dataEl.textContent = JSON.stringify(data, null, 2);
            entry.appendChild(dataEl);
        }

        this.consoleElement.prepend(entry);

        // Limit number of entries
        if (this.consoleElement.children.length > 100) {
            this.consoleElement.lastChild.remove();
        }
    }

    error(event, message, data = null) {
        console.error(`[${event}]`, message, data);
        // In a real app, you might add a different class for error styling
        this.log(`ERROR:${event}`, message, data);
    }

    clear() {
        if (this.consoleElement) {
            this.consoleElement.innerHTML = '';
        }
    }
} 