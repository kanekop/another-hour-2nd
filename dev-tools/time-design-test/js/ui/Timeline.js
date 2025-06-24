import { $ } from '../utils/dom.js';

export class Timeline {
    /**
     * @param {HTMLElement} element The root element for the timeline.
     */
    constructor(element) {
        this.element = element;
        this.markerElement = $('.timeline__current', this.element);
        this.manager = null; // No longer needed, but keep for safety to avoid breaking other logic if any

        if (!this.element || !this.markerElement) {
            console.error('Timeline component not initialized correctly. Missing elements.');
        }
    }

    /**
     * Updates the timeline marker based on the current real time.
     * @param {Date} currentTime The current real time.
     */
    update(currentTime) {
        if (!this.markerElement || !currentTime) return;

        const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        const progressPercentage = (totalMinutes / 1440) * 100;

        this.markerElement.style.left = `${progressPercentage}%`;
    }

    /**
     * Updates the position of the current time marker.
     * This is designed to be called frequently.
     * @param {number} progress - A value from 0 to 1 representing progress through the 24-hour day.
     */
    updateMarker(progress) {
        if (!this.element || progress === undefined) return;
        this.element.style.left = `${progress * 100}%`;
    }

    /**
     * Renders the segments for the current time design mode.
     * This should be called only when the mode or its configuration changes.
     * @param {string} modeId The ID of the current mode.
     * @param {Array<object>} segments - Array of segment data for the full day.
     */
    render(modeId, segments) {
        const segmentsContainer = $('.timeline__segments', this.element);
        if (!segmentsContainer) {
            console.error('Timeline segments container not found');
            return;
        }

        if (!segments || segments.length === 0) {
            segmentsContainer.innerHTML = '<div class="timeline-segment--empty">No timeline data available.</div>';
            return;
        }

        segmentsContainer.innerHTML = segments.map(seg => {
            const width = seg.end - seg.start;
            // Use gradient if provided, otherwise use a solid color
            const backgroundStyle = seg.gradient
                ? `background: ${seg.gradient};`
                : `background-color: ${seg.color};`;

            return `
                <div class="timeline-segment" 
                     style="left: ${seg.start}%; width: ${width}%; ${backgroundStyle}" 
                     title="${seg.label} (${this.formatPercentage(seg.start)} - ${this.formatPercentage(seg.end)})">
                    <span class="timeline-segment__label">${this.getAppropriateLabel(seg, width)}</span>
                </div>
            `;
        }).join('');
    }

    getAppropriateLabel(segment, widthPercent) {
        if (!this.element) return '';
        const pixelWidth = (widthPercent / 100) * this.element.offsetWidth;
        if (pixelWidth >= 60) return segment.label;
        if (pixelWidth >= 30) return segment.shortLabel || segment.label.slice(0, 4);
        return '';
    }

    formatPercentage(percentage) {
        const totalMinutes = 1440 * (percentage / 100);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
} 