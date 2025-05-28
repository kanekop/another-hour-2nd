// public/js/personalized-ah-clock-ui.js

import { getCustomAhAngles } from "../clock-core.js";
import {
  getDisplayTimezones,
  getUserLocalTimezone,
  getCityNameByTimezone,
} from "./timezone-manager.js";
import { drawAphGraph, updateAphAxisLabels } from "./aph-graph-demo.js";
import { 
  initializeThemeManager, 
  applyClockFace, 
  applyColorTheme, 
  saveColorPreferences,
  createThemeSettingsUI,
  CLOCK_FACES,
  COLOR_THEMES
} from "./clock-theme-manager.js";

//ローカル保存用定数
export const LOCAL_STORAGE_KEY_APH_DURATION = "personalizedAhDurationMinutes";
const LOCAL_STORAGE_KEY_SETTINGS_VISIBLE = 'personalizedAhSettingsVisible';
const LOCAL_STORAGE_KEY_CURRENT_VIEW = 'personalizedAhCurrentView';
const LOCAL_STORAGE_KEY_SELECTED_TIMEZONE = 'personalizedAhSelectedTimezone';

// 実時間グラフ描画関数
function drawRealTimeGraph(realHoursBarElement) {
    if (!realHoursBarElement) {
        console.error("Real hours bar element not provided for drawing.");
        return;
    }
    realHoursBarElement.innerHTML = '';

    for (let i = 0; i < 24; i++) {
        const segment = document.createElement('div');
        segment.classList.add('bar-segment');
        segment.style.height = `${100 / 24}%`;
        segment.textContent = i;
        realHoursBarElement.appendChild(segment);
    }
}

// DOM Elements
const elements = {
  normalDurationSlider: document.getElementById("normal-duration-slider"),
  normalDurationDisplay: document.getElementById("normal-duration-display"),
  anotherHourDurationDisplay: document.getElementById(
    "another-hour-duration-display",
  ),
  sliderRealTimeLabel: document.getElementById("slider-real-time-label"),
  sliderRealTimeIndicator: document.querySelector(
    ".slider-real-time-indicator",
  ),
  timezoneSelect: document.getElementById("timezone-select"),
  cityNameDisplay: document.getElementById("personalized-ah-city-name"),
  personalizedAhTitle: document.getElementById("personalized-ah-title"),
  analogClock: document.getElementById("personalized-ah-analog-clock"),
  ahSector: document.getElementById("ah-personalized-sector"),
  ahSectorIndicatorLine: document.getElementById(
    "ah-personalized-sector-indicator",
  ),
  ticks: document.getElementById("ticks-personalized"),
  hands: {
    hour: document.getElementById("hour-personalized"),
    minute: document.getElementById("minute-personalized"),
    second: document.getElementById("second-personalized"),
  },
  digitalAphTime: document.getElementById("personalized-aph-time"),
  digitalNormalTime: document.getElementById("personalized-normal-time"),
  digitalAphRemaining: document.getElementById("personalized-aph-remaining"),
  settingsPanel: document.getElementById('aph-settings-panel'),
  toggleViewBtn: document.getElementById('toggle-view-btn'),
  clockViewContainer: document.getElementById('clock-view-container'),
  personalizedAphGraphContainer: document.getElementById('personalizedAphGraphContainer'),
  personalizedAphGraphBar: document.getElementById('personalizedAphGraphBar'),
  personalizedAphAxisLabels: document.getElementById('personalizedAphAxisLabels'),
  personalizedRealHoursBar: document.getElementById('personalizedRealHoursBar'),
  themeSettingsContainer: document.getElementById('theme-settings-container'),
  sliderDecrement: document.getElementById('slider-decrement'),
  sliderIncrement: document.getElementById('slider-increment')
};

// Application State
const state = {
  selectedTimezone: "",
  normalAphDayDurationMinutes: 1380,
  displayTimezones: [],
  animationFrameId: null,
  themeSettings: null,
  currentIsAhPeriod: false
};

// --- Utility Functions ---
function formatDuration(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} hours ${minutes} minutes`;
}

// スライダー関連の表示を更新する専用関数
function updateSliderRelatedDisplays() {
  if (
    !elements.normalDurationSlider ||
    !elements.anotherHourDurationDisplay ||
    !elements.sliderRealTimeLabel ||
    !elements.sliderRealTimeIndicator ||
    !elements.normalDurationDisplay
  ) {
    return;
  }

  const normalAphDayMinutes = parseInt(elements.normalDurationSlider.value, 10);

  elements.normalDurationDisplay.textContent = `Normal APH Day: ${formatDuration(normalAphDayMinutes)}`;
  const totalRealMinutesInDay = 24 * 60;
  const aphDurationMinutes = totalRealMinutesInDay - normalAphDayMinutes;
  elements.anotherHourDurationDisplay.textContent = `${formatDuration(aphDurationMinutes)}`;

  const realTimeHourEquivalent = Math.floor(normalAphDayMinutes / 60);
  const realTimeMinuteEquivalent = normalAphDayMinutes % 60;
  elements.sliderRealTimeLabel.textContent = `${String(realTimeHourEquivalent).padStart(2, "0")}:${String(realTimeMinuteEquivalent).padStart(2, "0")}`;

  const sliderMin = parseInt(elements.normalDurationSlider.min, 10);
  const sliderMax = parseInt(elements.normalDurationSlider.max, 10);
  const thumbPositionRatio =
    (normalAphDayMinutes - sliderMin) / (sliderMax - sliderMin);

  elements.sliderRealTimeIndicator.style.setProperty(
    "--slider-thumb-position",
    `${thumbPositionRatio * 100}%`,
  );
  elements.normalDurationSlider.style.setProperty(
    "--slider-progress-percent",
    `${thumbPositionRatio * 100}%`,
  );

  if (elements.personalizedAphGraphBar && elements.personalizedAphAxisLabels && elements.personalizedAphGraphContainer) {
    drawAphGraph(elements.personalizedAphGraphBar, normalAphDayMinutes);
    updateAphAxisLabels(elements.personalizedAphAxisLabels, elements.personalizedAphGraphContainer, normalAphDayMinutes);
  }
}

// --- Theme Functions ---
function initializeThemes() {
  state.themeSettings = initializeThemeManager();

  // Create and insert theme settings UI
  if (elements.themeSettingsContainer) {
    const themeUI = createThemeSettingsUI();
    elements.themeSettingsContainer.appendChild(themeUI);

    // Set initial values
    const faceSelect = document.getElementById('clock-face-select');
    const colorScaled24Select = document.getElementById('color-scaled24-select');
    const colorAhSelect = document.getElementById('color-ah-select');

    if (faceSelect) faceSelect.value = state.themeSettings.clockFace;
    if (colorScaled24Select) colorScaled24Select.value = state.themeSettings.colorScaled24;
    if (colorAhSelect) colorAhSelect.value = state.themeSettings.colorAH;

    // Add event listeners
    faceSelect?.addEventListener('change', (e) => {
      applyClockFace(e.target.value);
      // Re-draw ticks if switching to/from Roman
      if (e.target.value === CLOCK_FACES.ROMAN || state.themeSettings.clockFace === CLOCK_FACES.ROMAN) {
        drawTicks();
        applyClockFace(e.target.value); // Re-apply to update numerals
      }
      state.themeSettings.clockFace = e.target.value;
    });

    colorScaled24Select?.addEventListener('change', (e) => {
      state.themeSettings.colorScaled24 = e.target.value;
      saveColorPreferences(state.themeSettings.colorScaled24, state.themeSettings.colorAH);
      if (!state.currentIsAhPeriod) {
        applyColorTheme(false, state.themeSettings.colorScaled24, state.themeSettings.colorAH);
      }
    });

    colorAhSelect?.addEventListener('change', (e) => {
      state.themeSettings.colorAH = e.target.value;
      saveColorPreferences(state.themeSettings.colorScaled24, state.themeSettings.colorAH);
      if (state.currentIsAhPeriod) {
        applyColorTheme(true, state.themeSettings.colorScaled24, state.themeSettings.colorAH);
      }
    });
  }

  // Apply initial theme
  applyClockFace(state.themeSettings.clockFace);
}

// --- Initialization Functions ---
function initializeSlider() {
  if (!elements.normalDurationSlider) return;

  const savedDurationString = localStorage.getItem(
    LOCAL_STORAGE_KEY_APH_DURATION,
  );
  if (savedDurationString !== null) {
    const savedDurationInt = parseInt(savedDurationString, 10);
    const sliderMin = parseInt(elements.normalDurationSlider.min, 10);
    const sliderMax = parseInt(elements.normalDurationSlider.max, 10);
    if (
      !isNaN(savedDurationInt) &&
      savedDurationInt >= sliderMin &&
      savedDurationInt <= sliderMax
    ) {
      state.normalAphDayDurationMinutes = savedDurationInt;
    }
  }
  elements.normalDurationSlider.value =
    state.normalAphDayDurationMinutes.toString();

  if (elements.personalizedRealHoursBar) {
      drawRealTimeGraph(elements.personalizedRealHoursBar);
  }

  updateSliderRelatedDisplays();

  // Slider input event
  elements.normalDurationSlider.addEventListener("input", () => {
    state.normalAphDayDurationMinutes = parseInt(
      elements.normalDurationSlider.value,
      10,
    );
    updateSliderRelatedDisplays();
    updateFineTuneButtons();
    localStorage.setItem(
      LOCAL_STORAGE_KEY_APH_DURATION,
      state.normalAphDayDurationMinutes.toString(),
    );
  });

  // Fine-tune button functions
  function updateFineTuneButtons() {
    const currentValue = parseInt(elements.normalDurationSlider.value, 10);
    const min = parseInt(elements.normalDurationSlider.min, 10);
    const max = parseInt(elements.normalDurationSlider.max, 10);

    if (elements.sliderDecrement) {
      elements.sliderDecrement.disabled = currentValue <= min;
    }
    if (elements.sliderIncrement) {
      elements.sliderIncrement.disabled = currentValue >= max;
    }
  }

  function adjustSliderValue(delta) {
    const currentValue = parseInt(elements.normalDurationSlider.value, 10);
    const min = parseInt(elements.normalDurationSlider.min, 10);
    const max = parseInt(elements.normalDurationSlider.max, 10);
    const newValue = Math.max(min, Math.min(max, currentValue + delta));

    if (newValue !== currentValue) {
      elements.normalDurationSlider.value = newValue.toString();
      state.normalAphDayDurationMinutes = newValue;
      updateSliderRelatedDisplays();
      updateFineTuneButtons();
      localStorage.setItem(
        LOCAL_STORAGE_KEY_APH_DURATION,
        state.normalAphDayDurationMinutes.toString(),
      );
    }
  }

  // Long press functionality
  let longPressInterval = null;
  let longPressTimeout = null;
  let longPressSpeed = 100; // Initial speed in ms
  const minSpeed = 20; // Fastest speed
  const speedupFactor = 0.9; // Speed multiplier

  function startLongPress(delta) {
    // First, do one adjustment immediately
    adjustSliderValue(delta);

    // Start with slower speed
    longPressSpeed = 100;

    // Set timeout for starting rapid fire after 500ms
    longPressTimeout = setTimeout(() => {
      longPressInterval = setInterval(() => {
        adjustSliderValue(delta);
        // Gradually speed up
        if (longPressSpeed > minSpeed) {
          clearInterval(longPressInterval);
          longPressSpeed *= speedupFactor;
          longPressInterval = setInterval(() => adjustSliderValue(delta), longPressSpeed);
        }
      }, longPressSpeed);
    }, 500);
  }

  function stopLongPress() {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      longPressTimeout = null;
    }
    if (longPressInterval) {
      clearInterval(longPressInterval);
      longPressInterval = null;
    }
    longPressSpeed = 100; // Reset speed
  }

  // Add event listeners for fine-tune buttons with long press support
  if (elements.sliderDecrement) {
    // Mouse events
    elements.sliderDecrement.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startLongPress(-1);
    });

    // Touch events
    elements.sliderDecrement.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startLongPress(-1);
    });
  }

  if (elements.sliderIncrement) {
    // Mouse events
    elements.sliderIncrement.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startLongPress(1);
    });

    // Touch events
    elements.sliderIncrement.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startLongPress(1);
    });
  }

  // Global mouse/touch up events to stop long press
  document.addEventListener("mouseup", stopLongPress);
  document.addEventListener("touchend", stopLongPress);
  document.addEventListener("touchcancel", stopLongPress);

  // Stop if mouse leaves the window
  document.addEventListener("mouseleave", (e) => {
    if (e.target === document.documentElement) {
      stopLongPress();
    }
  });

  // Initialize button states
  updateFineTuneButtons();
}

function initializeViewToggle() {
  if (!elements.clockViewContainer || !elements.settingsPanel || !elements.toggleViewBtn) {
    console.error("Required elements for view toggle not found.");
    return;
  }

  const savedView = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_VIEW);
  let showClockView = (savedView === 'clock' || savedView === null);

  function updateView(showClock) {
    if (showClock) {
      elements.clockViewContainer.style.display = 'block';
      elements.settingsPanel.style.display = 'none';
      elements.toggleViewBtn.textContent = 'Show Settings';
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_VIEW, 'clock');
    } else {
      elements.clockViewContainer.style.display = 'none';
      elements.settingsPanel.style.display = 'block';
      elements.toggleViewBtn.textContent = 'Show Clock';
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_VIEW, 'settings');
      if (elements.personalizedRealHoursBar) {
          drawRealTimeGraph(elements.personalizedRealHoursBar);
      }
      if (elements.normalDurationSlider && elements.personalizedAphGraphBar && elements.personalizedAphAxisLabels && elements.personalizedAphGraphContainer) {
          const currentSliderValue = parseInt(elements.normalDurationSlider.value, 10);
          drawAphGraph(elements.personalizedAphGraphBar, currentSliderValue);
          updateAphAxisLabels(elements.personalizedAphAxisLabels, elements.personalizedAphGraphContainer, currentSliderValue);
      }
    }
  }

  updateView(showClockView);

  elements.toggleViewBtn.addEventListener('click', () => {
    const currentlyShowingClock = elements.settingsPanel.style.display === 'none';
    updateView(!currentlyShowingClock);
  });
}

function initializeTimezoneSelect() {
  if (!elements.timezoneSelect) return;

  state.displayTimezones = getDisplayTimezones();
  elements.timezoneSelect.innerHTML = "";

  state.displayTimezones.forEach((tzData) => {
    const option = new Option(tzData.displayText, tzData.timezone);
    elements.timezoneSelect.appendChild(option);
  });

  const savedTimezone = localStorage.getItem(LOCAL_STORAGE_KEY_SELECTED_TIMEZONE);
  const params = new URLSearchParams(window.location.search);
  const urlTimezone = params.get("timezone");

  let initialTimezone;
  if (savedTimezone && moment.tz.zone(savedTimezone)) {
    initialTimezone = savedTimezone;
  } else if (urlTimezone && moment.tz.zone(urlTimezone)) {
    initialTimezone = urlTimezone;
  } else {
    initialTimezone = getUserLocalTimezone() || "UTC";
  }

  const isValidInitial = state.displayTimezones.some(
    (tz) => tz.timezone === initialTimezone,
  );
  if (!isValidInitial) {
    const userLocalInList = state.displayTimezones.find(
      (tz) => tz.timezone === getUserLocalTimezone(),
    );
    initialTimezone = userLocalInList
      ? userLocalInList.timezone
      : state.displayTimezones.length > 0
        ? state.displayTimezones[0].timezone
        : "UTC";
  }

  state.selectedTimezone = initialTimezone;
  elements.timezoneSelect.value = state.selectedTimezone;
  updateCityNameDisplay(state.selectedTimezone);

  localStorage.setItem(LOCAL_STORAGE_KEY_SELECTED_TIMEZONE, state.selectedTimezone);

  elements.timezoneSelect.addEventListener("change", (event) => {
    state.selectedTimezone = event.target.value;
    updateCityNameDisplay(state.selectedTimezone);
    localStorage.setItem(LOCAL_STORAGE_KEY_SELECTED_TIMEZONE, state.selectedTimezone);
  });
}

function updateCityNameDisplay(timezoneName) {
  if (elements.cityNameDisplay) {
    elements.cityNameDisplay.textContent = getCityNameByTimezone(timezoneName);
  }
}

function drawTicks() {
  if (!elements.ticks) return;
  elements.ticks.innerHTML = "";
  for (let i = 0; i < 60; i++) {
    const angle = i * 6;
    const isMajor = i % 5 === 0;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const radius = 95;
    const length = isMajor ? 10 : 5;

    line.setAttribute(
      "class",
      `tick common-clock-tick ${isMajor ? "major common-clock-tick-major" : ""}`,
    );
    line.setAttribute(
      "x1",
      (100 + Math.sin((angle * Math.PI) / 180) * (radius - length)).toString(),
    );
    line.setAttribute(
      "y1",
      (100 - Math.cos((angle * Math.PI) / 180) * (radius - length)).toString(),
    );
    line.setAttribute(
      "x2",
      (100 + Math.sin((angle * Math.PI) / 180) * radius).toString(),
    );
    line.setAttribute(
      "y2",
      (100 - Math.cos((angle * Math.PI) / 180) * radius).toString(),
    );
    elements.ticks.appendChild(line);

    if (isMajor) {
      const hourNumber = i / 5 === 0 ? 12 : i / 5;
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute(
        "x",
        (
          100 +
          Math.sin((angle * Math.PI) / 180) * (radius - length - 10)
        ).toString(),
      );
      text.setAttribute(
        "y",
        (
          100 -
          Math.cos((angle * Math.PI) / 180) * (radius - length - 10) +
          4
        ).toString(),
      );
      text.setAttribute("class", "hour-number");
      text.setAttribute("text-anchor", "middle");
      text.textContent = hourNumber.toString();
      elements.ticks.appendChild(text);
    }
  }
}

function drawAhPersonalizedSector(
  startAngleDegrees,
  originalSweepAngleDegrees,
) {
  if (!elements.ahSector || !elements.ahSectorIndicatorLine) return;

  const radius = 95;
  const cx = 100;
  const cy = 100;
  const displaySweepAngleDegrees = Math.min(originalSweepAngleDegrees, 359.999);

  if (displaySweepAngleDegrees <= 0.001) {
    elements.ahSector.setAttribute("d", "");
    elements.ahSectorIndicatorLine.style.display = "none";
    return;
  }

  const svgStartAngle = startAngleDegrees - 90;
  const svgDisplayEndAngle = svgStartAngle + displaySweepAngleDegrees;
  const startRad = (svgStartAngle * Math.PI) / 180;
  const endRad = (svgDisplayEndAngle * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  const largeArcFlag = displaySweepAngleDegrees > 180 ? 1 : 0;
  const d_sector = [
    `M ${cx},${cy}`,
    `L ${x1},${y1}`,
    `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`,
    "Z",
  ].join(" ");
  elements.ahSector.setAttribute("d", d_sector);

  if (originalSweepAngleDegrees > 360) {
    const indicatorAngleDegrees = originalSweepAngleDegrees % 360;
    const svgIndicatorAngle = (startAngleDegrees + indicatorAngleDegrees) - 90;
    const indicatorRad = (svgIndicatorAngle * Math.PI) / 180;
    const indicatorX = cx + radius * Math.cos(indicatorRad);
    const indicatorY = cy + radius * Math.sin(indicatorRad);
    elements.ahSectorIndicatorLine.setAttribute("x1", cx.toString());
    elements.ahSectorIndicatorLine.setAttribute("y1", cy.toString());
    elements.ahSectorIndicatorLine.setAttribute("x2", indicatorX.toString());
    elements.ahSectorIndicatorLine.setAttribute("y2", indicatorY.toString());
    elements.ahSectorIndicatorLine.style.display = "block";
  } else {
    elements.ahSectorIndicatorLine.style.display = "none";
  }
}

function updatePersonalizedClock() {
  if (!state.selectedTimezone || !elements.hands.hour) {
    state.animationFrameId = requestAnimationFrame(updatePersonalizedClock);
    return;
  }

  const currentNormalAphDayDurationMinutes = state.normalAphDayDurationMinutes;
  const now = new Date();
  const localTime = moment(now).tz(state.selectedTimezone);

  const {
    hourAngle,
    minuteAngle,
    secondAngle,
    aphHours,
    aphMinutes,
    aphSeconds,
    ahSectorStartAngleDegrees,
    ahSectorSweepAngleDegrees,
    isPersonalizedAhPeriod,
  } = getCustomAhAngles(
    now,
    state.selectedTimezone,
    currentNormalAphDayDurationMinutes,
  );

  elements.hands.hour.style.transform = `rotate(${hourAngle}deg)`;
  elements.hands.minute.style.transform = `rotate(${minuteAngle}deg)`;
  elements.hands.second.style.transform = `rotate(${secondAngle}deg)`;

  const aphTimeDisplayElement = elements.digitalAphTime;
  const actualTimeDisplayElement = elements.digitalNormalTime;
  const remainingTimeDisplayElement = elements.digitalAphRemaining;

  if (aphTimeDisplayElement) {
    aphTimeDisplayElement.textContent = `Designed 24: ${String(aphHours).padStart(2, "0")}:${String(aphMinutes).padStart(2, "0")}:${String(Math.floor(aphSeconds)).padStart(2, "0")}`;
  }
  if (actualTimeDisplayElement) {
    actualTimeDisplayElement.textContent = `Actual: ${localTime.format("HH:mm:ss")}`;
  }

  // Apply color theme based on period
  if (state.currentIsAhPeriod !== isPersonalizedAhPeriod) {
    state.currentIsAhPeriod = isPersonalizedAhPeriod;
    applyColorTheme(isPersonalizedAhPeriod, state.themeSettings.colorScaled24, state.themeSettings.colorAH);
  }

  if (isPersonalizedAhPeriod) {
    if (aphTimeDisplayElement) aphTimeDisplayElement.style.display = 'none';
    if (actualTimeDisplayElement) actualTimeDisplayElement.style.display = 'block';

    if (remainingTimeDisplayElement) {
      const totalRealMinutesInDay = 24 * 60;
      const aphPeriodTotalRealMinutes = totalRealMinutesInDay - currentNormalAphDayDurationMinutes;

      const aphStartDateTime = moment(localTime)
        .startOf("day")
        .add(currentNormalAphDayDurationMinutes, "minutes");
      const aphEndDateTime = moment(aphStartDateTime).add(
        aphPeriodTotalRealMinutes,
        "minutes",
      );
      const remainingRealMs = Math.max(0, aphEndDateTime.diff(localTime));

      if (remainingRealMs > 0) {
        const remainingSecondsTotal = Math.floor(remainingRealMs / 1000);
        const remainingH = Math.floor(remainingSecondsTotal / 3600);
        const remainingM = Math.floor((remainingSecondsTotal % 3600) / 60);
        const remainingS = remainingSecondsTotal % 60;
        remainingTimeDisplayElement.textContent = `APH Remaining: ${String(remainingH).padStart(2, "0")}:${String(remainingM).padStart(2, "0")}:${String(remainingS).padStart(2, "0")}`;
        remainingTimeDisplayElement.style.display = "block";
      } else {
        remainingTimeDisplayElement.textContent = `APH Remaining: 00:00:00`;
        remainingTimeDisplayElement.style.display = "block";
      }
    }

    if (elements.ahSector) {
      drawAhPersonalizedSector(ahSectorStartAngleDegrees, ahSectorSweepAngleDegrees);
      elements.ahSector.style.display = "block";
    }
    if (elements.personalizedAhTitle) {
      elements.personalizedAhTitle.textContent = "You are now in APH Period.";
    }
    // Remove manual inverted class - now handled by theme manager
    // document.body.classList.add("inverted");

  } else {
    if (aphTimeDisplayElement) aphTimeDisplayElement.style.display = 'block';
    if (actualTimeDisplayElement) actualTimeDisplayElement.style.display = 'block';
    if (remainingTimeDisplayElement) remainingTimeDisplayElement.style.display = 'none';

    if (elements.ahSector) {
      elements.ahSector.style.display = 'none';
      if (elements.ahSectorIndicatorLine) {
        elements.ahSectorIndicatorLine.style.display = 'none';
      }
    }
    if (elements.personalizedAhTitle) {
      elements.personalizedAhTitle.textContent = "Personalized AH Clock";
    }
    // Remove manual inverted class - now handled by theme manager
    // document.body.classList.remove("inverted");
  }

  state.animationFrameId = requestAnimationFrame(updatePersonalizedClock);
}

// --- Main Initialization ---
function initialize() {
  if (typeof moment === "undefined" || typeof moment.tz === "undefined") {
    console.error(
      "Moment.js and Moment Timezone are not loaded. Personalized AH Clock cannot be fully initialized.",
    );
    if (elements.cityNameDisplay)
      elements.cityNameDisplay.textContent = "Error: Time library not loaded.";
    return;
  }

  initializeTimezoneSelect();
  initializeSlider();
  drawTicks();
  initializeViewToggle();
  initializeThemes();

  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
  updatePersonalizedClock();
}

initialize();

window.addEventListener("unload", () => {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }
});