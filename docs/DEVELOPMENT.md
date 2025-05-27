# Development Environment & Setup

## 🛠️ Development Environment

### Replit Instance
- **URL**: https://replit.com/@yoshimunekaneko/another-hour-scheduler
- **Type**: Node.js environment
- **Auto-deploy**: Enabled for `.replit.app` domain

### Development URLs
- **Development**: `https://46b78144-9d6c-484e-bef9-4e129353b236-00-3bnds5q3qxkdu.pike.replit.dev`
- **Deployment**: `https://another-hour-scheduler.replit.app`

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
  2. `https://another-hour-scheduler.replit.app/auth/google/callback`
  3. `https://46b78144-9d6c-484e-bef9-4e129353b236-00-3bnds5q3qxkdu.pike.replit.dev/auth/google/callback`

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

## 🚀 Current Development Status (2025-05-27)

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

### 🔧 Technical Implementation Details

#### Event Rendering System
```javascript
// Key functions modified:
- renderAllEvents(): Now groups events by day before processing
- processEventsForLayout(): Improved algorithm for overlap detection
- renderMultiHourEvent(): Enhanced with absolute positioning
```

#### CSS Architecture
```css
/* New structure:
.calendar-grid
  └── .calendar-scroll-wrapper (scrollable container)
      ├── .calendar-header-row (sticky header)
      └── .calendar-content (event grid)
*/
```

### 🐛 Fixed Issues
- ✅ Multi-day events appearing in wrong positions
- ✅ Calendar cells showing as gray/invisible
- ✅ Event overlap causing visual conflicts
- ✅ Header scrolling with content

### 🎯 Next Development Tasks

#### Priority 1: Event Management
1. **Event Creation Interface**
   - Modal dialog for new events
   - Time picker with AH/Real time toggle
   - Date range selection
   - Calendar selection dropdown

2. **Event Editing**
   - Click event to edit
   - Inline editing for quick changes
   - Drag-and-drop to reschedule

3. **Event Deletion**
   - Confirmation dialog
   - Batch deletion support

#### Priority 2: Advanced Features
1. **All-day Event Support**
   - Special rendering for all-day events
   - AH time interpretation for 24-hour events

2. **Recurring Events**
   - Basic recurrence patterns
   - AH-aware recurrence calculation

3. **Event Search & Filter**
   - Search by title, time, or description
   - Filter by calendar source
   - Time range filters

#### Priority 3: Calendar Sync Enhancement
1. **Outlook Integration**
   - Microsoft Graph API setup
   - OAuth flow implementation
   - Event sync logic

2. **Sync Conflict Resolution**
   - Duplicate detection
   - Merge strategies
   - User preference settings

## 🔍 Code Structure Reference

### Key Files and Their Roles

#### `/public/js/scheduler-ui.js`
- **Current State**: Fully refactored with improved event rendering
- **Key Functions**:
  - `renderCalendar()`: Creates calendar structure with sticky header
  - `renderAllEvents()`: Processes and displays all events
  - `processEventsForLayout()`: Calculates event positioning
  - `renderMultiHourEvent()`: Renders individual events

#### `/public/css/scheduler.css`
- **Current State**: Enhanced with sticky header and improved layouts
- **Key Classes**:
  - `.calendar-scroll-wrapper`: Scrollable container
  - `.calendar-header-row`: Sticky header
  - `.calendar-content`: Event grid
  - `.multi-hour-event`: Positioned events

#### `/src/routes/calendar-sync.js`
- **Current State**: Google Calendar integration complete
- **Next**: Add Outlook endpoints

#### `/src/services/GoogleCalendarService.js`
- **Current State**: Fully functional
- **Next**: Add batch operations support

## 📝 Development Notes

### Performance Considerations
- Event rendering is optimized for up to 250 events per week
- Consider virtual scrolling for very long time ranges
- Batch API calls when possible

### Browser Compatibility
- Sticky positioning requires modern browsers
- Fallback for older browsers not implemented
- Test on Safari for iOS-specific issues

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
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Dark mode styling is consistent

## 🔗 Related Documentation

- [README](../README.md) - プロジェクト概要
- [Fork Strategy](fork_strategy.md) - フォーク戦略

---

*Last updated: 2025-05-27*
*Last session: UI/UX improvements completed successfully*