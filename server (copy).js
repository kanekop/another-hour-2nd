// server.js
import express from 'express';
import fs from 'fs';
// import stopwatchRouter from './src/routes/stopwatch.js'; // ← この行をコメントアウト
// import timerRouter from './src/routes/timer.js';  // ← この行をコメントアウト
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.static('public'));
// 以下、既存の app.use(...) はそのまま

// app.use('/api/stopwatch', stopwatchRouter); // ← この行をコメントアウト
// app.use('/api/timer', timerRouter);  // ← この行をコメントアウト
app.use(express.json());

// Settings endpoints
app.get('/api/settings', (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
    res.json(settings);
  } catch (error) {
    res.json({ showAHTime: true, showActualTime: true }); // デフォルト値を返すように修正
  }
});

app.post('/api/settings', (req, res) => {
  try {
    fs.writeFileSync('settings.json', JSON.stringify(req.body));
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error); // エラーログを追加
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: './public' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running → http://0.0.0.0:${port}`);
});