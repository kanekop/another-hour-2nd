
import { SCALE_AH, getAngles } from './clock-core.js';
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

  const currentTime = moment().tz(currentSelectedTimezone);
  const { hourAngle, minuteAngle, secondAngle, ahHours, ahMinutes, ahSeconds } = 
    getAngles(currentTime.toDate(), currentSelectedTimezone);

  const isAHHour = currentTime.hours() === 23;
  document.body.classList.toggle('inverted', isAHHour);
  elements.ahSector.style.display = isAHHour ? 'block' : 'none';

  // Update clock hands
  if (elements.hands.hour) elements.hands.hour.style.transform = `rotate(${hourAngle}deg)`;
  if (elements.hands.minute) elements.hands.minute.style.transform = `rotate(${minuteAngle}deg)`;
  if (elements.hands.second) elements.hands.second.style.transform = `rotate(${secondAngle}deg)`;

  // Update digital display
  const mainAhTimeDiv = document.getElementById('main-ah-time');
  const mainNormalTimeDiv = document.getElementById('main-normal-time');
  const isDigitalClockVisible = elements.digitalClock && 
    !elements.digitalClock.classList.contains('visually-hidden');

  if (isDigitalClockVisible) {
    const actualTimeFormatted = currentTime.format('HH:mm:ss');
    const ahTimeFormatted = `${String(Math.floor(ahHours)).padStart(2, '0')}:${String(Math.floor(ahMinutes)).padStart(2, '0')}:${String(Math.floor(ahSeconds)).padStart(2, '0')}`;

    if (state.settings.showAHTime && mainAhTimeDiv) {
      mainAhTimeDiv.textContent = `AH: ${ahTimeFormatted}`;
      mainAhTimeDiv.style.display = 'block';
    } else if (mainAhTimeDiv) {
      mainAhTimeDiv.style.display = 'none';
    }

    if (state.settings.showActualTime && mainNormalTimeDiv) {
      mainNormalTimeDiv.textContent = `Actual: ${actualTimeFormatted}`;
      mainNormalTimeDiv.style.display = 'block';
    } else if (mainNormalTimeDiv) {
      mainNormalTimeDiv.style.display = 'none';
    }
  }

  requestAnimationFrame(updateClock);
}

// Event Listeners
function initializeEventListeners() {
  elements.timezoneSelect.addEventListener('change', (event) => {
    state.selectedTimezone = event.target.value;
    updateMainClockCityName(state.selectedTimezone);
  });

  const allTimeZoneButton = document.getElementById('all-time-zone-button');
  if (allTimeZoneButton) {
    allTimeZoneButton.addEventListener('click', () => {
      window.location.href = '/pages/world-clock.html';
    });
  }
}

// Initialization
function initializeApplication() {
  fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
      state.settings.showAHTime = data.showAHTime !== undefined ? data.showAHTime : true;
      state.settings.showActualTime = data.showActualTime !== undefined ? data.showActualTime : true;

      initializeTimezoneSelect();
      drawTicks();
      drawAhSector();

      if (elements.toggleCheckbox) {
        const shouldBeCheckedByDefault = state.settings.showAHTime || state.settings.showActualTime;
        elements.toggleCheckbox.checked = shouldBeCheckedByDefault;
        if (elements.digitalClock) {
          elements.digitalClock.classList.toggle('visually-hidden', !shouldBeCheckedByDefault);
        }

        // Set initial display state
        const mainAhTimeDiv = document.getElementById('main-ah-time');
        const mainNormalTimeDiv = document.getElementById('main-normal-time');
        if (mainAhTimeDiv) mainAhTimeDiv.style.display = state.settings.showAHTime ? 'block' : 'none';
        if (mainNormalTimeDiv) mainNormalTimeDiv.style.display = state.settings.showActualTime ? 'block' : 'none';

        elements.toggleCheckbox.addEventListener('change', () => {
          const isChecked = elements.toggleCheckbox.checked;
          
          // Toggle both time displays
          if (elements.digitalClock) {
            elements.digitalClock.classList.toggle('visually-hidden', !isChecked);
          }
          
          if (mainAhTimeDiv) {
            state.settings.showAHTime = isChecked;
            mainAhTimeDiv.style.display = isChecked ? 'block' : 'none';
          }
          
          if (mainNormalTimeDiv) {
            state.settings.showActualTime = isChecked;
            mainNormalTimeDiv.style.display = isChecked ? 'block' : 'none';
          }

          // Save settings
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state.settings)
          }).catch(err => console.error('Failed to save settings:', err));
        });
      }

      initializeEventListeners();
      updateClock();
    })
    .catch(error => {
      console.error("Failed to load settings, using defaults:", error);
      initializeTimezoneSelect();
      drawTicks();
      drawAhSector();
      
      if (elements.toggleCheckbox) {
        elements.toggleCheckbox.checked = true;
        if (elements.digitalClock) {
          elements.digitalClock.classList.remove('visually-hidden');
        }
        elements.toggleCheckbox.dispatchEvent(new Event('change'));
      }
      
      initializeEventListeners();
      updateClock();
    });
}

// Start the application
initializeApplication();
