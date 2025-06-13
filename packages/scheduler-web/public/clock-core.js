// clock-core.js - Core time calculation functions for scheduler UI

// public/clock-core.js

/**
 * Another Hour (AH) Time Core Concept for Main Clock and World Clock (23-hour cycle).
 * This factor scales real time to fit 24 hours of events into a 23-hour AH day.
 * For the first 23 real hours, time runs slightly faster.
 * The 24th real hour (23:00-00:00) is the "Another Hour".
 */
const SCALE_AH = 24 / 23;

/**
 * Calculates the angles for analog clock hands and AH digital time components for the standard Main/World Clock.
 * This function implements the 23-hour day cycle for the main clock and world clocks.
 *
 * @param {Date} date - The current real-time Date object.
 * @param {string} timezone - The IANA timezone string.
 * @returns {object} An object containing:
 * - {number} hourAngle - Angle for the hour hand.
 * - {number} minuteAngle - Angle for the minute hand.
 * - {number} secondAngle - Angle for the second hand.
 * - {number} ahHours - AH hours for digital display.
 * - {number} ahMinutes - AH minutes for digital display.
 * - {number} ahSeconds - AH seconds for digital display.
 */
function getAngles(date, timezone) {
  if (typeof moment === 'undefined' || typeof moment.tz === 'undefined') {
    console.error("Moment.js and Moment Timezone are not loaded. Cannot calculate standard AH angles.");
    return { hourAngle: 0, minuteAngle: 0, secondAngle: 0, ahHours: 0, ahMinutes: 0, ahSeconds: 0 };
  }
  const localTime = moment(date).tz(timezone);
  const hours = localTime.hours(); // Real local hours (0-23)
  const minutes = localTime.minutes(); // Real local minutes (0-59)
  const seconds = localTime.seconds(); // Real local seconds (0-59)
  const milliseconds = localTime.milliseconds(); // Real local milliseconds (0-999)

  const isAHHour = hours === 23;
  const totalMs = ((hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds);
  const scaledMs = isAHHour ? totalMs : totalMs * SCALE_AH;

  let ahHours = Math.floor((scaledMs / (1000 * 3600)) % 24);
  const ahMinutes = Math.floor((scaledMs / (1000 * 60)) % 60);
  const ahSeconds = (scaledMs / 1000) % 60;

  if (isAHHour) {
    ahHours = 24;
  }

  const hourAngle = isAHHour ?
    ((minutes * 60 + seconds) * 30 / 3600) :
    (ahHours % 12) * 30 + (ahMinutes * 30 / 60); // Ensure ahHours for analog is 12h format

  const minuteAngle = isAHHour ?
    (minutes * 6 + (seconds * 6 / 60)) :
    ahMinutes * 6 + (ahSeconds * 6 / 60);

  const secondAngle = isAHHour ?
    seconds * 6 :
    ahSeconds * 6;

  return { hourAngle, minuteAngle, secondAngle, ahHours, ahMinutes, ahSeconds };
}