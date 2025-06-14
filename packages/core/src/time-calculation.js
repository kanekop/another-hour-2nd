/**
 * Another Hour Core Time Calculation Module
 * 
 * This module contains the core logic for calculating time in the Another Hour system.
 * Extracted from scheduler-web/public/clock-core.js
 */

/**
 * Calculate Another Hour angles for clock display
 * @param {Date} currentTime - Current time
 * @param {number} designed24Duration - Duration of Designed 24 in hours
 * @param {Date} d24StartTime - Start time of Designed 24
 * @returns {Object} Object containing hour and minute angles
 */
function getCustomAhAngles(currentTime, designed24Duration, d24StartTime) {
    // Time calculations logic here
    const elapsed = currentTime - d24StartTime;
    const elapsedHours = elapsed / (1000 * 60 * 60);

    let hourAngle, minuteAngle;

    if (elapsedHours < designed24Duration) {
        // Within Designed 24 period
        const scaleFactor = 24 / designed24Duration;
        const scaledHours = elapsedHours * scaleFactor;
        hourAngle = (scaledHours * 30) % 360;
        minuteAngle = ((scaledHours * 60) % 60) * 6;
    } else {
        // In Another Hour period
        const ahElapsed = elapsedHours - designed24Duration;
        const ahDuration = 24 - designed24Duration;
        hourAngle = ((ahElapsed % ahDuration) * 30) % 360;
        minuteAngle = (((ahElapsed % ahDuration) * 60) % 60) * 6;
    }

    return { hourAngle, minuteAngle };
}

/**
 * Convert real time to Another Hour time
 * @param {Date} realTime - Real world time
 * @param {number} designed24Duration - Duration of Designed 24 in hours
 * @param {Date} d24StartTime - Start time of Designed 24
 * @returns {Object} Object containing AH hours and minutes
 */
function convertToAHTime(realTime, designed24Duration, d24StartTime) {
    const elapsed = realTime - d24StartTime;
    const elapsedHours = elapsed / (1000 * 60 * 60);

    let ahHours, ahMinutes;

    if (elapsedHours < designed24Duration) {
        // Within Designed 24 period
        const scaleFactor = 24 / designed24Duration;
        const scaledHours = elapsedHours * scaleFactor;
        ahHours = Math.floor(scaledHours) % 24;
        ahMinutes = Math.floor((scaledHours % 1) * 60);
    } else {
        // In Another Hour period
        const ahElapsed = elapsedHours - designed24Duration;
        ahHours = Math.floor(ahElapsed) % 24;
        ahMinutes = Math.floor((ahElapsed % 1) * 60);
    }

    return { hours: ahHours, minutes: ahMinutes };
}

/**
 * Calculate time scaling factor
 * @param {number} designed24Duration - Duration of Designed 24 in hours
 * @returns {number} Scaling factor
 */
function getTimeScalingFactor(designed24Duration) {
    if (designed24Duration === 0) return 1;
    return 24 / designed24Duration;
}

/**
 * Check if current time is within Designed 24 period
 * @param {Date} currentTime - Current time
 * @param {number} designed24Duration - Duration of Designed 24 in hours
 * @param {Date} d24StartTime - Start time of Designed 24
 * @returns {boolean} True if within Designed 24
 */
function isInDesigned24(currentTime, designed24Duration, d24StartTime) {
    const elapsed = currentTime - d24StartTime;
    const elapsedHours = elapsed / (1000 * 60 * 60);
    return elapsedHours < designed24Duration;
}

module.exports = {
    getCustomAhAngles,
    convertToAHTime,
    getTimeScalingFactor,
    isInDesigned24
}; 