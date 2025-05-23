// public/js/scheduler-ui.js

import { getCustomAhAngles } from '../clock-core.js';
import { getCurrentScalingInfo } from './scaling-utils.js';

// Constants
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS_TO_DISPLAY = 24;

// State
const state = {
  currentWeekStart: null,
  timeMode: 'ah', // 'ah', 'real', or 'both'
  events: [],
  selectedTimezone: null,
  isAuthenticated: false
};

// DOM Elements
const elements = {
  calendarGrid: document.getElementById('calendar-grid'),
  currentWeekDisplay: document.getElementById('current-week-display'),
  prevWeekBtn: document.getElementById('prev-week'),
  nextWeekBtn: document.getElementById('next-week'),
  syncStatus: document.getElementById('sync-status'),
  syncCalendarBtn: document.getElementById('sync-calendar-btn'),
  eventDetails: document.getElementById('event-details'),
  eventInfo: document.getElementById('event-info'),
  timeModeRadios: document.querySelectorAll('input[name="time-mode"]')
};

// Initialize
function initialize() {
  // Get user's timezone
  state.selectedTimezone = moment.tz.guess() || 'UTC';

  // Set current week
  const now = moment().tz(state.selectedTimezone);
  state.currentWeekStart = now.clone().startOf('week');

  // Set up event listeners
  setupEventListeners();

  // Check authentication status
  checkAuthStatus();

  // Render calendar
  renderCalendar();

  // Update week display
  updateWeekDisplay();
}

// Set up event listeners
function setupEventListeners() {
  // Week navigation
  elements.prevWeekBtn.addEventListener('click', () => navigateWeek(-1));
  elements.nextWeekBtn.addEventListener('click', () => navigateWeek(1));

  // Time mode toggle
  elements.timeModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      state.timeMode = e.target.value;
      renderCalendar();
    });
  });

  // Calendar sync button
  elements.syncCalendarBtn.addEventListener('click', () => {
    if (state.isAuthenticated) {
      // If authenticated, show calendar selection
      window.location.href = '/pages/calendar-sync.html';
    } else {
      // Start OAuth flow
      initiateGoogleAuth();
    }
  });
}

// Navigate weeks
function navigateWeek(direction) {
  state.currentWeekStart.add(direction, 'week');
  updateWeekDisplay();
  renderCalendar();
  loadEvents();
}

// Update week display
function updateWeekDisplay() {
  const weekStart = state.currentWeekStart.format('MMM D');
  const weekEnd = state.currentWeekStart.clone().endOf('week').format('MMM D, YYYY');
  elements.currentWeekDisplay.textContent = `Week of ${weekStart} - ${weekEnd}`;
}

// Render calendar grid
function renderCalendar() {
  elements.calendarGrid.innerHTML = '';

  // Add header row
  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-header';
  headerRow.textContent = 'Time';
  elements.calendarGrid.appendChild(headerRow);

  // Add day headers
  for (let i = 0; i < 7; i++) {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-header';
    const dayDate = state.currentWeekStart.clone().add(i, 'days');
    dayHeader.innerHTML = `${DAYS_OF_WEEK[i]}<br>${dayDate.format('M/D')}`;
    elements.calendarGrid.appendChild(dayHeader);
  }

  // Add time slots and event cells
  for (let hour = 0; hour < HOURS_TO_DISPLAY; hour++) {
    // Time slot
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = formatTimeSlot(hour);
    elements.calendarGrid.appendChild(timeSlot);

    // Event cells for each day
    for (let day = 0; day < 7; day++) {
      const eventCell = document.createElement('div');
      eventCell.className = 'event-cell';
      eventCell.dataset.hour = hour;
      eventCell.dataset.day = day;

      // Add events for this time slot
      const cellEvents = getEventsForCell(day, hour);
      cellEvents.forEach(event => {
        const eventEl = createEventElement(event);
        eventCell.appendChild(eventEl);
      });

      elements.calendarGrid.appendChild(eventCell);
    }
  }
}

// Format time slot based on mode
function formatTimeSlot(hour) {
  const realTime = `${hour.toString().padStart(2, '0')}:00`;

  if (state.timeMode === 'real') {
    return realTime;
  }

  // Calculate AH time
  const { scaleFactor, isAhPeriod } = getCurrentScalingInfo();
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  const angles = getCustomAhAngles(
    date,
    state.selectedTimezone,
    localStorage.getItem('personalizedAhDurationMinutes') || 1380
  );

  const ahTime = `${Math.floor(angles.aphHours).toString().padStart(2, '0')}:00`;

  if (state.timeMode === 'ah') {
    return `AH ${ahTime}`;
  } else {
    return `${realTime}\nAH ${ahTime}`;
  }
}

// Get events for a specific cell
function getEventsForCell(day, hour) {
  const cellDate = state.currentWeekStart.clone().add(day, 'days').hour(hour);

  return state.events.filter(event => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);

    return cellDate.isSameOrAfter(eventStart) && cellDate.isBefore(eventEnd);
  });
}

// Create event element
function createEventElement(event) {
  const eventEl = document.createElement('div');
  eventEl.className = 'calendar-event';
  eventEl.textContent = event.title;

  // Add click handler
  eventEl.addEventListener('click', () => showEventDetails(event));

  return eventEl;
}

// Show event details
function showEventDetails(event) {
  elements.eventDetails.style.display = 'block';

  const startTime = moment(event.start);
  const endTime = moment(event.end);

  // Calculate AH times
  const { scaleFactor } = getCurrentScalingInfo();
  // This is simplified - you'd need proper AH time conversion

  elements.eventInfo.innerHTML = `
    <div class="event-info-row">
      <span class="event-info-label">Title:</span>
      <span>${event.title}</span>
    </div>
    <div class="event-info-row">
      <span class="event-info-label">Real Time:</span>
      <span>${startTime.format('MMM D, h:mm A')} - ${endTime.format('h:mm A')}</span>
    </div>
    <div class="event-info-row">
      <span class="event-info-label">AH Time:</span>
      <span>[AH time calculation needed]</span>
    </div>
    ${event.description ? `
    <div class="event-info-row">
      <span class="event-info-label">Description:</span>
      <span>${event.description}</span>
    </div>
    ` : ''}
    ${event.location ? `
    <div class="event-info-row">
      <span class="event-info-label">Location:</span>
      <span>${event.location}</span>
    </div>
    ` : ''}
  `;
}

// Check authentication status
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/calendar/google/status');
    const data = await response.json();

    state.isAuthenticated = data.authenticated;
    updateSyncStatus();

    if (state.isAuthenticated) {
      loadEvents();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    state.isAuthenticated = false;
    updateSyncStatus();
  }
}

// Update sync status display
function updateSyncStatus() {
  if (state.isAuthenticated) {
    elements.syncStatus.innerHTML = `
      <p class="sync-connected">
        <span class="status-icon">✅</span>
        Google Calendar connected
      </p>
      <button id="sync-calendar-btn" class="primary-button">
        Manage Calendars
      </button>
    `;
  } else {
    elements.syncStatus.innerHTML = `
      <p class="sync-not-connected">
        <span class="status-icon">⚠️</span>
        No calendars connected
      </p>
      <button id="sync-calendar-btn" class="primary-button">
        Connect Google Calendar
      </button>
    `;
  }

  // Re-attach event listener
  document.getElementById('sync-calendar-btn').addEventListener('click', () => {
    if (state.isAuthenticated) {
      window.location.href = '/pages/calendar-sync.html';
    } else {
      initiateGoogleAuth();
    }
  });
}

// Initiate Google authentication
async function initiateGoogleAuth() {
  try {
    const response = await fetch('/api/calendar/google/auth-url');
    const data = await response.json();

    if (data.authUrl) {
      // Open auth URL in new window
      const authWindow = window.open(data.authUrl, 'GoogleAuth', 'width=500,height=600');

      // Listen for auth completion
      window.addEventListener('message', (event) => {
        if (event.data.type === 'google-auth-success') {
          authWindow.close();
          state.isAuthenticated = true;
          updateSyncStatus();
          loadEvents();
        }
      });
    }
  } catch (error) {
    console.error('Error initiating auth:', error);
    alert('Failed to start authentication. Please try again.');
  }
}

// Load events from calendar
async function loadEvents() {
  if (!state.isAuthenticated) return;

  try {
    const weekStart = state.currentWeekStart.toISOString();
    const weekEnd = state.currentWeekStart.clone().endOf('week').toISOString();

    const response = await fetch('/api/calendar/google/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin: weekStart,
        timeMax: weekEnd
      })
    });

    const data = await response.json();

    if (data.success) {
      state.events = data.events;
      renderCalendar();
    }
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

// Initialize the application
initialize();
