/**
 * Calculates display time and clock angles for a custom-defined day length ("Designed 24").
 * This function allows for a day that can be longer or shorter than the standard 24 hours,
 * with the remaining time ("Another Hour") running at a normal pace.
 *
 * @param {Date | string} date - The date object or ISO string for the calculation.
 * @param {string} timezone - The IANA timezone string (currently unused, for future compatibility).
 * @param {number} [designed24Duration=1380] - The duration of the "Designed 24" period in minutes (defaults to 23 hours).
 * @returns {object} An object containing the calculated time components and clock angles.
 */
function getCustomAhAngles(date, timezone, designed24Duration = 1380) {
    const now = new Date(date);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const currentSeconds = now.getSeconds();

    // Calculate if we're in the "Another Hour" period
    const anotherHourStart = designed24Duration;
    const isPersonalizedAhPeriod = currentMinutes >= anotherHourStart;

    let scaleFactor, displayHours, displayMinutes, displaySeconds;

    if (isPersonalizedAhPeriod) {
        // "Another Hour" period - time runs at a normal 1x speed.
        scaleFactor = 1.0;
        displayHours = now.getHours();
        displayMinutes = now.getMinutes();
        displaySeconds = now.getSeconds();
    } else {
        // "Designed 24" period - time is scaled to fit.
        const totalRealMinutesInDay = 24 * 60; // 1440
        scaleFactor = designed24Duration / totalRealMinutesInDay; // e.g., 1380 / 1440 = 0.9583...
        const scaledMinutes = currentMinutes / scaleFactor;
        displayHours = Math.floor(scaledMinutes / 60);
        displayMinutes = Math.floor(scaledMinutes % 60);
        displaySeconds = Math.floor((scaledMinutes % 1) * 60);
    }

    // Calculate angles for a standard analog clock display based on the potentially scaled time.
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
        secondAngle: secondAngle,
    };
}

module.exports = {
    getCustomAhAngles,
}; 