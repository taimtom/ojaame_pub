/**
 * Google OAuth configuration for integrations (Calendar, Drive, etc.).
 * Credentials come from `.env` — no hardcoded client IDs.
 */

import { getGoogleClientId } from 'src/utils/google-auth-env';

function getIntegrationRedirectUri() {
  if (typeof window !== 'undefined') {
    const path = import.meta.env.VITE_OAUTH_REDIRECT_BASE ?? '/app/integration/oauth-success';
    return `${window.location.origin}${path}`;
  }
  return import.meta.env.VITE_GOOGLE_INTEGRATION_REDIRECT_URL || '';
}

export const STATIC_GOOGLE_OAUTH_CONFIG = {
  get client_secrets() {
    return {
      web: {
        client_id: getGoogleClientId(),
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
      },
    };
  },
  get redirect_uri() {
    return getIntegrationRedirectUri();
  },
};

export const GOOGLE_OAUTH_SCOPES = {
  profile: 'https://www.googleapis.com/auth/userinfo.profile',
  email: 'https://www.googleapis.com/auth/userinfo.email',
  gmail_send: 'https://www.googleapis.com/auth/gmail.send',
  gmail_modify: 'https://www.googleapis.com/auth/gmail.modify',
  gmail_readonly: 'https://www.googleapis.com/auth/gmail.readonly',
  drive_file: 'https://www.googleapis.com/auth/drive.file',
  drive: 'https://www.googleapis.com/auth/drive',
  drive_readonly: 'https://www.googleapis.com/auth/drive.readonly',
  calendar_events: 'https://www.googleapis.com/auth/calendar.events',
  calendar: 'https://www.googleapis.com/auth/calendar',
  calendar_readonly: 'https://www.googleapis.com/auth/calendar.readonly',
};

export const INTEGRATION_SCOPE_SETS = {
  email: [GOOGLE_OAUTH_SCOPES.gmail_send, GOOGLE_OAUTH_SCOPES.drive_file],
  drive: [GOOGLE_OAUTH_SCOPES.gmail_send, GOOGLE_OAUTH_SCOPES.drive_file],
};

export const DEFAULT_INTEGRATION_SCOPES = INTEGRATION_SCOPE_SETS.email;

export function generateGoogleOAuthUrl(integrationId, integrationType = 'email') {
  const selectedScopes = INTEGRATION_SCOPE_SETS[integrationType] || DEFAULT_INTEGRATION_SCOPES;
  const cfg = STATIC_GOOGLE_OAUTH_CONFIG;
  const params = new URLSearchParams({
    client_id: cfg.client_secrets.web.client_id,
    redirect_uri: cfg.redirect_uri,
    response_type: 'code',
    scope: selectedScopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: JSON.stringify({
      integrationId,
      timestamp: Date.now(),
      source: 'point-of-sales',
    }),
  });

  if (integrationId) {
    localStorage.setItem('pendingIntegrationId', integrationId);
  }

  return `${cfg.client_secrets.web.auth_uri}?${params.toString()}`;
}

export default STATIC_GOOGLE_OAUTH_CONFIG;
