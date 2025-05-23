
document.addEventListener('DOMContentLoaded', () => {
  let calendar;
  const authStatus = document.getElementById('authStatus');
  const connectBtn = document.getElementById('connectCalendar');
  const eventForm = document.getElementById('eventForm');
  const newEventForm = document.getElementById('newEventForm');
  const cancelEventBtn = document.getElementById('cancelEvent');

  // Initialize FullCalendar
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    selectable: true,
    editable: true,
    select: handleDateSelect,
    eventClick: handleEventClick,
    events: fetchEvents
  });
  calendar.render();

  // Check authentication status
  checkAuthStatus();

  // Event Listeners
  connectBtn.addEventListener('click', handleAuth);
  newEventForm.addEventListener('submit', handleEventSubmit);
  cancelEventBtn.addEventListener('click', () => eventForm.classList.add('hidden'));

  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/calendar/google/status');
      const data = await response.json();
      updateAuthStatus(data.authenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      updateAuthStatus(false);
    }
  }

  function updateAuthStatus(isAuthenticated) {
    authStatus.textContent = isAuthenticated ? 'Connected' : 'Not connected';
    connectBtn.style.display = isAuthenticated ? 'none' : 'block';
  }

  async function handleAuth() {
    try {
      const response = await fetch('/api/calendar/google/auth-url');
      const data = await response.json();
      if (data.authUrl) {
        const authWindow = window.open(data.authUrl, 'Google Calendar Auth', 
          'width=600,height=600');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  }

  async function fetchEvents(info, successCallback, failureCallback) {
    try {
      const response = await fetch('/api/calendar/google/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeMin: info.start.toISOString(),
          timeMax: info.end.toISOString()
        })
      });
      const data = await response.json();
      successCallback(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      failureCallback(error);
    }
  }

  function handleDateSelect(selectInfo) {
    eventForm.classList.remove('hidden');
    document.getElementById('eventStart').value = selectInfo.startStr;
    document.getElementById('eventEnd').value = selectInfo.endStr;
  }

  function handleEventClick(clickInfo) {
    // Handle event click - show event details or edit form
    console.log('Event clicked:', clickInfo.event);
  }

  async function handleEventSubmit(e) {
    e.preventDefault();
    const formData = {
      title: document.getElementById('eventTitle').value,
      start: document.getElementById('eventStart').value,
      end: document.getElementById('eventEnd').value,
      description: document.getElementById('eventDescription').value
    };

    try {
      const response = await fetch('/api/calendar/google/events/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        calendar.refetchEvents();
        eventForm.classList.add('hidden');
        newEventForm.reset();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    }
  }

  // Listen for auth success message from popup
  window.addEventListener('message', (event) => {
    if (event.data.type === 'google-auth-success') {
      checkAuthStatus();
      calendar.refetchEvents();
    }
  });
});
