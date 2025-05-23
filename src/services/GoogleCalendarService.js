// src/services/GoogleCalendarService.js

export class GoogleCalendarService {
  constructor() {
    // Replit Secretsから認証情報を取得
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Replitの本番URLまたはローカル開発URL
    const baseUrl = process.env.REPL_URL || 'http://localhost:3000';
    this.redirectUri = `${baseUrl}/auth/google/callback`;

    // 必要なスコープ
    this.scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    if (!this.clientId || !this.clientSecret) {
      console.error('Google OAuth credentials not found in environment variables');
    }
  }

  /**
   * Google OAuth認証URLを生成
   * @returns {string} 認証URL
   */
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: this.scopes.join(' '),
      redirect_uri: this.redirectUri,
      access_type: 'offline',
      prompt: 'consent',
      state: this.generateState() // CSRF保護用
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  /**
   * 認証コードをアクセストークンに交換
   * @param {string} code - Google認証コード
   * @returns {Promise<Object>} トークン情報
   */
  async exchangeCodeForTokens(code) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      console.log('Token exchange successful');

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * リフレッシュトークンを使用してアクセストークンを更新
   * @param {string} refreshToken - リフレッシュトークン
   * @returns {Promise<Object>} 新しいトークン情報
   */
  async refreshAccessToken(refreshToken) {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const tokenData = await response.json();

      return {
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in,
        tokenType: tokenData.token_type
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * ユーザーのカレンダーリストを取得
   * @param {string} accessToken - アクセストークン
   * @returns {Promise<Array>} カレンダーリスト
   */
  async getCalendarList(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch calendars: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw error;
    }
  }

  /**
   * カレンダーのイベントを取得
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID（デフォルト: 'primary'）
   * @param {Date} timeMin - 開始時刻
   * @param {Date} timeMax - 終了時刻
   * @returns {Promise<Array>} イベントリスト
   */
  async getCalendarEvents(accessToken, calendarId = 'primary', timeMin, timeMax) {
    try {
      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250 // 一度に取得する最大イベント数
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * イベントを作成
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {Object} eventData - イベントデータ
   * @returns {Promise<Object>} 作成されたイベント
   */
  async createEvent(accessToken, calendarId = 'primary', eventData) {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create event: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * イベントを更新
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {string} eventId - イベントID
   * @param {Object} eventData - 更新するイベントデータ
   * @returns {Promise<Object>} 更新されたイベント
   */
  async updateEvent(accessToken, calendarId = 'primary', eventId, eventData) {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update event: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * イベントを削除
   * @param {string} accessToken - アクセストークン
   * @param {string} calendarId - カレンダーID
   * @param {string} eventId - イベントID
   * @returns {Promise<void>}
   */
  async deleteEvent(accessToken, calendarId = 'primary', eventId) {
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete event: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * CSRF保護用のstate値を生成
   * @returns {string} ランダムなstate値
   */
  generateState() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * アクセストークンの有効性をチェック
   * @param {string} accessToken - チェックするアクセストークン
   * @returns {Promise<boolean>} 有効かどうか
   */
  async validateAccessToken(accessToken) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
      return response.ok;
    } catch (error) {
      console.error('Error validating access token:', error);
      return false;
    }
  }
}