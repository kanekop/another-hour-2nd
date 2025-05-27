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
- **Project Name**: Another Hour Scheduler (推測)
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

## 🐛 Known Development Issues

### OAuth Redirect URI
- Development environment auto-detection implemented in `GoogleCalendarService.js`
- No manual configuration needed

### Session Storage
- Sessions stored in-memory (resets on server restart)
- Consider implementing persistent session storage for production

## 📝 Development Notes

### Current Focus Areas
- Multi-hour event display optimization
- All-day event handling
- Event overlap layout improvements

### Performance Considerations
- Calendar sync limited to 250 events per request
- Consider pagination for large calendars

### Security Notes
- All OAuth credentials stored in Replit Secrets
- Never commit credentials to version control

## 📖 Related Documentation

- [README](../README.md) - プロジェクト概要
- [Development Setup](DEVELOPMENT.md) - 開発環境
- [Fork Strategy](fork_strategy.md) - フォーク戦略

## 🔄 Update History

- **2025-05-24**: Initial Google Calendar integration completed
- **2025-05-24**: Phase 1 & 2 development finished
- **2025-05-24**: Testing environment documented

---

*Last updated: [2025-5-24]*