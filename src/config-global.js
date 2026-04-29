import { paths } from 'src/routes/paths';

import packageJson from '../package.json';

// ----------------------------------------------------------------------

export const CONFIG = {
  site: {
    name: 'Ojaa Me',
    // Use || so empty string falls back (?? only treats null/undefined).
    serverUrl: import.meta.env.VITE_SERVER_URL || 'http://localhost:8004',
    assetURL: import.meta.env.VITE_ASSET_URL ?? '',
    basePath: import.meta.env.VITE_BASE_PATH ?? '',
    version: packageJson.version,
  },
  /**
   * Auth
   * @method jwt | amplify | firebase | supabase | auth0
   */
  auth: {
    method: 'jwt',
    skip: false,
    redirectPath: paths.dashboard.root,
  },
  /**
   * Mapbox
   */
  mapbox: {
    apiKey: import.meta.env.VITE_MAPBOX_API_KEY ?? '',
  },
  /**
   * Firebase
   */
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APPID ?? '',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? '',
  },
  /**
   * Amplify
   */
  amplify: {
    userPoolId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_ID ?? '',
    userPoolWebClientId: import.meta.env.VITE_AWS_AMPLIFY_USER_POOL_WEB_CLIENT_ID ?? '',
    region: import.meta.env.VITE_AWS_AMPLIFY_REGION ?? '',
  },
  /**
   * Auth0
   */
  auth0: {
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID ?? '',
    domain: import.meta.env.VITE_AUTH0_DOMAIN ?? '',
    callbackUrl: import.meta.env.VITE_AUTH0_CALLBACK_URL ?? '',
  },
  /**
   * Supabase
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL ?? '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  },
  /**
   * Google OAuth - Using static configuration
   */
  google: {
    clientId: import.meta.env.GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET ?? '',
    authUrl: import.meta.env.VITE_GOOGLE_AUTH_URL ?? 'https://accounts.google.com/o/oauth2/auth',
    tokenUrl: import.meta.env.VITE_GOOGLE_TOKEN_URL ?? 'https://oauth2.googleapis.com/token',
    redirectBase: import.meta.env.VITE_OAUTH_REDIRECT_BASE ?? '/app/integration/oauth-success',
  },
  /**
   * Jumia
   */
  jumia: {
    apiKey: import.meta.env.VITE_JUMIA_API_KEY ?? '',
    userId: import.meta.env.VITE_JUMIA_USER_ID ?? '',
    endpoint: import.meta.env.VITE_JUMIA_ENDPOINT ?? 'https://vendor-api-staging.jumia.com',
  },
};
