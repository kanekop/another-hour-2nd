import express from 'express';
import session from 'express-session';
import fs from 'fs';
//import stopwatchRouter from './src/routes/stopwatch.js';
//import timerRouter from './src/routes/timer.js';
import calendarSyncRouter from './src/routes/calendar-sync.js'; // 新規追加
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import moment from 'moment-timezone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 5000;

// セッション設定（カレンダー同期で必要）
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // HTTPSを使用する場合はtrueに設定
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  }
}));

// 静的ファイルとミドルウェア設定
app.use(express.static('public'));
app.use('/pages', express.static('public/pages'));
app.use('/css', express.static(join(__dirname, 'public/css')));
app.use('/js', express.static(join(__dirname, 'public/js')));
app.use('/pages', express.static(join(__dirname, 'public/pages')));
app.use('/shared', express.static(join(__dirname, 'src/shared')));
app.use(express.json());

// Expose dev-tools directory for testing purposes
app.use('/dev-tools/time-design-test', express.static(path.resolve(__dirname, '../../dev-tools/time-design-test')));

// Set proper MIME type for ES6 modules
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// API routes
// app.use('/api/stopwatch', stopwatchRouter);
// app.use('/api/timer', timerRouter);
app.use('/api/calendar', calendarSyncRouter); // 新規追加
app.use('/auth/google', calendarSyncRouter); // OAuth コールバック用

// Serve the core package for browser clients
app.use('/vendor/@another-hour/core', express.static(path.join(__dirname, '../core/dist')));

// Settings endpoints (既存)
app.get('/api/settings', (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
    res.json(settings);
  } catch (error) {
    res.json({ showAHTime: true, showActualTime: true });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    fs.writeFileSync('settings.json', JSON.stringify(req.body));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    features: {
      clock: true,
      stopwatch: true,
      timer: true,
      googleCalendar: !!process.env.GOOGLE_CLIENT_ID
    }
  });
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Another Hour Scheduler running → http://0.0.0.0:${port}`);
  console.log(`📅 Calendar integration: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔒 Session security: ${process.env.SESSION_SECRET ? '✅ Secure' : '⚠️  Using fallback'}`);
});