let authWindow = null;

function log(message, type = 'info') {
    const logEl = document.getElementById('debug-log');
    const timestamp = new Date().toLocaleTimeString();
    logEl.textContent += `[${timestamp}] ${message}\n`;
    logEl.scrollTop = logEl.scrollHeight;
}

function showStatus(elementId, message, type = 'info') {
    const el = document.getElementById(elementId);
    el.className = `status ${type}`;
    el.textContent = message;
}

function showJson(elementId, data) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="json-output">${JSON.stringify(data, null, 2)}</div>`;
}

// Step 1: Check Environment
async function checkEnvironment() {
    log('Checking environment configuration...');
    try {
        const response = await fetch('/health');
        const data = await response.json();

        if (data.features.googleCalendar) {
            showStatus('env-status', '✅ Google Calendar integration is configured', 'success');
            log('Google OAuth credentials found');
        } else {
            showStatus('env-status', '❌ Google OAuth credentials not configured', 'error');
            log('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
        }
    } catch (error) {
        showStatus('env-status', `Error: ${error.message}`, 'error');
        log(`Environment check failed: ${error.message}`, 'error');
    }
}

// Step 2: Get Auth URL
async function getAuthUrl() {
    log('Requesting OAuth authorization URL...');
    try {
        const response = await fetch('/api/calendar/google/auth-url');
        const data = await response.json();

        if (data.authUrl) {
            showStatus('auth-url-status', '✅ Auth URL generated successfully', 'success');
            log(`Auth URL: ${data.authUrl}`);
            showJson('auth-url-status', { authUrl: data.authUrl });
        } else {
            showStatus('auth-url-status', '❌ Failed to generate auth URL', 'error');
            log('No auth URL received');
        }
    } catch (error) {
        showStatus('auth-url-status', `Error: ${error.message}`, 'error');
        log(`Auth URL generation failed: ${error.message}`, 'error');
    }
}

// Step 3: Start OAuth Flow
async function startOAuthFlow() {
    log('Starting OAuth flow...');
    document.getElementById('start-oauth-btn').disabled = true;

    try {
        const response = await fetch('/api/calendar/google/auth-url');
        const data = await response.json();

        if (data.authUrl) {
            log('Auth URL received. Opening popup window...');
            authWindow = window.open(data.authUrl, 'authWindow', 'width=600,height=700');

            const checkPopup = setInterval(() => {
                if (!authWindow || authWindow.closed) {
                    clearInterval(checkPopup);
                    log('OAuth popup closed.');
                    showStatus('oauth-status', 'ℹ️ OAuth window closed. Please check the authentication status.', 'info');
                    document.getElementById('start-oauth-btn').disabled = false;
                }
            }, 1000);
            showStatus('oauth-status', '🚀 OAuth window opened. Please complete the sign-in process.', 'info');
        } else {
            showStatus('oauth-status', '❌ Failed to get auth URL for popup', 'error');
            document.getElementById('start-oauth-btn').disabled = false;
        }
    } catch (error) {
        showStatus('oauth-status', `Error: ${error.message}`, 'error');
        log(`OAuth flow failed: ${error.message}`, 'error');
        document.getElementById('start-oauth-btn').disabled = false;
    }
}

// Step 4: Check Authentication Status
async function checkAuthStatus() {
    log('Checking authentication status...');
    try {
        const response = await fetch('/api/calendar/google/check');
        const data = await response.json();

        if (data.isAuthenticated) {
            showStatus('auth-check-status', '✅ User is authenticated', 'success');
            log('User is authenticated.');
        } else {
            showStatus('auth-check-status', '❌ User is not authenticated', 'error');
            log('User is not authenticated.');
        }
    } catch (error) {
        showStatus('auth-check-status', `Error: ${error.message}`, 'error');
        log(`Auth status check failed: ${error.message}`, 'error');
    }
}

// Step 5: Test API Calls
async function getCalendarList() {
    log('Fetching calendar list...');
    try {
        const response = await fetch('/api/calendar/google/calendars');
        if (response.status === 401) {
            showStatus('api-test-status', 'Authentication required. Please complete the OAuth flow.', 'error');
            return;
        }
        const data = await response.json();
        showStatus('api-test-status', '✅ Successfully fetched calendar list', 'success');
        log(`Received ${data.calendars.length} calendars.`);
        showJson('api-response', data.calendars);
    } catch (error) {
        showStatus('api-test-status', `Error: ${error.message}`, 'error');
        log(`Failed to fetch calendar list: ${error.message}`, 'error');
    }
}

async function getEvents() {
    log('Fetching events for the current week...');
    try {
        const response = await fetch('/api/calendar/google/events');
        if (response.status === 401) {
            showStatus('api-test-status', 'Authentication required. Please complete the OAuth flow.', 'error');
            return;
        }
        const data = await response.json();
        showStatus('api-test-status', '✅ Successfully fetched events', 'success');
        log(`Received ${data.events.length} events.`);
        showJson('api-response', data.events);
    } catch (error) {
        showStatus('api-test-status', `Error: ${error.message}`, 'error');
        log(`Failed to fetch events: ${error.message}`, 'error');
    }
}

// Make functions available globally
window.checkEnvironment = checkEnvironment;
window.getAuthUrl = getAuthUrl;
window.startOAuthFlow = startOAuthFlow;
window.checkAuthStatus = checkAuthStatus;
window.getCalendarList = getCalendarList;
window.getEvents = getEvents; 