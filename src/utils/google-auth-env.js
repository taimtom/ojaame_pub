/**
 * Google OAuth values from `.env` (requires `envPrefix` including `GOOGLE_` in vite.config.js).
 * Supports legacy `VITE_GOOGLE_CLIENT_ID` / `VITE_GOOGLE_REDIRECT_URL` for compatibility.
 */

export function getGoogleClientId() {
  return import.meta.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
}

/** Full redirect URL registered in Google Cloud Console (e.g. http://localhost:3030/auth/google). */
export function getGoogleAuthRedirectUrl() {
  return import.meta.env.GOOGLE_REDIRECT_URL || import.meta.env.VITE_GOOGLE_REDIRECT_URL || '';
}
