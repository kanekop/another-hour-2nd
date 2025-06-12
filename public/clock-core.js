// public/clock-core.js

/**
 * Another Hour (AH) Time Core Concept for Main Clock and World Clock (23-hour cycle).
 * This factor scales real time to fit 24 hours of events into a 23-hour AH day.
 * For the first 23 real hours, time runs slightly faster.
 * The 24th real hour (23:00-00:00) is the "Another Hour".
 */
export const SCALE_AH = 24/23;

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
export function getAngles(date, timezone) {
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


/**
 * Calculates the angles for analog clock hands, APH digital time components,
 * and AH sector details for the Personalized AH Clock.
 * This function implements a customizable APH day cycle.
 *
 * @param {Date} date - The current real-time Date object.
 * @param {string} timezone - The IANA timezone string.
 * @param {number} normalAphDayDurationMinutes - The duration of the "normal" part of the APH day in minutes (1 to 1439).
 * @returns {object} An object containing:
 * - {number} hourAngle - Angle for the hour hand (degrees).
 * - {number} minuteAngle - Angle for the minute hand (degrees).
 * - {number} secondAngle - Angle for the second hand (degrees).
 * - {number} aphHours - APH hours for digital display.
 * - {number} aphMinutes - APH minutes for digital display.
 * - {number} aphSeconds - APH seconds for digital display (can have decimals).
 * - {number} ahSectorStartAngleDegrees - Start angle for the AH sector on the analog dial (degrees, 0 at 12 o'clock, clockwise).
 * - {number} ahSectorSweepAngleDegrees - Sweep angle for the AH sector (degrees, max 360).
 * - {boolean} isPersonalizedAhPeriod - True if the current time is within the "Another Personalized Hour(s)" period.
 */
// public/clock-core.js

// ... (SCALE_AH と getAngles 関数はそのまま) ...

export function getCustomAhAngles(date, timezone, normalAphDayDurationMinutes) {
  if (typeof moment === 'undefined' || typeof moment.tz === 'undefined') {
    console.error("Moment.js and Moment Timezone are not loaded. Cannot calculate custom AH angles.");
    return {
      hourAngle: 0, minuteAngle: 0, secondAngle: 0,
      aphHours: 0, aphMinutes: 0, aphSeconds: 0,
      ahSectorStartAngleDegrees: 0, ahSectorSweepAngleDegrees: 0,
      isPersonalizedAhPeriod: false,
    };
  }


  // スライダーの範囲が 0 から 1440 になったことによる調整
  // normalAphDayDurationMinutes が 0 の場合、APH期間は丸1日 (24時間)
  // normalAphDayDurationMinutes が 1440 の場合、APH期間は 0分
  normalAphDayDurationMinutes = Math.max(0, Math.min(normalAphDayDurationMinutes, 1440)); // kaneko
  // normalAphDayDurationMinutes = Math.max(1, Math.min(normalAphDayDurationMinutes, (24 * 60) - 1));

  const localTime = moment(date).tz(timezone);
  const realHours = localTime.hours();
  const realMinutes = localTime.minutes();
  const realSeconds = localTime.seconds();
  const realMilliseconds = localTime.milliseconds();

  const realMillisecondsInDay = (realHours * 3600 + realMinutes * 60 + realSeconds) * 1000 + realMilliseconds;
  const normalAphDayDurationMs = normalAphDayDurationMinutes * 60 * 1000;

  // normalAphDayDurationHours の計算と scaleFactor の計算でゼロ除算を避ける
  let normalAphDayDurationHours = normalAphDayDurationMinutes / 60;
  // scaleFactor は通常期間の時間の進み方を調整するために使用
  let scaleFactor;

  if (normalAphDayDurationHours === 0) { // 通常時間が0分の場合
    scaleFactor = Infinity; // 実質、常にAPH期間として扱う (またはエラー処理)
                           // この場合、通常期間の時間は一瞬で終わり、即座にAPH期間へ
                           // APH期間中は通常スピードなので、実質24時間通常の時計
  } else if (normalAphDayDurationHours === 24) { // 通常時間が24時間の場合 (APH期間なし)
    scaleFactor = 1; // スケールなし、常に通常期間と同じ
  } else {
    scaleFactor = 24 / normalAphDayDurationHours;
  }



  let aphHoursDigital, aphMinutesDigital, aphSecondsFloat;
  const isPersonalizedAhPeriod = realMillisecondsInDay >= normalAphDayDurationMs;

  if (isPersonalizedAhPeriod) {
    // APH期間中は通常の時間スピードで進む
    const elapsedRealMsInAphPeriod = realMillisecondsInDay - normalAphDayDurationMs;

    const elapsedAphHoursInPeriod = Math.floor(elapsedRealMsInAphPeriod / (3600 * 1000));
    const elapsedAphMinutesInPeriod = Math.floor((elapsedRealMsInAphPeriod / (60 * 1000)) % 60);
    const elapsedAphSecondsInPeriodFloat = (elapsedRealMsInAphPeriod / 1000) % 60;

    aphHoursDigital = 24 + elapsedAphHoursInPeriod; // 24時から時間を積み上げ
    aphMinutesDigital = elapsedAphMinutesInPeriod;
    aphSecondsFloat = elapsedAphSecondsInPeriodFloat;

  } else { // 通常期間
    const scaledMs = realMillisecondsInDay * scaleFactor;
    aphHoursDigital = Math.floor(scaledMs / (3600 * 1000));
    aphMinutesDigital = Math.floor((scaledMs / (60 * 1000)) % 60);
    aphSecondsFloat = (scaledMs / 1000) % 60;
  }

  // アナログ針の角度計算 (12時間制文字盤)
  let displayAnalogHours = aphHoursDigital;
  if (aphHoursDigital >= 12) { // 12時以上は剰余を取る (例: 13時は1時、24時は12時(0時として扱う場合あり))
      displayAnalogHours = aphHoursDigital % 12;
  }
  if (displayAnalogHours === 0 && aphHoursDigital > 0) { // 12時、24時などは12として扱う
      displayAnalogHours = 12;
  }


  // APH期間中の時針の計算を修正: APH 24時は12時(0時)位置から始まり、実時間の分秒で進む
  let hourAngle;
  if (isPersonalizedAhPeriod) {
      // APH期間の開始を0時として、そこからの実時間の分・秒で時針を動かす (メインクロックのAH時の挙動に合わせる)
      // aphHoursDigital は24, 25, ... となるので、アナログ表示用の「時」は (aphHoursDigital - 24) % 12 などとする
      const hoursIntoAphPeriod = Math.floor((realMillisecondsInDay - normalAphDayDurationMs) / (3600 * 1000));
      const minutesIntoAphHour = Math.floor(((realMillisecondsInDay - normalAphDayDurationMs) % (3600 * 1000)) / (60 * 1000));
      const secondsForAphHourHand = ((realMillisecondsInDay - normalAphDayDurationMs) % (60 * 1000)) / 1000;

      // displayAnalogHours は (24 + hoursIntoAphPeriod) % 12 とする (0時は12)
      let analogHourBase = (24 + hoursIntoAphPeriod);
      if (analogHourBase >= 12) analogHourBase %=12;
      if (analogHourBase === 0) analogHourBase = 12;

      hourAngle = (analogHourBase * 30) + (minutesIntoAphHour * 0.5) + (secondsForAphHourHand * (0.5/60));

  } else { // 通常期間
      // 通常期間はスケールされたAPH時間に基づいて針を動かす
      let analogHourBaseScaled = aphHoursDigital;
      if (analogHourBaseScaled >=12) analogHourBaseScaled %=12;
      if (analogHourBaseScaled === 0 && aphHoursDigital >0) analogHourBaseScaled =12; // 0時でない限り

      hourAngle = (analogHourBaseScaled * 30) + (aphMinutesDigital * 0.5) + (aphSecondsFloat * (0.5/60));
  }


  // 分針・秒針は期間によらず、計算された aphMinutesDigital, aphSecondsFloat を使う
  // ただし、APH期間中は実時間の分秒を使うという考え方もある (メインクロックのAH時)
  // ここでは、デジタル表示と一貫性を持たせるため、計算されたAPH分秒を使う
  let minuteAngle, secondAngle;
  if (isPersonalizedAhPeriod) {
      // APH期間中は実時間の分・秒で針を動かす (メインクロックのAH時の挙動に合わせる)
      const realMinutesForHands = realMinutes;
      const realSecondsForHands = realSeconds + realMilliseconds / 1000;
      minuteAngle = (realMinutesForHands * 6) + (realSecondsForHands * 0.1);
      secondAngle = realSecondsForHands * 6;
  } else {
      minuteAngle = (aphMinutesDigital * 6) + (aphSecondsFloat * 0.1);
      secondAngle = aphSecondsFloat * 6;
  }

  // AHセクターの角度計算 - APH期間を示し、12時基点とする
  const ahSectorStartAngleDegrees = 0; // パイは常に12時の位置から開始

  // セクターの掃引角度は、APH期間の長さ（実時間ベース）を角度に変換したもの
  // 12時間を超える場合も、その角度をそのまま計算する (例: 13時間なら390度)
  const aphPeriodActualDurationMinutes = (24 * 60) - normalAphDayDurationMinutes;
  const ahSectorSweepAngleDegrees = (aphPeriodActualDurationMinutes / (12 * 60)) * 360; // 360度でクリップしない

  return {
    hourAngle,
    minuteAngle,
    secondAngle,
    aphHours: aphHoursDigital,
    aphMinutes: aphMinutesDigital,
    aphSeconds: aphSecondsFloat,
    ahSectorStartAngleDegrees,    // 常に0
    ahSectorSweepAngleDegrees,    // 360を超える可能性あり
    isPersonalizedAhPeriod,
  };
}