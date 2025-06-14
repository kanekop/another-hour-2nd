/**
 * Another Hour Scheduler Web Server
 * 
 * 🔴 重要: 開発サーバーはポート3000で動作します
 * URL: http://localhost:3000
 * 
 * ポートを変更する場合は環境変数PORTを設定してください:
 * PORT=8080 npm run dev
 */

import express from 'express';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000; // デフォルトポート: 3000

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'another-hour-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve dev-tools directory for development and testing
app.use('/dev-tools', express.static(path.join(__dirname, '../../dev-tools')));

// Serve core package from vendor path
app.use('/vendor/@another-hour/core', express.static(path.join(__dirname, '../core/src')));

// Import routes
import calendarSyncRoutes from './src/routes/calendar-sync.js';
import stopwatchRoutes from './src/routes/stopwatch.js';
import timerRoutes from './src/routes/timer.js';

// Use routes
app.use('/api/calendar-sync', calendarSyncRoutes);
app.use('/api/stopwatch', stopwatchRoutes);
app.use('/api/timer', timerRoutes);

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve other pages
app.get('/clock', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'main-clock.html'));
});

app.get('/scheduler', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'scheduler.html'));
});

app.get('/converter', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'converter.html'));
});

app.get('/timer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'timer.html'));
});

app.get('/stopwatch', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'stopwatch.html'));
});

app.get('/world-clock', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'world-clock.html'));
});

app.get('/calendar-sync', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'calendar-sync.html'));
});

app.get('/personalized-clock', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'personalized-ah-clock.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Another Hour Scheduler server running on http://0.0.0.0:${PORT}`);
});
