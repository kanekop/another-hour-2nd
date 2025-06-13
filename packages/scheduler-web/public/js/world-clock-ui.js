
// public/js/world-clock-ui.js
import { SCALE_AH, getAngles } from '../clock-core.js';
import { getDisplayTimezones, getUserLocalTimezone } from './timezone-manager.js';

// Constants
const CLOCK_UPDATE_INTERVAL = 1000 / 60; // 60fps for smooth animation
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const SVG_VIEW_BOX = "0 0 200 200";

// State
const state = {
  container: document.getElementById('world-clocks-container'),
  worldTimezones: [],
  userLocalTimezone: null,
  animationFrameId: null
};

// SVG Creation Helpers
function createSVGElement(type, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, type);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

function createAnalogClockFace(timezoneIdSuffix) {
  const analogClockSVG = createSVGElement("svg", {
    class: "analog-clock-world",
    viewBox: SVG_VIEW_BOX
  });

  // Clock face circle
  analogClockSVG.appendChild(createSVGElement("circle", {
    class: "analog-face-world common-clock-face",
    cx: "100",
    cy: "100",
    r: "95"
  }));

  // Tick marks
  const ticksGroup = createSVGElement("g", { class: "analog-ticks-world" });
  for (let i = 0; i < 12; i++) {
    ticksGroup.appendChild(createSVGElement("line", {
      class: "common-clock-tick common-clock-tick-major",
      x1: "100",
      y1: "15",
      x2: "100",
      y2: "25",
      transform: `rotate(${i * 30}, 100, 100)`
    }));
  }
  analogClockSVG.appendChild(ticksGroup);

  // Clock hands
  const hands = {
    hour: createSVGElement("line", {
      id: `hour-hand-${timezoneIdSuffix}`,
      class: "analog-hand-world hour-world common-clock-hand common-clock-hand-hour",
      x1: "100",
      y1: "100",
      x2: "100",
      y2: "60"
    }),
    minute: createSVGElement("line", {
      id: `minute-hand-${timezoneIdSuffix}`,
      class: "analog-hand-world minute-world common-clock-hand common-clock-hand-minute",
      x1: "100",
      y1: "100",
      x2: "100",
      y2: "40"
    }),
    second: createSVGElement("line", {
      id: `second-hand-${timezoneIdSuffix}`,
      class: "analog-hand-world second-world common-clock-hand common-clock-hand-second",
      x1: "100",
      y1: "100",
      x2: "100",
      y2: "30"
    })
  };

  Object.values(hands).forEach(hand => analogClockSVG.appendChild(hand));

  // Center dot
  analogClockSVG.appendChild(createSVGElement("circle", {
    class: "analog-center-world common-clock-center",
    cx: "100",
    cy: "100",
    r: "4"
  }));

  return analogClockSVG;
}

function createClockElement(tzData) {
  const clockItem = document.createElement('div');
  clockItem.classList.add('world-clock-item');
  clockItem.dataset.timezone = tzData.timezone;

  const cityNameElement = document.createElement('h3');
  cityNameElement.textContent = tzData.city;
  if (tzData.timezone === state.userLocalTimezone) {
    cityNameElement.classList.add('user-local-timezone-city');
  }

  const ahTimeDisplay = document.createElement('div');
  ahTimeDisplay.classList.add('ah-time-display-main');
  ahTimeDisplay.id = `ah-time-${tzData.timezone.replace(/[\/\+\:]/g, '-')}`;

  const normalTimeDisplay = document.createElement('div');
  normalTimeDisplay.classList.add('normal-time-display-sub');
  normalTimeDisplay.id = `time-${tzData.timezone.replace(/[\/\+\:]/g, '-')}`;

  const analogClockSVG = createAnalogClockFace(tzData.timezone.replace(/[\/\+\:]/g, '-'));

  clockItem.append(cityNameElement, ahTimeDisplay, normalTimeDisplay, analogClockSVG);

  clockItem.addEventListener('click', () => {
    window.location.href = `/pages/main-clock.html?timezone=${encodeURIComponent(tzData.timezone)}`;
  });

  return clockItem;
}

function getAhDigitalTime(dateObject, timezone) {
  const localTime = moment(dateObject).tz(timezone);
  const hours = localTime.hours();
  const minutes = localTime.minutes();
  const seconds = localTime.seconds();
  const milliseconds = localTime.milliseconds();

  const isAHHourForThisTimezone = hours === 23;
  const totalMs = ((hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds);
  const scaledMs = isAHHourForThisTimezone ? totalMs : totalMs * SCALE_AH;

  return {
    ahHours: isAHHourForThisTimezone ? 24 : Math.floor((scaledMs / (1000 * 3600)) % 24),
    ahMinutes: Math.floor((scaledMs / (1000 * 60)) % 60),
    ahSeconds: (scaledMs / 1000) % 60,
    isAHHour: isAHHourForThisTimezone
  };
}

function updateWorldClockTime(tzData) {
  const now = new Date();
  const timezoneIdSuffix = tzData.timezone.replace(/[\/\+\:]/g, '-');

  // Update digital displays
  const normalTimeEl = document.getElementById(`time-${timezoneIdSuffix}`);
  if (normalTimeEl) {
    normalTimeEl.textContent = moment(now).tz(tzData.timezone).format('HH:mm:ss');
  }

  const { ahHours, ahMinutes, ahSeconds, isAHHour } = getAhDigitalTime(now, tzData.timezone);
  const ahTimeEl = document.getElementById(`ah-time-${timezoneIdSuffix}`);
  if (ahTimeEl) {
    const ahTimeString = `AH: ${String(Math.floor(ahHours)).padStart(2, '0')}:${String(Math.floor(ahMinutes)).padStart(2, '0')}:${String(Math.floor(ahSeconds)).padStart(2, '0')}`;
    ahTimeEl.textContent = ahTimeString;
  }

  // Update analog clock hands
  const angles = getAngles(now, tzData.timezone);
  ['hour', 'minute', 'second'].forEach(hand => {
    const element = document.getElementById(`${hand}-hand-${timezoneIdSuffix}`);
    if (element) {
      element.style.transform = `rotate(${angles[`${hand}Angle`]}deg)`;
    }
  });

  // Update AH state
  const clockItem = document.querySelector(`[data-timezone="${tzData.timezone}"]`);
  if (clockItem) {
    clockItem.classList.toggle('blinking-ah', isAHHour);
  }
}

function updateAllClocksLoop() {
  state.worldTimezones.forEach(updateWorldClockTime);
  state.animationFrameId = requestAnimationFrame(updateAllClocksLoop);
}

function initializeWorldClocks() {
  if (!state.container) {
    console.error('Error: world-clocks-container element not found in HTML.');
    return;
  }

  if (typeof moment === 'undefined' || typeof moment.tz === 'undefined') {
    console.error("Moment.js and Moment Timezone are not loaded. World clocks cannot be initialized.");
    state.container.innerHTML = '<p>Error: Time library not loaded. World clocks cannot be displayed.</p>';
    return;
  }

  state.userLocalTimezone = getUserLocalTimezone();
  state.worldTimezones = getDisplayTimezones();

  if (state.worldTimezones.length === 0) {
    state.container.innerHTML = '<p>No timezones available to display.</p>';
    console.error('World timezones list is empty after initialization.');
    return;
  }

  state.container.innerHTML = '';
  state.worldTimezones.forEach(tzData => {
    state.container.appendChild(createClockElement(tzData));
  });

  updateAllClocksLoop();
}

// Cleanup function for animation frame
window.addEventListener('unload', () => {
  if (state.animationFrameId) {
    cancelAnimationFrame(state.animationFrameId);
  }
});

// Initialize the application
initializeWorldClocks();
