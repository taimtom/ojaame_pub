import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// import { paths } from 'src/routes/paths';

export default function GoogleAuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const GOOGLE_CLIENT_ID = '181864963042-iu9uubcbthf2tncerkarlnp4ehepk7cr.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent('http://localhost:3030/auth/jwt/google-callback');
    const scope = encodeURIComponent('openid email profile');
    const nonce = Math.random().toString(36).substring(2);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
      client_id=${GOOGLE_CLIENT_ID}&
      redirect_uri=${redirectUri}&
      response_type=id_token&
      scope=${scope}&
      nonce=${nonce}`
      .replace(/\s+/g, '');

    window.location.href = authUrl;
  }, [navigate]);

  return <div>Redirecting to Google...</div>;
}
