// src/routes/calendar-sync.js
import express from 'express';
import { GoogleCalendarService } from '../services/GoogleCalendarService.js';

const router = express.Router();
const googleCalendar = new GoogleCalendarService();

// セッションでトークンを管理するためのヘルパー関数
const getStoredTokens = (req) => req.session.googleTokens || null;
const storeTokens = (req, tokens) => { req.session.googleTokens = tokens; };
const clearTokens = (req) => { delete req.session.googleTokens; };

/**
 * Google OAuth認証URLを取得
 * GET /api/calendar/google/auth-url
 */
router.get('/google/auth-url', (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthUrl();
    res.json({ 
      authUrl,
      success: true 
    });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate authentication URL',
      success: false 
    });
  }
});

/**
 * Google OAuth認証コールバック
 * GET /auth/google/callback
 */
router.get('/callback', async (req, res) => {
  const { code, error, state } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/?error=oauth_denied');
  }

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // 認証コードをトークンに交換
    const tokens = await googleCalendar.exchangeCodeForTokens(code);

    // セッションにトークンを保存
    storeTokens(req, tokens);

    // 認証成功をフロントエンドに通知するページを表示
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Successful</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .success { color: #4CAF50; font-size: 24px; margin-bottom: 20px; }
          .message { color: #666; margin-bottom: 20px; }
          button { 
            background: #4CAF50; color: white; border: none; 
            padding: 10px 20px; border-radius: 4px; cursor: pointer; 
          }
        </style>
      </head>
      <body>
        <div class="success">✅ Google Calendar Connected!</div>
        <div class="message">You can now close this window and return to the scheduler.</div>
        <button onclick="window.close()">Close Window</button>
        <script>
          // 親ウィンドウに認証成功を通知
          if (window.opener) {
            window.opener.postMessage({
              type: 'google-auth-success',
              tokens: ${JSON.stringify({ accessToken: tokens.accessToken })}
            }, '*');
          }
          setTimeout(() => window.close(), 3000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.redirect('/?error=token_exchange_failed');
  }
});

/**
 * 認証状態を確認
 * GET /api/calendar/google/status
 */
router.get('/google/status', async (req, res) => {
  try {
    const tokens = getStoredTokens(req);

    if (!tokens || !tokens.accessToken) {
      return res.json({ 
        authenticated: false,
        message: 'No authentication tokens found'
      });
    }

    // トークンの有効性を確認
    const isValid = await googleCalendar.validateAccessToken(tokens.accessToken);

    if (!isValid && tokens.refreshToken) {
      // リフレッシュトークンでアクセストークンを更新
      try {
        const newTokens = await googleCalendar.refreshAccessToken(tokens.refreshToken);
        const updatedTokens = { ...tokens, ...newTokens };
        storeTokens(req, updatedTokens);

        return res.json({ 
          authenticated: true,
          message: 'Authentication refreshed'
        });
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        clearTokens(req);
        return res.json({ 
          authenticated: false,
          message: 'Authentication expired and refresh failed'
        });
      }
    }

    res.json({ 
      authenticated: isValid,
      message: isValid ? 'Authentication valid' : 'Authentication invalid'
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ 
      authenticated: false,
      error: 'Failed to check authentication status'
    });
  }
});

/**
 * カレンダーリストを取得
 * GET /api/calendar/google/calendars
 */
router.get('/google/calendars', async (req, res) => {
  try {
    const tokens = getStoredTokens(req);

    if (!tokens || !tokens.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const calendars = await googleCalendar.getCalendarList(tokens.accessToken);

    res.json({ 
      calendars: calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        primary: cal.primary,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor
      })),
      success: true
    });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendars',
      success: false 
    });
  }
});

/**
 * カレンダーイベントを取得
 * POST /api/calendar/google/events
 */
router.post('/google/events', async (req, res) => {
  try {
    const tokens = getStoredTokens(req);

    if (!tokens || !tokens.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { 
      calendarId = 'primary',
      timeMin,
      timeMax
    } = req.body;

    // デフォルトの時間範囲（今週）
    const startTime = timeMin ? new Date(timeMin) : (() => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;
    })();

    const endTime = timeMax ? new Date(timeMax) : (() => {
      const startOfWeek = new Date(startTime);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      return endOfWeek;
    })();

    const events = await googleCalendar.getCalendarEvents(
      tokens.accessToken,
      calendarId,
      startTime,
      endTime
    );

    // イベントデータを整形
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees || [],
      source: 'google',
      calendarId: calendarId,
      originalEvent: event
    }));

    res.json({ 
      events: formattedEvents,
      totalEvents: formattedEvents.length,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString()
      },
      success: true
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      error: 'Failed to fetch events',
      success: false 
    });
  }
});

/**
 * イベントを作成
 * POST /api/calendar/google/events/create
 */
router.post('/google/events/create', async (req, res) => {
  try {
    const tokens = getStoredTokens(req);

    if (!tokens || !tokens.accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { 
      calendarId = 'primary',
      title,
      description,
      start,
      end,
      location,
      attendees
    } = req.body;

    // イベントデータを構築
    const eventData = {
      summary: title,
      description: description || '',
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    if (location) {
      eventData.location = location;
    }

    if (attendees && attendees.length > 0) {
      eventData.attendees = attendees.map(email => ({ email }));
    }

    const createdEvent = await googleCalendar.createEvent(
      tokens.accessToken,
      calendarId,
      eventData
    );

    res.json({ 
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: createdEvent.start.dateTime,
        end: createdEvent.end.dateTime,
        source: 'google'
      },
      success: true
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: 'Failed to create event',
      success: false 
    });
  }
});

/**
 * 認証をクリア
 * POST /api/calendar/google/disconnect
 */
router.post('/google/disconnect', (req, res) => {
  try {
    clearTokens(req);
    res.json({ 
      success: true,
      message: 'Google Calendar disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect',
      success: false 
    });
  }
});

export default router;