import { $ } from '../utils/dom.js';

export class Timeline {
    constructor(element) {
        this.container = element;
        this.marker = $('.timeline__current', this.container);

        if (!this.container || !this.marker) {
            console.error('Timeline: Required elements not found.');
        }
    }

    /**
     * Updates the position of the current time marker.
     * This is designed to be called frequently.
     * @param {number} progress - A value from 0 to 1 representing progress through the 24-hour day.
     */
    updateMarker(progress) {
        if (!this.marker || progress === undefined) return;
        this.marker.style.left = `${progress * 100}%`;
    }

    /**
     * Renders the segments for the current time design mode.
     * This should be called only when the mode or its configuration changes.
     * @param {Array<object>} segments - Array of segment data for the full day.
     */
    render(segments) {
        if (!this.container) return;

        // Clear existing segments and hour marks
        this.container.querySelectorAll('.timeline-segment, .timeline-hours').forEach(el => el.remove());

        // Add hour marks
        const hoursContainer = document.createElement('div');
        hoursContainer.className = 'timeline-hours';

        // Add major hour marks (0, 6, 12, 18, 24)
        const majorHours = [0, 6, 12, 18, 24];
        majorHours.forEach(hour => {
            const mark = document.createElement('span');
            mark.className = 'hour-mark';
            mark.style.left = `${(hour / 24) * 100}%`;
            mark.textContent = hour === 24 ? '0' : hour.toString();
            hoursContainer.appendChild(mark);
        });

        this.container.appendChild(hoursContainer);

        if (!segments || segments.length === 0) {
            return; // Nothing to render
        }

        const fragment = document.createDocumentFragment();
        const totalDayMinutes = 24 * 60;

        for (const segment of segments) {
            const el = document.createElement('div');
            el.className = `timeline-segment timeline-segment--${segment.type}`;

            const left = (segment.startMinutes / totalDayMinutes) * 100;
            const width = (segment.durationMinutes / totalDayMinutes) * 100;

            el.style.left = `${left}%`;
            el.style.width = `${width}%`;

            // For gradient modes like solar, the style might be set directly from segment data
            if (segment.style?.background) {
                el.style.background = segment.style.background;
            }

            el.textContent = this.getAppropriateLabel(segment, width);
            el.title = `${segment.label}: ${this.formatMinutes(segment.startMinutes)} - ${this.formatMinutes(segment.startMinutes + segment.durationMinutes)}`;

            fragment.appendChild(el);
        }

        this.container.appendChild(fragment);
    }

    getAppropriateLabel(segment, widthPercent) {
        const pixelWidth = (widthPercent / 100) * this.container.offsetWidth;
        if (pixelWidth >= 60) return segment.label;
        if (pixelWidth >= 30) return segment.shortLabel || segment.label.slice(0, 4);
        return '';
    }

    formatMinutes(minutes) {
        const h = Math.floor(minutes / 60) % 24;
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
} 