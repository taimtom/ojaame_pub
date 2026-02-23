// src/pages/auth/GoogleCallbackPage.jsx
import React, { useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';
import { signInWithGoogle } from 'src/auth/context/jwt';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const reloadKey = 'googleCallbackReloadCount';

    async function handleOAuth() {
      try {
        // 1. Extract id_token from URL
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const idToken = params.get('id_token');
        if (!idToken) throw new Error('No id_token found.');

        // 2. Sign in and refresh user context
        await signInWithGoogle(idToken);
        const freshUser = typeof refreshUser === 'function' ? await refreshUser() : null;
        const companyId = freshUser?.company_id;

        // 3a. If company_id is defined and not null => dashboard
        if (companyId != null) {
          sessionStorage.removeItem(reloadKey);
          router.replace(paths.dashboard.root);
        }
        // 3b. If company_id is undefined => retry up to 2 times
        else if (companyId === undefined) {
          const attempts = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
          if (attempts < 2) {
            sessionStorage.setItem(reloadKey, (attempts + 1).toString());
            window.location.reload();
          } else {
            sessionStorage.removeItem(reloadKey);
            throw new Error('Unable to verify company affiliation.');
          }
        }
        // 3c. company_id is explicitly null => redirect to company setup
        else {
          sessionStorage.removeItem(reloadKey);
          router.replace(paths.auth.jwt.company);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setProcessing(false);
      }
    }

    handleOAuth();
    return () => { isMounted = false; };
  }, [router, refreshUser]);

  if (processing) return <SplashScreen />;

  if (error) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p>Authentication failed. Please try again.</p>
        <button type="button" onClick={() => router.replace(paths.auth.jwt.signIn)}>
          Retry Sign In
        </button>
      </div>
    );
  }

  return null;
}
