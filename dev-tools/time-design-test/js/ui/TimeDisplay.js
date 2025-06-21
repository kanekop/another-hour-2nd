import { $ } from '../utils/dom.js';
import { formatTime } from '../utils/formatters.js';

export class TimeDisplay {
    constructor() {
        this.elements = {
            time: $('#timeDisplay'),
            period: $('#periodLabel'),
            scale: $('#scaleFactor'),
            realTime: $('#realTime'),
            phase: $('#currentPhase'),
            progress: $('#progress'),
        };

        // Check if all elements were found
        for (const [key, el] of Object.entries(this.elements)) {
            if (!el) {
                console.error(`TimeDisplay: Element for '${key}' not found.`);
            }
        }
    }

    /**
     * Updates all time-related display elements.
     * @param {object} timeData - The result object from timeDesignManager.calculate().
     * @param {Date} realDate - The current real-world Date object.
     * @param {object} [location=null] - Optional location object for timezone-aware time.
     */
    update({ timeData, realDate, location = null }) {
        if (!timeData || !this.elements.time) return;

        // Update Another Hour time
        let timeString;
        if (timeData.segmentInfo?.displayFormat === 'fraction' && timeData.segmentInfo?.elapsed !== undefined) {
            // HH:MM:SS/HH:MM:SS 形式で表示
            const elapsed = formatTime(
                Math.floor(timeData.segmentInfo.elapsed / 60),
                Math.floor(timeData.segmentInfo.elapsed % 60),
                Math.floor((timeData.segmentInfo.elapsed * 60) % 60)
            );
            const total = formatTime(
                Math.floor(timeData.segmentInfo.total / 60),
                Math.floor(timeData.segmentInfo.total % 60),
                0
            );
            timeString = `${elapsed}/${total}`;
        } else {
            // 通常の時刻表示
            timeString = formatTime(timeData.hours, timeData.minutes, timeData.seconds);
        }
        
        this.elements.time.textContent = timeString;
        this.elements.time.setAttribute('datetime', realDate.toISOString());

        // Update period label and scale factor
        this.elements.period.textContent = timeData.periodName;
        this.elements.scale.textContent = `${timeData.scaleFactor.toFixed(2)}x`;

        // Update real time display, considering timezone if provided
        let realTimeString = realDate.toTimeString().substring(0, 8);
        if (location?.timezone) {
            try {
                realTimeString = new Intl.DateTimeFormat('en-GB', {
                    timeZone: location.timezone,
                    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false
                }).format(realDate);
            } catch (e) {
                // error is logged in main loop
            }
        }
        this.elements.realTime.textContent = realTimeString;

        // Update current phase
        if (this.elements.phase && timeData.segmentInfo?.label) {
            this.elements.phase.textContent = timeData.segmentInfo.label;
        } else if (this.elements.phase) {
            this.elements.phase.textContent = '-';
        }

        // Update progress info
        if (timeData.segmentInfo?.progress !== undefined) {
            this.elements.progress.textContent = `${(timeData.segmentInfo.progress * 100).toFixed(1)}%`;
        } else {
            this.elements.progress.textContent = '-';
        }
    }
} 