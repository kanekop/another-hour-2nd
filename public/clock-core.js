// clock-core.js - Core time calculation functions

// Fallback implementation for getCustomAhAngles
function getCustomAhAngles(date, timezone, designed24Duration = 1380) {
  const now = new Date(date);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  // Calculate if we're in Another Hour period
  const anotherHourStart = designed24Duration;
  const isPersonalizedAhPeriod = currentMinutes >= anotherHourStart;

  let scaleFactor, displayHours, displayMinutes, displaySeconds;

  if (isPersonalizedAhPeriod) {
    // Another Hour period - normal time
    scaleFactor = 1.0;
    displayHours = now.getHours();
    displayMinutes = now.getMinutes();
    displaySeconds = now.getSeconds();
  } else {
    // Designed 24 period - scaled time
    scaleFactor = designed24Duration / 1440;
    const scaledMinutes = currentMinutes / scaleFactor;
    displayHours = Math.floor(scaledMinutes / 60);
    displayMinutes = Math.floor(scaledMinutes % 60);
    displaySeconds = Math.floor((scaledMinutes % 1) * 60);
  }

  // Calculate angles for clock display
  const hourAngle = (displayHours % 12) * 30 + displayMinutes * 0.5;
  const minuteAngle = displayMinutes * 6 + displaySeconds * 0.1;
  const secondAngle = displaySeconds * 6;

  return {
    aphHours: displayHours,
    aphMinutes: displayMinutes,
    aphSeconds: displaySeconds,
    scaleFactor: scaleFactor,
    isPersonalizedAhPeriod: isPersonalizedAhPeriod,
    hourAngle: hourAngle,
    minuteAngle: minuteAngle,
    secondAngle: secondAngle
  };
}

// Make function globally available
if (typeof window !== 'undefined') {
  window.getCustomAhAngles = getCustomAhAngles;
}

// public/clock-core.js

/**
 * Another Hour (AH) Time Core Concept for Main Clock and World Clock (23-hour cycle).
 * This factor scales real time to fit 24 hours of events into a 23-hour AH day.
 * For the first 23 real hours, time runs slightly faster.
 * The 24th real hour (23:00-00:00) is the "Another Hour".
 */
const SCALE_AH = 24/23;

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
  // ... (既存の getAngles 関数の実装はそのまま)
  // ... (念のため、Moment.jsの存在チェックはここにもあった方が良いかもしれません)
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