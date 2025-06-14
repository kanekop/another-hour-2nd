
/**
 * Another Hour Core Time Calculation Module
 * 
 * This module contains the core logic for calculating time in the Another Hour system.
 * The Another Hour concept allows users to design their own relationship with time by
 * scaling different periods of the day at different rates.
 * 
 * Key concepts:
 * - Designed 24: A period where 24 hours are compressed into a shorter real-time duration
 * - Another Hour: The remaining time that flows at normal rate
 * - Time Scaling: Mathematical transformation between real time and Another Hour time
 * 
 * @module TimeCalculation
 * @version 1.0.0
 */

import { ClockAngles, AHTime, AHTimeConfig, TimeScaling, ExtendedAHTime } from './types';

/**
 * Calculate Another Hour angles for analog clock display
 * 
 * This function computes the precise angles for hour and minute hands on an analog
 * clock displaying Another Hour time. The calculation takes into account whether
 * the current time falls within the "Designed 24" period (scaled time) or the
 * "Another Hour" period (normal time flow).
 * 
 * @param currentTime - The current real-world time
 * @param designed24Duration - Duration of the "Designed 24" period in real hours (must be > 0)
 * @param d24StartTime - Start time of the "Designed 24" period
 * @returns Object containing hour and minute hand angles in degrees (0-359)
 * 
 * @example
 * ```typescript
 * const now = new Date();
 * const d24Start = new Date('2025-06-14T06:00:00');
 * const angles = getCustomAhAngles(now, 16, d24Start);
 * console.log(`Hour: ${angles.hourAngle}°, Minute: ${angles.minuteAngle}°`);
 * ```
 */
export function getCustomAhAngles(
    currentTime: Date, 
    designed24Duration: number, 
    d24StartTime: Date
): ClockAngles {
    if (designed24Duration <= 0) {
        throw new Error('designed24Duration must be greater than 0');
    }

    const elapsed = currentTime.getTime() - d24StartTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);

    let hourAngle: number, minuteAngle: number;

    if (elapsedHours < designed24Duration) {
        // Within Designed 24 period - time is scaled
        const scaleFactor = 24 / designed24Duration;
        const scaledHours = elapsedHours * scaleFactor;
        hourAngle = (scaledHours * 30) % 360;
        minuteAngle = ((scaledHours * 60) % 60) * 6;
    } else {
        // In Another Hour period - time flows normally
        const ahElapsed = elapsedHours - designed24Duration;
        const ahDuration = 24 - designed24Duration;
        hourAngle = ((ahElapsed % ahDuration) * 30) % 360;
        minuteAngle = (((ahElapsed % ahDuration) * 60) % 60) * 6;
    }

    return { hourAngle, minuteAngle };
}

/**
 * Convert real-world time to Another Hour time representation
 * 
 * This function transforms a real-world timestamp into the corresponding time
 * in the Another Hour system. During the "Designed 24" period, time is scaled
 * to fit 24 hours into the specified duration. During "Another Hour" periods,
 * time flows at normal rate.
 * 
 * @param realTime - Real-world time to convert
 * @param designed24Duration - Duration of the "Designed 24" period in real hours (must be > 0)
 * @param d24StartTime - Start time of the "Designed 24" period
 * @returns Object containing Another Hour hours and minutes
 * 
 * @example
 * ```typescript
 * const realTime = new Date('2025-06-14T14:30:00');
 * const d24Start = new Date('2025-06-14T06:00:00');
 * const ahTime = convertToAHTime(realTime, 16, d24Start);
 * console.log(`AH Time: ${ahTime.hours}:${ahTime.minutes.toString().padStart(2, '0')}`);
 * ```
 */
export function convertToAHTime(
    realTime: Date, 
    designed24Duration: number, 
    d24StartTime: Date
): AHTime {
    if (designed24Duration <= 0) {
        throw new Error('designed24Duration must be greater than 0');
    }

    const elapsed = realTime.getTime() - d24StartTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);

    let ahHours: number, ahMinutes: number;

    if (elapsedHours < designed24Duration) {
        // Within Designed 24 period - apply time scaling
        const scaleFactor = 24 / designed24Duration;
        const scaledHours = elapsedHours * scaleFactor;
        ahHours = Math.floor(scaledHours) % 24;
        ahMinutes = Math.floor((scaledHours % 1) * 60);
    } else {
        // In Another Hour period - normal time flow
        const ahElapsed = elapsedHours - designed24Duration;
        ahHours = Math.floor(ahElapsed) % 24;
        ahMinutes = Math.floor((ahElapsed % 1) * 60);
    }

    return { hours: ahHours, minutes: ahMinutes };
}

/**
 * Calculate the time scaling factor for the Designed 24 period
 * 
 * The scaling factor determines how much faster time flows during the
 * "Designed 24" period. A factor greater than 1 means time flows faster
 * than real-time, while a factor less than 1 means time flows slower.
 * 
 * @param designed24Duration - Duration of the "Designed 24" period in real hours (must be > 0)
 * @returns Scaling factor (24 hours ÷ designed24Duration)
 * 
 * @example
 * ```typescript
 * const factor = getTimeScalingFactor(16); // Returns 1.5
 * console.log(`Time flows ${factor}x faster during Designed 24`);
 * ```
 */
export function getTimeScalingFactor(designed24Duration: number): number {
    if (designed24Duration === 0) return 1;
    if (designed24Duration < 0) {
        throw new Error('designed24Duration cannot be negative');
    }
    return 24 / designed24Duration;
}

/**
 * Determine if the current time falls within the Designed 24 period
 * 
 * This function checks whether the given time is within the "Designed 24"
 * period (where time scaling applies) or in the "Another Hour" period
 * (where time flows normally).
 * 
 * @param currentTime - Time to check
 * @param designed24Duration - Duration of the "Designed 24" period in real hours (must be > 0)
 * @param d24StartTime - Start time of the "Designed 24" period
 * @returns True if within Designed 24 period, false if in Another Hour period
 * 
 * @example
 * ```typescript
 * const now = new Date();
 * const d24Start = new Date('2025-06-14T06:00:00');
 * const inDesigned24 = isInDesigned24(now, 16, d24Start);
 * console.log(`Currently in: ${inDesigned24 ? 'Designed 24' : 'Another Hour'}`);
 * ```
 */
export function isInDesigned24(
    currentTime: Date, 
    designed24Duration: number, 
    d24StartTime: Date
): boolean {
    if (designed24Duration <= 0) {
        throw new Error('designed24Duration must be greater than 0');
    }

    const elapsed = currentTime.getTime() - d24StartTime.getTime();
    const elapsedHours = elapsed / (1000 * 60 * 60);
    return elapsedHours < designed24Duration;
}

/**
 * Get comprehensive time scaling information for the current moment
 * 
 * This function provides detailed information about the current time scaling
 * state, including the scaling factor, current phase, and whether time is
 * currently being scaled.
 * 
 * @param currentTime - Time to analyze
 * @param designed24Duration - Duration of the "Designed 24" period in real hours (must be > 0)
 * @param d24StartTime - Start time of the "Designed 24" period
 * @returns Object containing comprehensive scaling information
 * 
 * @example
 * ```typescript
 * const scaling = getTimeScalingInfo(new Date(), 16, new Date('2025-06-14T06:00:00'));
 * console.log(`Phase: ${scaling.currentPhase}, Factor: ${scaling.scaleFactor}`);
 * ```
 */
export function getTimeScalingInfo(
    currentTime: Date,
    designed24Duration: number,
    d24StartTime: Date
): TimeScaling {
    const inDesigned24 = isInDesigned24(currentTime, designed24Duration, d24StartTime);
    const scaleFactor = inDesigned24 ? getTimeScalingFactor(designed24Duration) : 1;
    
    return {
        scaleFactor,
        isInDesigned24: inDesigned24,
        currentPhase: inDesigned24 ? 'designed24' : 'another-hour'
    };
}

/**
 * Convert real-world time to extended Another Hour time with metadata
 * 
 * This function provides a comprehensive conversion that includes not only
 * the Another Hour time but also scaling information and formatted output.
 * 
 * @param realTime - Real-world time to convert
 * @param designed24Duration - Duration of the "Designed 24" period in real hours (must be > 0)
 * @param d24StartTime - Start time of the "Designed 24" period
 * @returns Extended AH time object with metadata
 * 
 * @example
 * ```typescript
 * const extendedTime = convertToExtendedAHTime(new Date(), 16, new Date('2025-06-14T06:00:00'));
 * console.log(`${extendedTime.formatted} (${extendedTime.scaling.currentPhase})`);
 * ```
 */
export function convertToExtendedAHTime(
    realTime: Date,
    designed24Duration: number,
    d24StartTime: Date
): ExtendedAHTime {
    const ahTime = convertToAHTime(realTime, designed24Duration, d24StartTime);
    const scaling = getTimeScalingInfo(realTime, designed24Duration, d24StartTime);
    const formatted = `${ahTime.hours.toString().padStart(2, '0')}:${ahTime.minutes.toString().padStart(2, '0')}`;
    
    return {
        ...ahTime,
        scaling,
        realTime,
        formatted
    };
}
