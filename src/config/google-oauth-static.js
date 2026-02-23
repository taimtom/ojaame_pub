/**
 * Static Google OAuth Configuration
 *
 * This file contains the simplified Google OAuth credentials for the Point-of-Sales system.
 * Configuration matches the required format for all integration types (email, drive, calendar, meetings)
 */

export const STATIC_GOOGLE_OAUTH_CONFIG = {
  client_secrets: {
    web: {
      client_id: "541093981222-hujc3uce8udf8ibfdt4vfjd5e180gtsc.apps.googleusercontent.com",
      client_secret: "isX8kUpmYO32V5G7pwcyytTw",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token"
    }
  },
  redirect_uri: "http://localhost:3030/app/integration/oauth-success"
};

export const GOOGLE_OAUTH_SCOPES = {
  // Basic profile scopes (always included)
  profile: "https://www.googleapis.com/auth/userinfo.profile",
  email: "https://www.googleapis.com/auth/userinfo.email",

  // Gmail scopes
  gmail_send: "https://www.googleapis.com/auth/gmail.send",
  gmail_modify: "https://www.googleapis.com/auth/gmail.modify",
  gmail_readonly: "https://www.googleapis.com/auth/gmail.readonly",

  // Google Drive scopes
  drive_file: "https://www.googleapis.com/auth/drive.file",
  drive: "https://www.googleapis.com/auth/drive",
  drive_readonly: "https://www.googleapis.com/auth/drive.readonly",

  // Google Calendar scopes
  calendar_events: "https://www.googleapis.com/auth/calendar.events",
  calendar: "https://www.googleapis.com/auth/calendar",
  calendar_readonly: "https://www.googleapis.com/auth/calendar.readonly"
};

// Fixed scope configurations to prevent scope change errors
// All integrations use the same comprehensive set of scopes
export const INTEGRATION_SCOPE_SETS = {
  // Unified scope set - same scopes for all integration types to prevent OAuth errors
  email: [
    GOOGLE_OAUTH_SCOPES.gmail_send,
    GOOGLE_OAUTH_SCOPES.drive_file
  ],

  // Drive integration uses same base scopes
  drive: [
    GOOGLE_OAUTH_SCOPES.gmail_send,
    GOOGLE_OAUTH_SCOPES.drive_file
  ],

  // Calendar integration with consistent base scopes
  // calendar: [
  //   GOOGLE_OAUTH_SCOPES.profile,
  //   GOOGLE_OAUTH_SCOPES.email,
  //   GOOGLE_OAUTH_SCOPES.gmail_send,
  //   GOOGLE_OAUTH_SCOPES.drive_file,
  //   GOOGLE_OAUTH_SCOPES.calendar_events
  // ],

  // // Meet integration with consistent base scopes
  // meet: [
  //   GOOGLE_OAUTH_SCOPES.profile,
  //   GOOGLE_OAUTH_SCOPES.email,
  //   GOOGLE_OAUTH_SCOPES.gmail_send,
  //   GOOGLE_OAUTH_SCOPES.drive_file,
  //   GOOGLE_OAUTH_SCOPES.calendar_events
  // ],

  // // Full integration with all services
  // full: [
  //   GOOGLE_OAUTH_SCOPES.profile,
  //   GOOGLE_OAUTH_SCOPES.email,
  //   GOOGLE_OAUTH_SCOPES.gmail_send,
  //   GOOGLE_OAUTH_SCOPES.gmail_modify,
  //   GOOGLE_OAUTH_SCOPES.drive_file,
  //   GOOGLE_OAUTH_SCOPES.drive,
  //   GOOGLE_OAUTH_SCOPES.calendar_events,
  //   GOOGLE_OAUTH_SCOPES.calendar
  // ]
};

// Default to basic email scopes to match backend
export const DEFAULT_INTEGRATION_SCOPES = INTEGRATION_SCOPE_SETS.email;

/**
 * Generate OAuth URL with static configuration
 */
export function generateGoogleOAuthUrl(integrationId, integrationType = 'email') {
  const selectedScopes = INTEGRATION_SCOPE_SETS[integrationType] || DEFAULT_INTEGRATION_SCOPES;
  const params = new URLSearchParams({
    client_id: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets.web.client_id,
    redirect_uri: STATIC_GOOGLE_OAUTH_CONFIG.redirect_uri,
    response_type: 'code',
    scope: selectedScopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({
      integrationId,
      timestamp: Date.now(),
      source: 'point-of-sales'
    })
  });

  // Store integration ID in localStorage as backup
  if (integrationId) {
    localStorage.setItem('pendingIntegrationId', integrationId);
  }

  return `${STATIC_GOOGLE_OAUTH_CONFIG.client_secrets.web.auth_uri}?${params.toString()}`;
}

export default STATIC_GOOGLE_OAUTH_CONFIG;

