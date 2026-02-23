/**
 * Google OAuth Configuration Utility
 *
 * This module provides centralized configuration for Google OAuth integration
 * within the Point-of-Sales frontend application. It includes:
 * - Client credentials management
 * - OAuth scope definitions
 * - URL generation for authentication flows
 * - Error handling utilities
 */

import { CONFIG } from 'src/config-global';
import { INTEGRATION_SCOPE_SETS } from 'src/config/google-oauth-static';

// Google OAuth Scopes for different service integrations
export const GOOGLE_OAUTH_SCOPES = {
  // Basic profile access
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile',
  EMAIL: 'https://www.googleapis.com/auth/userinfo.email',

  // Gmail services
  GMAIL_SEND: 'https://www.googleapis.com/auth/gmail.send',
  GMAIL_READONLY: 'https://www.googleapis.com/auth/gmail.readonly',
  GMAIL_MODIFY: 'https://www.googleapis.com/auth/gmail.modify',

  // Google Drive services
  DRIVE_FILE: 'https://www.googleapis.com/auth/drive.file',
  DRIVE_READONLY: 'https://www.googleapis.com/auth/drive.readonly',
  DRIVE: 'https://www.googleapis.com/auth/drive',

  // Google Calendar services
  CALENDAR_EVENTS: 'https://www.googleapis.com/auth/calendar.events',
  CALENDAR_READONLY: 'https://www.googleapis.com/auth/calendar.readonly',
  CALENDAR: 'https://www.googleapis.com/auth/calendar',

  // Google Meet services
  MEET: 'https://www.googleapis.com/auth/meetings.space.created',
};

// Import static scope sets to ensure consistency

// Use the static scope sets to ensure backend compatibility
export const INTEGRATION_SCOPES = INTEGRATION_SCOPE_SETS;

/**
 * Google OAuth Configuration Class
 * Manages OAuth settings and provides helper methods
 */
export class GoogleOAuthConfig {
  constructor() {
    this.clientId = CONFIG.google.clientId;
    this.clientSecret = CONFIG.google.clientSecret;
    this.authUrl = CONFIG.google.authUrl;
    this.tokenUrl = CONFIG.google.tokenUrl;
    this.redirectBase = CONFIG.google.redirectBase;
  }

  /**
   * Validates if OAuth credentials are configured
   * @returns {boolean} True if credentials are available
   */
  isConfigured() {
    return !!(this.clientId && this.clientSecret);
  }

  /**
   * Gets the client ID for frontend use
   * @returns {string} Google OAuth Client ID
   */
  getClientId() {
    return this.clientId;
  }

  /**
   * Gets the client secret (should only be used server-side)
   * @returns {string} Google OAuth Client Secret
   */
  getClientSecret() {
    if (typeof window !== 'undefined') {
      console.warn('Client secret should not be accessed in browser environment');
    }
    return this.clientSecret;
  }

  /**
   * Generates OAuth authorization URL with consistent scopes
   * @param {string} integrationId - Unique integration identifier
   * @param {string} integrationType - Type of integration (email, drive, calendar, etc.)
   * @param {string} redirectUri - Custom redirect URI (optional)
   * @returns {string} Complete OAuth authorization URL
   */
  generateAuthUrl(integrationId, integrationType = 'email', redirectUri = null) {
    if (!this.isConfigured()) {
      throw new Error('Google OAuth is not properly configured');
    }

    // Use fixed scope set to prevent "scope has changed" errors
    // All integrations get the same comprehensive scope set
    const fixedScopes = [
      // 'https://www.googleapis.com/auth/userinfo.profile',
      // 'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/drive.file'
    ];

    // Use the configured redirect URI from static config
    const redirect = redirectUri || 'http://localhost:3030/app/integration/oauth-success';

    // Store integration ID in localStorage as backup
    if (integrationId) {
      localStorage.setItem('pendingIntegrationId', integrationId);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirect,
      response_type: 'code',
      scope: fixedScopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({
        integrationId,
        integrationType,
        timestamp: Date.now(),
      }),
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  /**
   * Generates redirect URI from current origin
   * @param {string} customPath - Custom path for redirect (optional)
   * @returns {string} Complete redirect URI
   */
  generateRedirectUri(customPath = null) {
    const baseUrl = window.location.origin;
    const path = customPath || this.redirectBase;
    return `${baseUrl}${path}`;
  }

  /**
   * Validates OAuth state parameter
   * @param {string} state - State parameter from OAuth callback
   * @returns {object|null} Parsed state object or null if invalid
   */
  static validateState(state) {
    try {
      const stateData = JSON.parse(decodeURIComponent(state));

      if (!stateData.integrationId || !stateData.timestamp) {
        return null;
      }

      const now = Date.now();
      const stateAge = now - stateData.timestamp;
      const maxAge = 30 * 60 * 1000; // 30 minutes

      if (stateAge > maxAge) {
        console.warn('OAuth state is too old');
        return null;
      }

      return stateData;
    } catch (err) {
      console.error('Failed to parse OAuth state:', err);
      return null;
    }
  }

  /**
   * Gets the configuration object for @react-oauth/google
   * @returns {object} Configuration object
   */
  getReactOAuthConfig() {
    return {
      clientId: this.clientId,
      onSuccess: (response) => {
        console.log('Google OAuth Success:', response);
      },
      onError: (error) => {
        console.error('Google OAuth Error:', error);
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    };
  }

  /**
   * Creates OAuth configuration for specific integration type
   * @param {string} integrationType - Type of integration
   * @param {function} onSuccess - Success callback
   * @param {function} onError - Error callback
   * @returns {object} Integration-specific OAuth config
   */
  createIntegrationConfig(integrationType, onSuccess, onError) {
    const scopes = INTEGRATION_SCOPES[integrationType] || INTEGRATION_SCOPES.full;

    return {
      clientId: this.clientId,
      scope: scopes.join(' '),
      onSuccess: onSuccess || (() => {}),
      onError: onError || (() => {}),
      flow: 'auth-code',
    };
  }
}

// Export singleton instance
export const googleOAuthConfig = new GoogleOAuthConfig();

// Export default configuration object for immediate use
export default {
  clientId: CONFIG.google.clientId,
  clientSecret: CONFIG.google.clientSecret,
  isConfigured: () => !!(CONFIG.google.clientId && CONFIG.google.clientSecret),
  scopes: GOOGLE_OAUTH_SCOPES,
  integrationScopes: INTEGRATION_SCOPES,
  config: googleOAuthConfig,
};
