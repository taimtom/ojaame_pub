import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';

import axios, { endpoints } from 'src/utils/axios';
import { getAuthToken } from 'src/utils/auth-storage';

import { setSession, isValidToken } from './utils';
import { AuthContext } from '../auth-context';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = await getAuthToken();

      if (accessToken && isValidToken(accessToken)) {
        await setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);
        // If the API returns the user data directly, use:
        const userData = res.data;
        setState({ user: { ...userData, accessToken }, loading: false });

      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            id: state.user?.sub,
            user_id: state.user?.user_id,
            email: state.user?.email,
            displayName: state.user?.lastName,
            photoURL: state.user?.picture,
            role: state.user?.role ?? null,
          }
        : null,

      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
