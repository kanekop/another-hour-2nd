import { getCustomAhAngles, convertToAHTime, isInDesigned24 } from '/vendor/@another-hour/core/core.browser.js';
import { getDisplayTimezones, getUserLocalTimezone, getCityNameByTimezone } from './js/timezone-manager.js';

// DOM Elements
const elements = {
  timezoneSelect: document.getElementById('timezone-select'),
  mainClockCityName: document.getElementById('main-clock-city-name'),
  digitalClock: document.getElementById('digital-clock'),
  toggleCheckbox: document.getElementById('toggle-ah-actual-display'),
  ahSector: document.getElementById('ah-sector'),
  ticks: document.getElementById('ticks'),
  hands: {
    hour: document.getElementById('hour'),
    minute: document.getElementById('minute'),
    second: document.getElementById('second')
  }
};

// Application State
const state = {
  settings: {
    showAHTime: true,
    showActualTime: true
  },
  selectedTimezone: '',
  displayTimezones: []
};

// Clock Drawing Functions
function drawTicks() {
  elements.ticks.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const angle = i * 6;
    const isMajor = i % 5 === 0;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const radius = 95;
    const length = isMajor ? 10 : 5;

    line.setAttribute('class', `tick common-clock-tick ${isMajor ? 'major common-clock-tick-major' : ''}`);
    line.setAttribute('x1', 100 + Math.sin(angle * Math.PI / 180) * (radius - length));
    line.setAttribute('y1', 100 - Math.cos(angle * Math.PI / 180) * (radius - length));
    line.setAttribute('x2', 100 + Math.sin(angle * Math.PI / 180) * radius);
    line.setAttribute('y2', 100 - Math.cos(angle * Math.PI / 180) * radius);
    elements.ticks.appendChild(line);
  }
}

function drawAhSector() {
  const startAngle = 270;
  const endAngle = 300;
  const radius = 95;
  const x1 = 100 + radius * Math.cos(startAngle * Math.PI / 180);
  const y1 = 100 + radius * Math.sin(startAngle * Math.PI / 180);
  const x2 = 100 + radius * Math.cos(endAngle * Math.PI / 180);
  const y2 = 100 + radius * Math.sin(endAngle * Math.PI / 180);
  elements.ahSector.setAttribute('d', `M 100,100 L ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} Z`);
}

// Timezone Functions
function getInitialTimezone() {
  const params = new URLSearchParams(window.location.search);
  const urlTimezone = params.get('timezone');
  return (urlTimezone && moment.tz.zone(urlTimezone)) ? urlTimezone : (getUserLocalTimezone() || 'UTC');
}

function initializeTimezoneSelect() {
  state.displayTimezones = getDisplayTimezones();
  elements.timezoneSelect.innerHTML = '';

  state.displayTimezones.forEach(tzData => {
    const option = document.createElement('option');
    option.value = tzData.timezone;
    option.text = tzData.displayText;
    elements.timezoneSelect.appendChild(option);
  });

  state.selectedTimezone = getInitialTimezone();
  const isValidInitial = state.displayTimezones.some(tz => tz.timezone === state.selectedTimezone);

  if (!isValidInitial) {
    const userLocal = getUserLocalTimezone();
    const userLocalInList = state.displayTimezones.find(tz => tz.timezone === userLocal);
    state.selectedTimezone = userLocalInList ? userLocal :
      (state.displayTimezones.length > 0 ? state.displayTimezones[0].timezone : 'UTC');
  }

  elements.timezoneSelect.value = state.selectedTimezone;
  updateMainClockCityName(state.selectedTimezone);
}

function updateMainClockCityName(timezoneName) {
  if (elements.mainClockCityName) {
    elements.mainClockCityName.textContent = getCityNameByTimezone(timezoneName);
  }
}

// Clock Update Function
function updateClock() {
  const currentSelectedTimezone = elements.timezoneSelect.value;
  if (!currentSelectedTimezone) {
    requestAnimationFrame(updateClock);
    return;
  }

  const realTime = moment().tz(currentSelectedTimezone).toDate();

  // Define the parameters for the core calculation, replicating the old logic (23h day)
  const designed24Duration = 23;
  const d24StartTime = moment(realTime).tz(currentSelectedTimezone).startOf('day').toDate();

  // Use the new core functions
  const { hourAngle, minuteAngle } = getCustomAhAngles(realTime, designed24Duration, d24StartTime);
  const { hours: ahHours, minutes: ahMinutes } = convertToAHTime(realTime, designed24Duration, d24StartTime);
  const inD24 = isInDesigned24(realTime, designed24Duration, d24StartTime);

  // The new core logic doesn't scale seconds, so we use real seconds for a smooth sweep
  const secondAngle = (realTime.getSeconds() / 60) * 360;
  const ahSeconds = realTime.getSeconds(); // In AH period, time is 1:1, so seconds are the same.

  const isAHHour = !inD24; // The "Another Hour" is when we are NOT in the designed 24 period
  document.body.classList.toggle('inverted', isAHHour);
  elements.ahSector.style.display = isAHHour ? 'block' : 'none';

  // Update clock hands
  document.getElementById('hour-hand').style.transform = `