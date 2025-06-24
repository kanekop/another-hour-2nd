# Development Guide

This guide provides instructions for setting up the development environment for the Another Hour project.

## Prerequisites

-   Node.js (v16.0.0 or higher)
-   npm (v7.0.0 or higher, comes with Node.js)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/kanekop/another-hour.git
cd another-hour
```

### 2. Install Dependencies

This project uses [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) to manage the monorepo. Running `npm install` from the root directory will install dependencies for all packages.

```bash
# From the project root
npm install
```

This will also install `lerna`, which is used for managing package versions and publishing.

## 🛠️ Development Workflow

### Running the Main Application

To run the `scheduler-web` application, use the script defined in the root `package.json`.

```bash
# Runs the scheduler-web application
npm run dev
```

This command executes the `dev` script within the `@another-hour/scheduler-web` workspace.

### Running a Specific Package

If you need to run a command for a specific package, you can use the `--workspace` flag.

```bash
# Example: Run the 'test' script only for the 'scheduler-web' package
npm run test --workspace=@another-hour/scheduler-web
```

### Running a Command Across All Packages

To run a script across all packages that have it defined, use the `--workspaces` flag.

```bash
# Example: Run the 'lint' script in all packages
npm run lint --workspaces --if-present
```

## 🧪 Testing

This project uses [Jest](https://jestjs.io/) as its testing framework. Tests are located in the `tests` directory within each package.

### Running All Tests

To run all tests across all packages, use the following command from the root directory:

```bash
npm test --workspaces
```

### Running Tests for a Specific Package

You can run tests for a single package using the `--workspace` flag. This is useful for focusing on a specific part of the codebase.

```bash
# Run all tests in the @another-hour/core package
npm test --workspace=@another-hour/core
```

### Running Tests in Watch Mode

During development, it's helpful to run tests in watch mode, which automatically re-runs tests when files change.

```bash
# Watch for changes and re-run tests in @another-hour/core
npm run test:watch --workspace=@another-hour/core
```

### Checking Test Coverage

The `@another-hour/core` package is configured to generate a test coverage report. After running the tests, you can find a detailed HTML report in `packages/core/coverage/lcov-report/index.html`.

```bash
# Run tests and generate a coverage report for the core package
npm run test:coverage --workspace=@another-hour/core
```

## 📦 Package Management

### Adding a Dependency to a Specific Package

To add a new dependency to a package, use the `--workspace` flag with `npm install`.

```bash
# Example: Add 'date-fns' to the scheduler-web package
npm install date-fns --workspace=@another-hour/scheduler-web
```

### Adding a New Package

1.  Create a new directory under `packages/`.
2.  `cd` into the new directory.
3.  Run `npm init` to create a `package.json` file.
    -   Make sure to use the `@another-hour/` scope for the package name (e.g., `@another-hour/new-package`).
4.  Run `npm install` from the root directory to link the new package.

## 📝 Coding Style

Please adhere to the existing coding style. We use Prettier and ESLint to maintain a consistent style (configuration to be added).

## 📄 Documentation

All documentation is located in the `/docs` directory and is written in Markdown. Please keep documentation up-to-date with any changes you make.

# Development Environment & Setup

## 🛠️ Development Environment

### Replit Environment

- **URL**: https://replit.com/@yoshimunekaneko/another-hour
- **Environment Variables**:
  - `GOOGLE_CLIENT_ID`
- **Auto-deploy**: Enabled for `.replit.app` domain

### Development URLs
- **Development**: Dynamic URL (check Replit Webview for current URL)
- **Deployment**: `https://another-hour.replit.app`

### Testing Environment
- **Primary Browser**: Chrome (latest version)
- **Secondary Browsers**: Firefox, Safari (for compatibility testing)
- **Mobile Testing**: Chrome DevTools device emulation

## 👤 Test Accounts

### Google Calendar Test Account
- **Email**: yoshimune.kaneko@gmail.com
- **Status**: Added as test user in Google Cloud Console
- **Permissions**: Calendar read/write access granted

## 🔑 API Configuration

### Google Cloud Console Project
- **Project Name**: Another Hour Scheduler
- **OAuth 2.0 Client ID**: `578245430016-ttvhcmddnsfun67vqo45l4na0nuvkagf.apps.googleusercontent.com`
- **Authorized Redirect URIs**:
  1. `http://localhost:3000/auth/google/callback`
  2. `https://another-hour.replit.app/auth/google/callback`
  3. Dynamic Replit dev URLs (automatically detected by GoogleCalendarService)

## 📋 Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Run development server
npm start

# Access at http://localhost:3000
```

### Replit Development
1. Open Replit project
2. Click "Run" button
3. Access via Webview or external browser

### Testing OAuth Flow
1. Navigate to `/pages/auth-test.html`
2. Follow steps 1-5 in order
3. Check console logs for debugging

## 🚀 Current Development Status (2025-01-26)

### ✅ Completed Features

#### Phase 2.5: UI/UX Improvements (COMPLETED)
1. **Multi-hour Event Display** ✅
   - Events spanning multiple hours now display as continuous blocks
   - Fixed positioning issues for multi-day events
   - Implemented proper event segmentation for week boundaries

2. **Overlapping Event Layout** ✅
   - Sophisticated column-based algorithm for event placement
   - Support for up to 4 columns of overlapping events
   - Dynamic width calculation based on overlap count
   - Visual separation with padding between events

3. **Fixed Header on Scroll** ✅
   - Sticky header implementation using CSS `position: sticky`
   - Scroll shadow effect for visual feedback
   - Proper z-index management for layering
   - Responsive design adjustments

#### Phase 2.6: Event Detail Modal (COMPLETED) ✅ - 2025-01-26
1. **Double-click Event Modal** ✅
   - Double-click on any event to show details in a modal popup
   - Maintains single-click functionality for bottom panel display
   - Modal overlay with click-outside-to-close functionality
   - ESC key support for closing modal
   - Responsive modal design for mobile devices

2. **Modal Features** ✅
   - Event title, time (both Real and AH), description, and location display
   - Calendar source information
   - Smooth animations and transitions
   - Dark mode support

#### Phase 2.7: Google Calendar Integration (COMPLETED) ✅ - 2025-01-26
1. **Google OAuth Implementation** ✅
   - Dynamic redirect URI detection for Replit environment
   - Secure token management with refresh capability
   - Environment variable configuration through Replit Secrets

2. **Calendar Data Sync** ✅
   - Fetch events from multiple Google calendars
   - Real-time event display in AH scheduler
   - Event creation, editing, and deletion support
   - Automatic token refresh handling

### 🔧 Technical Implementation Details

#### Event Rendering System
```javascript
// Key functions modified:
- renderAllEvents(): Now groups events by day before processing
- processEventsForLayout(): Improved algorithm for overlap detection
- renderMultiHourEvent(): Enhanced with absolute positioning and click handlers
- showEventDetailsModal(): New function for modal display
```

#### CSS Architecture
```css
/* New modal structure:
.event-modal-overlay
  └── .event-modal
      ├── .event-modal-close
      └── #event-modal-content
*/
```

#### Event Interaction
```javascript
// Double-click detection implementation:
let clickTimer = null;
eventEl.addEventListener('click', (e) => {
  if (clickTimer) {
    // Double-click detected
    clearTimeout(clickTimer);
    clickTimer = null;
    showEventDetailsModal(event);
  } else {
    // Single-click - wait to see if double-click follows
    clickTimer = setTimeout(() => {
      clickTimer = null;
      showEventDetails(event);
    }, 300);
  }
});
```

### 🐛 Fixed Issues
- ✅ Multi-day events appearing in wrong positions
- ✅ Calendar cells showing as gray/invisible
- ✅ Event overlap causing visual conflicts
- ✅ Header scrolling with content
- ✅ Event details accessibility on mobile devices

### 🎯 Next Development Tasks

#### Priority 1: Event Management UI Enhancement
1. **Event Creation Interface**
   - Modal dialog for new events with Google Calendar integration
   - Time picker with AH/Real time toggle
   - Date range selection
   - Calendar selection dropdown (from connected Google calendars)

2. **Event Editing Enhancement**
   - Add "Edit" button to event detail modal
   - Inline editing for quick changes
   - Drag-and-drop to reschedule with Google Calendar sync
   - Conflict detection and resolution

3. **Event Deletion Enhancement**
   - Add "Delete" button to event detail modal
   - Confirmation dialog with Google Calendar sync
   - Batch deletion support

#### Priority 2: Advanced Event Features
1. **All-day Event Support**
   - Special rendering for all-day events
   - AH time interpretation for 24-hour events
   - Google Calendar all-day event sync

2. **Recurring Events**
   - Basic recurrence patterns
   - AH-aware recurrence calculation
   - Google Calendar recurring event display

3. **Event Search & Filter**
   - Search by title, time, or description
   - Filter by calendar source (Google calendars)
   - Time range filters
   - AH/Real time search modes

#### Priority 3: Multi-Calendar Integration
1. **Outlook Integration**
   - Microsoft Graph API setup
   - OAuth flow implementation (similar to Google)
   - Event sync logic with existing Google integration

2. **Calendar Management**
   - Multiple calendar account support
   - Sync conflict resolution between services
   - Unified event display from multiple sources
   - User preference settings for sync behavior

## 🔍 Code Structure Reference

### Key Files and Their Roles

#### `/public/js/scheduler-ui.js`
- **Current State**: Fully refactored with improved event rendering and modal support
- **Key Functions**:
  - `renderCalendar()`: Creates calendar structure with sticky header
  - `renderAllEvents()`: Processes and displays all events
  - `processEventsForLayout()`: Calculates event positioning
  - `renderMultiHourEvent()`: Renders individual events with click handlers
  - `showEventDetailsModal()`: Displays event details in modal popup

#### `/public/css/scheduler.css`
- **Current State**: Enhanced with sticky header, improved layouts, and modal styles
- **Key Classes**:
  - `.calendar-scroll-wrapper`: Scrollable container
  - `.calendar-header-row`: Sticky header
  - `.calendar-content`: Event grid
  - `.multi-hour-event`: Positioned events
  - `.event-modal-overlay`: Modal backdrop
  - `.event-modal`: Modal content container

#### `/public/pages/scheduler.html`
- **Current State**: Includes modal HTML structure
- **Key Elements**:
  - `#event-modal-overlay`: Modal backdrop element
  - `#event-modal-content`: Dynamic content container

#### `/src/routes/calendar-sync.js`
- **Current State**: Google Calendar integration complete
- **Next**: Add Outlook endpoints

#### `/src/services/GoogleCalendarService.js`
- **Current State**: Fully functional with dynamic Replit URL detection
- **Features**: OAuth flow, token management, CRUD operations, calendar list fetching
- **Next**: Add batch operations support and Outlook service parallel implementation

## 📝 Development Notes

### Performance Considerations
- Event rendering is optimized for up to 250 events per week
- Modal animations use CSS transitions for better performance
- Consider virtual scrolling for very long time ranges
- Batch API calls when possible

### Browser Compatibility
- Sticky positioning requires modern browsers
- Modal uses flexbox for centering (IE11+ support)
- Double-click detection works across all modern browsers
- Test on Safari for iOS-specific issues

### Accessibility Improvements
- Modal includes keyboard navigation (ESC to close)
- Click-outside-to-close pattern for better UX
- Proper z-index management for modal layering
- Focus management considerations for future iterations

### Security Reminders
- OAuth tokens stored in server sessions
- Never expose client secrets
- Implement CSRF protection for state changes

## 🔄 Quick Resume Guide

To resume development:

1. **Check Current State**
   ```bash
   git status
   git log --oneline -5
   ```

2. **Verify Environment**
   - Ensure Replit Secrets are configured
   - Check OAuth redirect URIs match current dev URL

3. **Test Current Features**
   - Load scheduler page
   - Verify events display correctly
   - Test scroll behavior
   - Check event overlap handling
   - Test double-click modal functionality

4. **Start Next Task**
   - Review "Next Development Tasks" above
   - Create feature branch if using Git
   - Implement incrementally with testing

## 📊 Testing Checklist

Before committing changes:
- [ ] Events display correctly in all time modes (AH/Real/Both)
- [ ] Multi-hour events render as continuous blocks
- [ ] Overlapping events layout side-by-side
- [ ] Header remains fixed during scroll
- [ ] Double-click opens modal with correct information
- [ ] Single-click still shows details in bottom panel
- [ ] Modal closes with ×, ESC, and outside click
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Dark mode styling is consistent

## 🔗 Related Documentation

- [README](../README.md) - プロジェクト概要
- [Fork Strategy](fork_strategy.md) - フォーク戦略

---

*Last updated: 2025-01-26*
*Last session: Google Calendar integration completed with dynamic URL detection*