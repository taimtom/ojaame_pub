import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getGoogleAuthRedirectUrl, getGoogleClientId } from 'src/utils/google-auth-env';

// import { paths } from 'src/routes/paths';

export default function GoogleAuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = getGoogleClientId();
    const redirectUrl = getGoogleAuthRedirectUrl();
    if (!clientId || !redirectUrl) {
      console.error('Google OAuth: missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URL in .env');
      return;
    }
    const redirectUri = encodeURIComponent(redirectUrl);
    const scope = encodeURIComponent('openid email profile');
    const nonce = Math.random().toString(36).substring(2);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
      client_id=${clientId}&
      redirect_uri=${redirectUri}&
      response_type=id_token&
      scope=${scope}&
      nonce=${nonce}`
      .replace(/\s+/g, '');

    window.location.href = authUrl;
  }, [navigate]);

  return <div>Redirecting to Google...</div>;
}
