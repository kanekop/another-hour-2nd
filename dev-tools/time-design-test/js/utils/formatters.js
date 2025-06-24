/**
 * Formats time values into a HH:MM:SS string.
 * @param {number} h - Hours.
 * @param {number} m - Minutes.
 * @param {number} s - Seconds.
 * @returns {string} The formatted time string.
 */
export function formatTime(h, m, s) {
    const H = String(Math.floor(h)).padStart(2, '0');
    const M = String(Math.floor(m)).padStart(2, '0');
    const S = String(Math.floor(s)).padStart(2, '0');
    return `${H}:${M}:${S}`;
}

/**
 * Formats a duration in minutes into a more readable string.
 * e.g., "1h 30m" or "45m"
 * @param {number} minutes - The duration in minutes.
 * @returns {string} The formatted duration string.
 */
export function formatDuration(minutes) {
    if (minutes === null || isNaN(minutes)) return '--h --m';
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);

    if (h > 0) {
        return `${h}h ${m}m`;
    }
    return `${m}m`;
} 