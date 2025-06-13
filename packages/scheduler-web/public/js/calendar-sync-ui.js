document.addEventListener('DOMContentLoaded', initialize);

const state = {
    isAuthenticated: false,
    selectedCalendars: [],
    allCalendars: []
};

const elements = {
    connectedAccounts: document.getElementById('connected-accounts'),
    calendarList: document.getElementById('calendar-list'),
    autoSync: document.getElementById('auto-sync'),
    twoWaySync: document.getElementById('two-way-sync')
};

async function initialize() {
    loadSettings();
    await checkAuthStatus();
    setupEventListeners();
}

function loadSettings() {
    const saved = localStorage.getItem('googleCalendarSyncSettings');
    if (saved) {
        const settings = JSON.parse(saved);
        state.selectedCalendars = settings.selectedCalendars || [];
        elements.autoSync.checked = settings.autoSync !== false;
        elements.twoWaySync.checked = settings.twoWaySync === true;
    }
}

function saveSettings() {
    const settings = {
        selectedCalendars: state.selectedCalendars,
        autoSync: elements.autoSync.checked,
        twoWaySync: elements.twoWaySync.checked
    };
    localStorage.setItem('googleCalendarSyncSettings', JSON.stringify(settings));
}

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/calendar/google/status');
        const data = await response.json();
        state.isAuthenticated = data.authenticated;
        renderConnectedAccounts(data);
        if (state.isAuthenticated) {
            await fetchCalendars();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        elements.connectedAccounts.innerHTML = '<p>Could not verify connection status.</p>';
    }
}

function renderConnectedAccounts(authData) {
    if (authData.authenticated) {
        elements.connectedAccounts.innerHTML = `
            <div class="account-info">
                <p>Connected as: <strong>${authData.email}</strong></p>
                <button id="disconnect-google" class="button-danger">Disconnect</button>
            </div>
        `;
        document.getElementById('disconnect-google').addEventListener('click', disconnectGoogleAccount);
    } else {
        elements.connectedAccounts.innerHTML = `
            <div class="account-info">
                <p>Not connected.</p>
                <button id="connect-google" class="button-primary">Connect Google Account</button>
            </div>
        `;
        document.getElementById('connect-google').addEventListener('click', initiateGoogleAuth);
    }
}

async function fetchCalendars() {
    try {
        const response = await fetch('/api/calendar/google/calendars');
        const calendars = await response.json();
        state.allCalendars = calendars;
        renderCalendarList();
    } catch (error) {
        console.error('Error fetching calendars:', error);
        elements.calendarList.innerHTML = '<p>Could not fetch calendar list.</p>';
    }
}

function renderCalendarList() {
    if (state.allCalendars.length === 0) {
        elements.calendarList.innerHTML = '<p>No calendars found.</p>';
        return;
    }

    const listHtml = state.allCalendars.map(cal => `
        <div class="calendar-item" style="border-left-color: ${cal.backgroundColor};">
            <label>
                <input type="checkbox" data-calendar-id="${cal.id}" ${state.selectedCalendars.includes(cal.id) ? 'checked' : ''}>
                <span>${cal.summary}</span>
            </label>
        </div>
    `).join('');

    elements.calendarList.innerHTML = listHtml;
}

function setupEventListeners() {
    elements.calendarList.addEventListener('change', handleCalendarSelection);
    elements.autoSync.addEventListener('change', saveSettings);
    elements.twoWaySync.addEventListener('change', saveSettings);
}

async function handleCalendarSelection(e) {
    if (e.target.type === 'checkbox') {
        const calendarId = e.target.dataset.calendarId;
        if (e.target.checked) {
            state.selectedCalendars.push(calendarId);
        } else {
            state.selectedCalendars = state.selectedCalendars.filter(id => id !== calendarId);
        }
        saveSettings();
        await updateSelectedCalendarsOnBackend();
    }
}

async function updateSelectedCalendarsOnBackend() {
    try {
        await fetch('/api/calendar/google/select-calendars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calendarIds: state.selectedCalendars })
        });
    } catch (error) {
        console.error('Error updating selected calendars:', error);
        alert('Could not save calendar selection. Please try again.');
    }
}

async function initiateGoogleAuth() {
    try {
        const response = await fetch('/api/calendar/google/auth-url');
        const data = await response.json();
        if (data.authUrl) {
            window.location.href = data.authUrl;
        }
    } catch (error) {
        console.error('Error initiating auth:', error);
    }
}

async function disconnectGoogleAccount() {
    if (confirm('Are you sure you want to disconnect your Google Account?')) {
        try {
            await fetch('/api/calendar/google/disconnect', { method: 'POST' });
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting account:', error);
            alert('Could not disconnect account. Please try again.');
        }
    }
} 