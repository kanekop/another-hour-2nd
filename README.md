# Another Hour Scheduler

Another Hour Scheduler is an advanced web-based scheduling application that extends the unique time concepts of Another Hour Clock. This application allows you to manage your calendar and events using the **"Scaled 24"** and **"Another Hour" (AH)** time system, while seamlessly integrating with your existing Google Calendar and Outlook Calendar.

## 📅 About This Project

This is a **Fork & Extend** version of the original Another Hour Clock project, specifically designed to add comprehensive scheduling and calendar management capabilities while preserving all the innovative time concepts that make Another Hour unique.

### 🔗 **Project Relationship**
- **Original Project**: [Another Hour Clock](https://github.com/kanekop/another-hour-gen2-Claude) - Pure time experience
- **This Project**: Another Hour Scheduler - Time experience + Calendar management
- **Strategy**: Fork & Extend (see [fork_strategy.md](fork_strategy.md) for details)

## ✨ Key Concepts

- **Scaled 24 Period**: Your customizable conceptual 24-hour day that can last anywhere from 0 to 24 real hours
- **Another Hour (AH) Period**: The remaining real time in a 24-hour day, running at normal speed
- **Time Scaling**: During the "Scaled 24" period, time runs at a customized pace to fit 24 conceptual hours into your chosen real-time duration
- **Dual-Time Calendar**: View and manage events in both real time and AH time simultaneously
- **Calendar Synchronization**: Bidirectional sync with Google Calendar and Outlook Calendar

## 🚀 Features

### 📅 **AH Scheduler** (NEW - Core Feature)
- **Dual-Time Calendar View**: See events in both real time and AH time
- **Google Calendar Integration**: Full bidirectional sync with your Google Calendar
- **Outlook Calendar Integration**: Seamless integration with Microsoft Outlook
- **Event Time Conversion**: Automatically convert event times between real and AH time
- **Smart Scheduling**: Create events that respect your AH time preferences
- **Conflict Resolution**: Handle overlapping events across multiple calendars

### 🎯 **Enhanced Main Clock** (Inherited & Extended)
- **Custom Duration Control**: Set your "Scaled 24" period anywhere from 0 to 24 real hours
- **Calendar-Aware Display**: Clock shows upcoming events in your preferred time format
- **Integrated Event Preview**: Quick glance at your schedule from the main clock
- **Dynamic Time Scaling**: Time runs faster or slower during your "Scaled 24" period
- **Theme Switching**: Automatically switches to dark theme during AH periods
- **Timezone Support**: Full timezone selection with major world cities

### ⏱️ **Adaptive Stopwatch & Timer** (Inherited)
- **Calendar Integration**: Set timers for upcoming events
- **Adaptive Speed**: Operates based on your Main Clock's current scaling settings
- **Event Reminders**: Use timer for AH-time-based event notifications

### 📊 **Advanced Time Visualization** (Inherited & Extended)
- **Schedule-Aware Graphs**: Visualize your calendar alongside time distribution
- **Event Timeline**: See how your events align with your AH periods
- **Time Allocation Analysis**: Understand how your schedule fits your time philosophy

## 🏗️ Architecture

```
another-hour-scheduler/
├── 📅 Calendar & Scheduling (NEW)
│   ├── Google Calendar API Integration
│   ├── Microsoft Graph API Integration  
│   ├── Event Management System
│   └── Time Conversion Engine
├── 🌐 Frontend (Extended from Original)
│   ├── public/
│   │   ├── 📄 HTML Pages (Scheduler, Calendar Sync, etc.)
│   │   ├── 🎨 CSS (Calendar-specific styling)
│   │   └── ⚡ JavaScript (Calendar UI & Event management)
│   └── 🔧 Enhanced Core Logic
│       ├── clock-core.js (Extended for events)
│       ├── timezone-manager.js (Inherited)
│       └── calendar-sync.js (NEW)
├── 🔙 Backend (Extended)
│   ├── 🛣️ API Routes (Calendar sync, Event management)
│   ├── 🔐 OAuth Integration (Google & Microsoft)
│   └── 📁 Static File Serving
└── ⚙️ Configuration
    ├── 🔒 Replit Secrets (OAuth credentials)
    └── 🔧 Environment setup
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **npm** (included with Node.js)
- **Modern browser** with SVG support
- **Google Account** (for Google Calendar integration)
- **Microsoft Account** (optional, for Outlook integration)

### Installation (Replit)

1. **Fork on Replit**
   - This project is optimized for Replit development
   - Fork this repository directly in Replit

2. **Configure Secrets**
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   MICROSOFT_CLIENT_ID=your_microsoft_client_id (optional)
   MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret (optional)
   SESSION_SECRET=your_long_random_string
   ```

3. **Run the Application**
   ```bash
   npm start
   ```

4. **Setup Calendar Integration**
   - Navigate to Calendar Sync settings
   - Authenticate with Google/Microsoft
   - Configure your sync preferences

### Installation (Local Development)

1. **Clone & Navigate**
   ```bash
   git clone https://github.com/your-username/another-hour-scheduler.git
   cd another-hour-scheduler
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth credentials
   ```

4. **Start the Server**
   ```bash
   npm start
   ```

## 🎮 Usage Guide

### AH Scheduler (Main Feature)
1. **Access**: Click "AH Scheduler" from the landing page
2. **Calendar Sync Setup**: 
   - Go to "Calendar Sync" settings
   - Authenticate with Google Calendar and/or Outlook
   - Configure sync preferences (read-only, bidirectional, etc.)
3. **View Your Schedule**:
   - See events in both real time and AH time
   - Toggle between different time views
   - Create new events in your preferred time format
4. **Event Management**:
   - Edit existing events with automatic time conversion
   - Resolve conflicts between overlapping events
   - Set AH-time-based reminders

### Enhanced Main Clock
- **Calendar Integration**: View upcoming events directly on the clock
- **Event Notifications**: Get notified in AH time for upcoming events
- **Time Context**: Understand how your schedule aligns with your time philosophy

### Calendar Synchronization
- **Google Calendar**: Full bidirectional sync with read/write permissions
- **Outlook Calendar**: Seamless integration with Microsoft Graph API
- **Conflict Resolution**: Smart handling of overlapping events from different sources
- **Privacy Control**: Choose which calendars to sync and what information to share

## 🧮 Technical Deep Dive

### Enhanced Time Calculation System

The scheduler extends the original time scaling with event-aware calculations:

```javascript
// Enhanced scaling formula for events
scaleFactor = 24 / scaled24Hours

// Event time conversion
realEventTime ↔ ahEventTime = timeConverter.convertEvent(event, scaleFactor)

// During Scaled 24 period: events scale with time
// During AH period: events display in real time
```

### Calendar Integration APIs
- **Google Calendar API v3**: Full read/write access with OAuth 2.0
- **Microsoft Graph API**: Outlook Calendar integration
- **Replit Secrets**: Secure credential management
- **Event Synchronization**: Real-time bidirectional sync

### Key Technologies (Extended)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 modules)
- **Calendar UI**: FullCalendar.js with custom AH time rendering
- **Time Library**: Moment.js with Moment Timezone (inherited)
- **Graphics**: SVG for analog clock rendering (inherited)
- **Backend**: Node.js, Express.js (extended)
- **APIs**: Google Calendar API, Microsoft Graph API
- **State Management**: localStorage + server-side sessions + calendar sync

## 📱 Calendar Features

### Event Display
- **Dual Time View**: Events shown in both real and AH time
- **Visual Distinction**: Different colors for different calendar sources
- **Time Period Awareness**: Events adapt display based on current AH period
- **Responsive Design**: Calendar works seamlessly on mobile and desktop

### Event Management
- **Create Events**: Add events in either real or AH time
- **Edit & Delete**: Full event management with time conversion
- **Recurring Events**: Support for repeating events across time systems
- **Event Reminders**: AH-time-aware notification system

## 🔐 Security & Privacy

### OAuth Integration
- **Secure Authentication**: Industry-standard OAuth 2.0 flows
- **Minimal Permissions**: Request only necessary calendar access
- **Token Management**: Secure storage using Replit Secrets
- **User Control**: Users can revoke access at any time

### Data Handling
- **Local Storage**: Calendar data cached locally for performance
- **Privacy First**: No unnecessary data collection or sharing
- **Sync Control**: Users choose what information to synchronize

## 🛠️ Development

### Project Structure (Extended)
```
public/
├── css/                    # Stylesheets (inherited + new)
│   └── scheduler.css      # NEW: Calendar-specific styles
├── js/                    # Client-side modules (inherited + new)
│   ├── scheduler-ui.js    # NEW: Main scheduler interface
│   ├── calendar-sync-ui.js # NEW: Calendar sync management
│   └── event-manager.js   # NEW: Event CRUD operations
├── pages/                 # HTML pages (inherited + new)
│   ├── scheduler.html     # NEW: Main scheduler page
│   └── calendar-sync.html # NEW: Calendar sync settings
└── clock-core.js          # EXTENDED: Event-aware time calculations

src/
├── routes/                # API routes (inherited + new)
│   └── calendar-sync.js   # NEW: Calendar synchronization APIs
├── services/              # NEW: External service integrations
│   ├── GoogleCalendarService.js
│   └── OutlookCalendarService.js
└── shared/                # Utilities (inherited)
    └── ah-time.js         # Time conversion utilities
```

### Key Files (New & Modified)
- `scheduler-ui.js`: Main calendar interface with AH time support
- `calendar-sync.js`: Google/Outlook integration and OAuth handling
- `GoogleCalendarService.js`: Google Calendar API wrapper
- `OutlookCalendarService.js`: Microsoft Graph API wrapper
- `clock-core.js`: Extended with event-aware time calculations

## 🤝 Contributing

We welcome contributions to make AH Scheduler even better!

### Development Areas
- **Calendar Integrations**: Add support for more calendar services
- **UI/UX Improvements**: Enhance the scheduling interface
- **Time Features**: New ways to visualize and interact with AH time
- **Mobile Experience**: Optimize for mobile calendar management
- **Performance**: Improve sync speed and responsiveness

### Getting Started
1. **Fork** this repository
2. **Set up** your development environment (see Installation guide)
3. **Configure** OAuth credentials for testing
4. **Create** a feature branch (`git checkout -b feature/amazing-scheduler-feature`)
5. **Test** your changes across different time configurations
6. **Submit** a Pull Request

## 🚦 Roadmap

### ✅ Completed (Inherited from Original)
- [x] Customizable AH Clock with full scaling support
- [x] Integrated graph visualization
- [x] Stopwatch & Timer with adaptive scaling
- [x] Comprehensive timezone support
- [x] Dark/light theme system
- [x] Responsive design

### 🔄 In Progress (Scheduler Development)
- [ ] Google Calendar integration (OAuth + API)
- [ ] Basic event display in AH time
- [ ] Event creation and editing interface
- [ ] Conflict resolution system

### 🎯 Future Plans (Scheduler-Specific)
- [ ] **Outlook Calendar Integration**: Microsoft Graph API support
- [ ] **Advanced Event Features**: Recurring events, reminders, attachments
- [ ] **Calendar Sharing**: Share AH-time calendars with others
- [ ] **Mobile Calendar App**: Native iOS/Android scheduling apps
- [ ] **Smart Scheduling**: AI-powered optimal event placement
- [ ] **Time Analytics**: Insights into your AH time usage patterns
- [ ] **Team Scheduling**: Coordinate AH time across team members
- [ ] **Integration Hub**: Connect with more productivity tools

## 🆚 Comparison with Original

| Feature | Another Hour Clock | Another Hour Scheduler |
|---------|-------------------|------------------------|
| **Core Time System** | ✅ Full AH time experience | ✅ Inherited + Enhanced |
| **Calendar Integration** | ❌ None | ✅ Google + Outlook sync |
| **Event Management** | ❌ Time-only focus | ✅ Full scheduling features |
| **Multi-Calendar Support** | ❌ N/A | ✅ Multiple calendar sources |
| **Event Time Conversion** | ❌ N/A | ✅ Real ↔ AH time events |
| **Project Focus** | 🎯 Pure time experience | 📅 Practical time management |
| **Target Users** | Time philosophy enthusiasts | Busy professionals using AH time |

## 🐛 Known Issues

### Inherited Issues
- Timer accuracy may vary slightly during rapid scaling changes
- Very short "Scaled 24" periods (< 1 hour) may cause display precision issues
- Graph rendering may need refresh on some mobile browsers after orientation change

### Scheduler-Specific Issues
- Google Calendar sync may take a few seconds for large calendars
- Event time conversion precision depends on Scaled 24 duration settings
- Outlook integration requires Microsoft work/school account for full features

## 🆘 Troubleshooting

### Calendar Sync Issues

**Google Calendar not connecting?**
- Verify OAuth credentials in Replit Secrets
- Check Google Cloud Console API settings
- Ensure Calendar API is enabled
- Try re-authenticating in Calendar Sync settings

**Events not displaying correctly?**
- Check your Scaled 24 duration settings
- Verify timezone settings match your calendar
- Try manual sync refresh

**Outlook Calendar issues?**
- Ensure Microsoft Graph API permissions are configured
- Check if you're using a work/school vs. personal account
- Verify tenant settings allow external app access

### Performance Issues

**Slow event loading?**
- Check your internet connection
- Try syncing smaller date ranges
- Clear browser cache and localStorage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Original Another Hour Clock Project** for the innovative time concepts
- **Moment.js Team** for excellent date/time handling
- **FullCalendar.js Team** for the robust calendar interface
- **Google & Microsoft** for comprehensive calendar APIs
- **Replit Team** for the excellent development environment
- **Open Source Community** for inspiration and tools

## 📬 Contact

- **Project Repository**: [GitHub](https://github.com/your-username/another-hour-scheduler)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/your-username/another-hour-scheduler/issues)
- **Original Project**: [Another Hour Clock](https://github.com/kanekop/another-hour-gen2-Claude)

---

**Schedule time differently. Make every appointment count. 📅⏰**

*© 2025 Another Hour Scheduler Project. All Rights Reserved.*