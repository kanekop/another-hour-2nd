import { $ } from '../utils/dom.js';

export class Timeline {
    constructor(element) {
        this.container = element;
        this.marker = $('.timeline__current', this.container);
        this.renderedSegmentsHash = null; // To track if segments need re-rendering

        if (!this.container || !this.marker) {
            console.error('Timeline: Required elements not found.');
        }
    }

    /**
     * Updates the timeline visualization.
     * @param {object} timeData - The result from timeDesignManager.calculate().
     */
    update(timeData) {
        if (!this.container || !timeData) return;

        // Always update current time marker position
        this.updateMarker(timeData.realTimeProgress);

        // Only re-render segments if they have actually changed
        const segmentsHash = JSON.stringify(timeData.segments);
        if (segmentsHash !== this.renderedSegmentsHash) {
            this.renderSegments(timeData.segments);
            this.renderedSegmentsHash = segmentsHash;
        }
    }

    /**
     * Updates the position of the current time marker.
     * @param {number} progress - A value from 0 to 1 representing progress through the 24-hour day.
     */
    updateMarker(progress) {
        if (!this.marker) return;
        this.marker.style.left = `${progress * 100}%`;
    }

    /**
     * Renders the segments for the current time design mode.
     * @param {Array<object>} segments - Array of segment data.
     */
    renderSegments(segments) {
        if (!segments || segments.length === 0) {
            // Clear existing segments if any
            this.container.querySelectorAll('.timeline-segment').forEach(el => el.remove());
            return;
        }

        // Naive rendering: clear and redraw everything.
        this.container.querySelectorAll('.timeline-segment').forEach(el => el.remove());

        const fragment = document.createDocumentFragment();
        const totalDayMinutes = 24 * 60;

        for (const segment of segments) {
            const el = document.createElement('div');
            el.className = `timeline-segment timeline-segment--${segment.type}`;

            const left = (segment.startMinutes / totalDayMinutes) * 100;
            const width = (segment.durationMinutes / totalDayMinutes) * 100;

            el.style.left = `${left}%`;
            el.style.width = `${width}%`;
            // The color should be defined in CSS based on the segment type class
            // e.g., .timeline-segment--designed { background-color: var(--color-primary); }

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