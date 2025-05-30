// public/js/scheduler-ui(copy).js

import { getCustomAhAngles } from '../clock-core.js';
import { getCurrentScalingInfo } from './scaling-utils.js';

// Constants
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// State
const state = {
  currentWeekStart: null,
  timeMode: 'ah', // 'ah', 'real', or 'both'
  events: [],
  selectedTimezone: null,
  isAuthenticated: false,
  normalAphDayDurationMinutes: 1380, // Default 23 hours
  scaleFactor: 24/23
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
  state.selectedTimezone = localStorage.getItem('personalizedAhSelectedTimezone') || moment.tz.guess() || 'UTC';

  // Get AH duration from localStorage
  const savedDuration = localStorage.getItem('personalizedAhDurationMinutes');
  if (savedDuration) {
    state.normalAphDayDurationMinutes = parseInt(savedDuration, 10);
  }

  // Calculate scale factor
  updateScaleFactor();

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

  // Listen for storage changes (when user updates AH duration in clock settings)
  window.addEventListener('storage', (e) => {
    if (e.key === 'personalizedAhDurationMinutes') {
      state.normalAphDayDurationMinutes = parseInt(e.newValue, 10);
      updateScaleFactor();
      renderCalendar();
    }
  });
}

// Update scale factor based on AH duration
function updateScaleFactor() {
  const normalHours = state.normalAphDayDurationMinutes / 60;
  if (normalHours === 0) {
    state.scaleFactor = 1;
  } else {
    state.scaleFactor = 24 / normalHours;
  }
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

// Get time slots for display based on mode and AH settings
function getTimeSlots() {
  const slots = [];

  if (state.timeMode === 'real') {
    // Real time: simple 24 hours
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        label: `${hour.toString().padStart(2, '0')}:00`,
        realHour: hour,
        isAH: false
      });
    }
  } else {
    // AH or Both mode: need to calculate based on AH settings
    const normalDurationHours = state.normalAphDayDurationMinutes / 60;
    const ahDurationHours = 24 - normalDurationHours;

    // Designed 24 hours (0-23)
    for (let ahHour = 0; ahHour < 24; ahHour++) {
      const realHour = ahHour / state.scaleFactor;
      if (realHour < normalDurationHours) {
        const label = state.timeMode === 'both' 
          ? `AH ${ahHour}:00\n(${formatRealTime(realHour)})`
          : `AH ${ahHour}:00`;

        slots.push({
          label: label,
          realHour: realHour,
          ahHour: ahHour,
          isAH: false,
          isScaled: true
        });
      }
    }

    // Another Hour period (24+)
    if (ahDurationHours > 0) {
      // Add AH 24 marker
      slots.push({
        label: state.timeMode === 'both' 
          ? `AH 24:00\n(${formatRealTime(normalDurationHours)})`
          : `AH 24:00`,
        realHour: normalDurationHours,
        ahHour: 24,
        isAH: true,
        isAHStart: true
      });

      // Add remaining AH hours
      for (let i = 1; i < Math.floor(ahDurationHours); i++) {
        const realHour = normalDurationHours + i;
        const ahHour = 24 + i;
        const label = state.timeMode === 'both' 
          ? `AH ${ahHour}:00\n(${formatRealTime(realHour)})`
          : `AH ${ahHour}:00`;

        slots.push({
          label: label,
          realHour: realHour,
          ahHour: ahHour,
          isAH: true
        });
      }
    }
  }

  return slots;
}

// Format real time from decimal hours
function formatRealTime(decimalHours) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// Process events to determine their layout positions
function processEventsForLayout(events, dayIndex) {
  // Sort events by start time, then by duration (longer events first)
  const sortedEvents = events.sort((a, b) => {
    const startDiff = moment(a.start).valueOf() - moment(b.start).valueOf();
    if (startDiff !== 0) return startDiff;

    // If start times are equal, put longer events first
    const durationA = moment(a.end).valueOf() - moment(a.start).valueOf();
    const durationB = moment(b.end).valueOf() - moment(b.start).valueOf();
    return durationB - durationA;
  });

  // Create collision groups using a more sophisticated algorithm
  const processedEvents = [];
  const columns = []; // Array of arrays, each sub-array is a column

  sortedEvents.forEach(event => {
    const eventStart = moment(event.start).valueOf();
    const eventEnd = moment(event.end).valueOf();

    // Find the first available column for this event
    let columnIndex = -1;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      let canFitInColumn = true;

      // Check if this event collides with any event in this column
      for (const existingEvent of column) {
        const existingStart = moment(existingEvent.start).valueOf();
        const existingEnd = moment(existingEvent.end).valueOf();

        if (!(eventEnd <= existingStart || eventStart >= existingEnd)) {
          canFitInColumn = false;
          break;
        }
      }

      if (canFitInColumn) {
        columnIndex = i;
        break;
      }
    }

    // If no existing column can fit this event, create a new column
    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push([]);
    }

    // Add event to the column
    columns[columnIndex].push(event);

    // Store column information with the event
    processedEvents.push({
      ...event,
      column: columnIndex,
      totalColumns: 1 // Will be updated after all events are placed
    });
  });

  // Now determine collision groups and update totalColumns
  processedEvents.forEach((event, index) => {
    const eventStart = moment(event.start).valueOf();
    const eventEnd = moment(event.end).valueOf();

    // Find all events that overlap with this event
    const overlappingEvents = processedEvents.filter((other, otherIndex) => {
      if (index === otherIndex) return false;
      const otherStart = moment(other.start).valueOf();
      const otherEnd = moment(other.end).valueOf();
      return !(eventEnd <= otherStart || eventStart >= otherEnd);
    });

    // Find the maximum column index among overlapping events
    let maxColumn = event.column;
    overlappingEvents.forEach(other => {
      maxColumn = Math.max(maxColumn, other.column);
    });

    // Total columns is the highest column index + 1
    event.totalColumns = maxColumn + 1;
  });

  // Propagate totalColumns to all events in the same collision group
  processedEvents.forEach(event => {
    const eventStart = moment(event.start).valueOf();
    const eventEnd = moment(event.end).valueOf();

    processedEvents.forEach(other => {
      const otherStart = moment(other.start).valueOf();
      const otherEnd = moment(other.end).valueOf();

      if (!(eventEnd <= otherStart || eventStart >= otherEnd)) {
        other.totalColumns = Math.max(other.totalColumns, event.totalColumns);
      }
    });
  });

  return processedEvents;
}

// Render calendar grid with improved event layout
function renderCalendar() {
  // Clear existing content
  elements.calendarGrid.innerHTML = '';

  // Create wrapper structure for sticky header
  const scrollWrapper = document.createElement('div');
  scrollWrapper.className = 'calendar-scroll-wrapper';

  const headerRow = document.createElement('div');
  headerRow.className = 'calendar-header-row';

  const contentArea = document.createElement('div');
  contentArea.className = 'calendar-content';

  // Get time slots based on current mode
  const timeSlots = getTimeSlots();

  // Update grid template for content area
  const rowCount = timeSlots.length;
  contentArea.style.gridTemplateRows = `repeat(${rowCount}, minmax(40px, 1fr))`;

  // Add headers to header row
  const timeHeader = document.createElement('div');
  timeHeader.className = 'calendar-header';
  timeHeader.textContent = 'Time';
  headerRow.appendChild(timeHeader);

  // Add day headers
  for (let i = 0; i < 7; i++) {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-header';
    const dayDate = state.currentWeekStart.clone().add(i, 'days');
    dayHeader.innerHTML = `${DAYS_OF_WEEK[i]}<br>${dayDate.format('M/D')}`;
    headerRow.appendChild(dayHeader);
  }

  // Add time slots and event cells to content area
  timeSlots.forEach((slot, slotIndex) => {
    // Time slot
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    if (slot.isAH) {
      timeSlot.classList.add('ah-period');
    }
    if (slot.isAHStart) {
      timeSlot.classList.add('ah-start');
    }

    // Handle multi-line labels for "both" mode
    if (slot.label.includes('\n')) {
      const lines = slot.label.split('\n');
      timeSlot.innerHTML = `${lines[0]}<br><small>${lines[1]}</small>`;
    } else {
      timeSlot.textContent = slot.label;
    }

    contentArea.appendChild(timeSlot);

    // Event cells for each day
    for (let day = 0; day < 7; day++) {
      const eventCell = document.createElement('div');
      eventCell.className = 'event-cell';
      if (slot.isAH) {
        eventCell.classList.add('ah-period');
      }
      eventCell.dataset.realHour = slot.realHour;
      eventCell.dataset.day = day;
      eventCell.dataset.slotIndex = slotIndex;
      if (slot.ahHour !== undefined) {
        eventCell.dataset.ahHour = slot.ahHour;
      }

      contentArea.appendChild(eventCell);
    }
  });

  // Assemble the structure
  scrollWrapper.appendChild(headerRow);
  scrollWrapper.appendChild(contentArea);

  // Replace calendar grid content
  elements.calendarGrid.appendChild(scrollWrapper);

  // Add scroll event listener for shadow effect
  scrollWrapper.addEventListener('scroll', () => {
    if (scrollWrapper.scrollTop > 0) {
      scrollWrapper.classList.add('scrolled');
    } else {
      scrollWrapper.classList.remove('scrolled');
    }
  });

  // Store reference to content area for event rendering
  elements.calendarContent = contentArea;

  // Render all events after grid is complete
  renderAllEvents(timeSlots);
}

// Render all events with proper multi-hour support
function renderAllEvents(timeSlots) {
  // Process all events, including multi-day events
  state.events.forEach(event => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const weekStart = state.currentWeekStart;
    const weekEnd = state.currentWeekStart.clone().endOf('week');

    // Skip events outside current week
    if (eventEnd.isBefore(weekStart) || eventStart.isAfter(weekEnd)) {
      return;
    }

    // Calculate actual start and end within the week
    const displayStart = moment.max(eventStart, weekStart);
    const displayEnd = moment.min(eventEnd, weekEnd);

    // Check if event spans multiple days
    const startDay = displayStart.diff(weekStart, 'days');
    const endDay = displayEnd.diff(weekStart, 'days');

    if (startDay === endDay) {
      // Single day event
      if (startDay >= 0 && startDay < 7) {
        renderMultiHourEvent({
          ...event,
          displayStart: displayStart.toISOString(),
          displayEnd: displayEnd.toISOString()
        }, startDay, timeSlots);
      }
    } else {
      // Multi-day event - split into daily segments
      for (let day = startDay; day <= endDay && day < 7; day++) {
        if (day < 0) continue;

        const dayStart = weekStart.clone().add(day, 'days').startOf('day');
        const dayEnd = dayStart.clone().endOf('day');

        const segmentStart = day === startDay ? displayStart : dayStart;
        const segmentEnd = day === endDay ? displayEnd : dayEnd;

        renderMultiHourEvent({
          ...event,
          displayStart: segmentStart.toISOString(),
          displayEnd: segmentEnd.toISOString(),
          isMultiDay: true,
          isFirstDay: day === startDay,
          isLastDay: day === endDay
        }, day, timeSlots);
      }
    }
  });
}

// Render a single event that may span multiple hours
function renderMultiHourEvent(event, dayIndex, timeSlots) {
  // Use display times if available (for multi-day events)
  const eventStart = moment(event.displayStart || event.start);
  const eventEnd = moment(event.displayEnd || event.end);

  // Find start and end slot indices
  const startHour = eventStart.hour() + eventStart.minute() / 60;
  const endHour = eventEnd.hour() + eventEnd.minute() / 60;

  let startSlotIndex = -1;
  let endSlotIndex = -1;

  // Find the slots this event spans
  timeSlots.forEach((slot, index) => {
    if (startSlotIndex === -1 && slot.realHour <= startHour && 
        (index === timeSlots.length - 1 || timeSlots[index + 1].realHour > startHour)) {
      startSlotIndex = index;
    }
    if (slot.realHour < endHour) {
      endSlotIndex = index;
    }
  });

  // Handle all-day or events starting at midnight
  if (startSlotIndex === -1 && startHour === 0) {
    startSlotIndex = 0;
  }

  // Handle events ending at midnight
  if (endSlotIndex === -1 && endHour === 0) {
    endSlotIndex = timeSlots.length - 1;
  }

  if (startSlotIndex === -1 || endSlotIndex === -1) {
    console.warn('Could not find time slot for event:', event.title, { startHour, endHour, startSlotIndex, endSlotIndex });
    return;
  }

  // Create the event element
  const eventEl = document.createElement('div');
  eventEl.className = 'calendar-event multi-hour-event';

  // Add multi-day class if applicable
  if (event.isMultiDay) {
    eventEl.classList.add('multi-day-event');
    if (event.isFirstDay) eventEl.classList.add('first-day');
    if (event.isLastDay) eventEl.classList.add('last-day');
  }

  // Add column class for styling
  if (event.totalColumns > 1) {
    eventEl.classList.add(`columns-${event.totalColumns}`);
    eventEl.classList.add(`column-${event.column}`);
  }

  // Find the cells for positioning
  const startCell = document.querySelector(
    `.event-cell[data-day="${dayIndex}"][data-slot-index="${startSlotIndex}"]`
  );
  const endCell = document.querySelector(
    `.event-cell[data-day="${dayIndex}"][data-slot-index="${endSlotIndex}"]`
  );

  if (!startCell || !endCell) {
    console.error('Could not find cells for event:', event.title, { dayIndex, startSlotIndex, endSlotIndex });
    return;
  }

  // Position the event absolutely within the calendar grid
  const contentArea = elements.calendarContent || elements.calendarGrid;
  const gridRect = contentArea.getBoundingClientRect();
  const startRect = startCell.getBoundingClientRect();
  const endRect = endCell.getBoundingClientRect();

  // Calculate position based on column
  const cellWidth = startRect.width;
  const eventWidth = cellWidth / (event.totalColumns || 1);
  const leftOffset = eventWidth * (event.column || 0);

  // Apply some padding between events
  const padding = 2;

  eventEl.style.position = 'absolute';
  eventEl.style.top = `${startRect.top - gridRect.top}px`;
  eventEl.style.left = `${startRect.left - gridRect.left + leftOffset + padding}px`;
  eventEl.style.width = `${eventWidth - (padding * 2)}px`;
  eventEl.style.height = `${endRect.bottom - startRect.top}px`;

  // Calculate if we need to show abbreviated content based on height
  const eventHeight = endRect.bottom - startRect.top;
  const isCompact = eventHeight < 50;

  // Format time display
  let timeDisplay = '';
  if (state.timeMode === 'ah' || state.timeMode === 'both') {
    const ahStartTime = convertRealToAH(startHour);
    const ahEndTime = convertRealToAH(endHour);
    eventEl.classList.add('ah-time');

    if (event.isMultiDay) {
      if (event.isFirstDay) {
        timeDisplay = `AH ${Math.floor(ahStartTime)}:${Math.round((ahStartTime % 1) * 60).toString().padStart(2, '0')} →`;
      } else if (event.isLastDay) {
        timeDisplay = `→ AH ${Math.floor(ahEndTime)}:${Math.round((ahEndTime % 1) * 60).toString().padStart(2, '0')}`;
      } else {
        timeDisplay = '→ All Day →';
      }
    } else {
      timeDisplay = `AH ${Math.floor(ahStartTime)}:${Math.round((ahStartTime % 1) * 60).toString().padStart(2, '0')} - ${Math.floor(ahEndTime)}:${Math.round((ahEndTime % 1) * 60).toString().padStart(2, '0')}`;
    }
  } else {
    if (event.isMultiDay) {
      if (event.isFirstDay) {
        timeDisplay = `${eventStart.format('h:mm A')} →`;
      } else if (event.isLastDay) {
        timeDisplay = `→ ${eventEnd.format('h:mm A')}`;
      } else {
        timeDisplay = '→ All Day →';
      }
    } else {
      timeDisplay = `${eventStart.format('h:mm A')} - ${eventEnd.format('h:mm A')}`;
    }
  }

  // Add content
  if (isCompact) {
    eventEl.innerHTML = `
      <div class="event-content-compact">
        <span class="event-time-compact">${timeDisplay.split(' - ')[0]}</span>
        <span class="event-title-compact">${event.title}</span>
      </div>
    `;
  } else {
    eventEl.innerHTML = `
      <small>${timeDisplay}</small>
      <div class="event-title">${event.title}</div>
    `;
  }

  // Add background color if provided
  if (event.backgroundColor) {
    eventEl.style.backgroundColor = event.backgroundColor;
    eventEl.style.borderLeftColor = event.foregroundColor || event.backgroundColor;
  }

  // Add click handler
  eventEl.addEventListener('click', () => showEventDetails(event));

  // Make calendar content area position relative for absolute positioning
  if (contentArea.style.position !== 'relative') {
    contentArea.style.position = 'relative';
  }

  contentArea.appendChild(eventEl);
}

// Convert real hours to AH hours
function convertRealToAH(realHours) {
  const normalDurationHours = state.normalAphDayDurationMinutes / 60;

  if (realHours < normalDurationHours) {
    // In designed period
    return realHours * state.scaleFactor;
  } else {
    // In AH period
    return 24 + (realHours - normalDurationHours);
  }
}

// Convert AH hours to real hours
function convertAHToReal(ahHours) {
  if (ahHours < 24) {
    // In designed period
    return ahHours / state.scaleFactor;
  } else {
    // In AH period
    const normalDurationHours = state.normalAphDayDurationMinutes / 60;
    return normalDurationHours + (ahHours - 24);
  }
}

// Show event details
function showEventDetails(event) {
  elements.eventDetails.style.display = 'block';

  const startTime = moment(event.start);
  const endTime = moment(event.end);

  // Calculate AH times
  const startHour = startTime.hour() + startTime.minute() / 60;
  const endHour = endTime.hour() + endTime.minute() / 60;
  const ahStartTime = convertRealToAH(startHour);
  const ahEndTime = convertRealToAH(endHour);

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
      <span>AH ${Math.floor(ahStartTime)}:${Math.round((ahStartTime % 1) * 60).toString().padStart(2, '0')} - AH ${Math.floor(ahEndTime)}:${Math.round((ahEndTime % 1) * 60).toString().padStart(2, '0')}</span>
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