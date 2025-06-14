
/**
 * Another Hour Core Time Calculation Module
 * 
 * This module contains the core logic for calculating time in the Another Hour system.
 * Extracted from scheduler-web/public/clock-core.js
 */

/**
 * Represents clock angles for hour and minute hands
 */
export interface ClockAngles {
    hourAngle: number;
    minuteAngle: number;
}

/**
 * Represents Another Hour time
 */
export interface AHTime {
    hours: number;
    minutes: number;
}

/**
 * Calculate Another Hour angles for clock display
 * @param currentTime - Current time
 * @param designed24Duration - Duration of Designed 24 in hours
 * @param d24StartTime - Start time of Designed 24
 * @returns Object containing hour and minute angles
 */
export function getCustomAhAngles(
    currentTime: Date, 
    designed24Duration: number, 
    d24StartTime: Date
): ClockAngles {
    // Time calculations logic here
    const elapsed = currentTime.getTime() - d24StartTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);

    let hourAngle: number, minuteAngle: number;

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
 * @param realTime - Real world time
 * @param designed24Duration - Duration of Designed 24 in hours
 * @param d24StartTime - Start time of Designed 24
 * @returns Object containing AH hours and minutes
 */
export function convertToAHTime(
    realTime: Date, 
    designed24Duration: number, 
    d24StartTime: Date
): AHTime {
    const elapsed = realTime.getTime() - d24StartTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);

    let ahHours: number, ahMinutes: number;

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
 * @param designed24Duration - Duration of Designed 24 in hours
 * @returns Scaling factor
 */
export function getTimeScalingFactor(designed24Duration: number): number {
    if (designed24Duration === 0) return 1;
    return 24 / designed24Duration;
}

/**
 * Check if current time is within Designed 24 period
 * @param currentTime - Current time
 * @param designed24Duration - Duration of Designed 24 in hours
 * @param d24StartTime - Start time of Designed 24
 * @returns True if within Designed 24
 */
export function isInDesigned24(
    currentTime: Date, 
    designed24Duration: number, 
    d24StartTime: Date
): boolean {
    const elapsed = currentTime.getTime() - d24StartTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);
    return elapsedHours < designed24Duration;
}
