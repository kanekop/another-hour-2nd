
/**
 * Shared type definitions for Another Hour Core
 * Contains all interfaces and types used across the Another Hour ecosystem
 */

/**
 * Represents clock angles for hour and minute hands in degrees
 */
export interface ClockAngles {
  /** Hour hand angle in degrees (0-359) */
  hourAngle: number;
  /** Minute hand angle in degrees (0-359) */
  minuteAngle: number;
}

/**
 * Represents time in the Another Hour system
 */
export interface AHTime {
  /** Hours in Another Hour time (0-23) */
  hours: number;
  /** Minutes in Another Hour time (0-59) */
  minutes: number;
}

/**
 * Configuration for Another Hour time calculations
 */
export interface AHTimeConfig {
  /** Duration of the "Designed 24" period in real hours */
  designed24Duration: number;
  /** Start time of the Designed 24 period */
  d24StartTime: Date;
}

/**
 * Represents a time period with start and end times
 */
export interface TimePeriod {
  /** Start time of the period */
  start: Date;
  /** End time of the period */
  end: Date;
}

/**
 * Time scaling information for Another Hour calculations
 */
export interface TimeScaling {
  /** Scaling factor applied during Designed 24 period */
  scaleFactor: number;
  /** Whether current time is in Designed 24 period */
  isInDesigned24: boolean;
  /** Current phase: 'designed24' or 'another-hour' */
  currentPhase: 'designed24' | 'another-hour';
}

/**
 * Extended Another Hour time with additional metadata
 */
export interface ExtendedAHTime extends AHTime {
  /** Time scaling information */
  scaling: TimeScaling;
  /** Real time this AH time represents */
  realTime: Date;
  /** Formatted time string (HH:MM) */
  formatted: string;
}

/**
 * Another Hour calculation result with comprehensive information
 */
export interface AHCalculationResult {
  /** Another Hour time */
  ahTime: ExtendedAHTime;
  /** Clock angles for display */
  clockAngles: ClockAngles;
  /** Time configuration used */
  config: AHTimeConfig;
}
