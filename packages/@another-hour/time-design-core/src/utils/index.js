/**
 * Utility functions for Time Design Modes
 * 
 * Common utilities that can be used across different modes
 * and applications.
 */

/**
 * Convert time string (HH:MM) to minutes since midnight
 * @param {string} timeString - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
export function timeStringToMinutes(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 * @param {number} minutes - Minutes since midnight
 * @returns {string} Time in HH:MM format
 */
export function minutesToTimeString(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Validate timezone string
 * @param {string} timezone - Timezone identifier
 * @returns {boolean} True if valid timezone
 */
export function isValidTimezone(timezone) {
  try {
    if (typeof moment !== 'undefined' && typeof moment.tz !== 'undefined') {
      return moment.tz.zone(timezone) !== null;
    }
    // Basic validation if moment.js not available
    return typeof timezone === 'string' && timezone.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get current timezone
 * @returns {string} Current timezone identifier
 */
export function getCurrentTimezone() {
  if (typeof moment !== 'undefined' && typeof moment.tz !== 'undefined') {
    return moment.tz.guess();
  }
  // Fallback
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}