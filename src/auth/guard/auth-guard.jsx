import { useState, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetSubscriptionStatus } from 'src/actions/billing';
import { useOnboardingProgress } from 'src/actions/onboarding';

import { SplashScreen } from 'src/components/loading-screen';

import { SIGNUP_PENDING_PAYMENT_METHOD_KEY } from 'src/auth/signup-constants';
import {
  currentPathWithSearch,
  getOnboardingRedirectPath,
  isAllowedOnboardingPath,
  withOnboardingQuery,
} from 'src/utils/onboarding-routes';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticated, loading, user } = useAuthContext();
  const { hasPaymentMethod, statusLoading, isOwner, inTrial } = useGetSubscriptionStatus();
  const { progress, progressLoading } = useOnboardingProgress({
    skip: !(user?.email_verified && user?.company_id !== null),
  });
  const [isChecking, setIsChecking] = useState(true);

  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const checkPermissions = async () => {
    if (loading) return;

    // If not authenticated, redirect to sign-in
    if (!authenticated) {
      const { method } = CONFIG.auth;
      const signInPath = {
        jwt: paths.auth.jwt.signIn,
        auth0: paths.auth.auth0.signIn,
        amplify: paths.auth.amplify.signIn,
        firebase: paths.auth.firebase.signIn,
        supabase: paths.auth.supabase.signIn,
      }[method];
      const href = `${signInPath}?${createQueryString('returnTo', pathname)}`;
      router.replace(href);
      return;
    }

    if (authenticated && user) {
      // If user is verified but has no company (explicitly checking for null),
      // redirect them to the company page.
      if (user.email_verified && user.company_id === null && pathname !== paths.auth.jwt.company) {
        router.replace(paths.auth.jwt.company);
        return;
      }

      // If user is not verified, redirect to verify page
      if (!user.email_verified && pathname !== paths.auth.jwt.verify) {
        router.replace(paths.auth.jwt.verify);
        return;
      }

      // If user is verified and has a company, but they are on the company page,
      // redirect into guided setup or the dashboard.
      if (user.email_verified && user.company_id !== null && pathname === paths.auth.jwt.company) {
        if (progressLoading) {
          return;
        }
        if (progress && progress.is_owner && !progress.onboarding_completed) {
          router.replace(getOnboardingRedirectPath(progress));
        } else {
          router.replace(paths.dashboard.root);
        }
        return;
      }

      const paymentGateApplies =
        user.email_verified && user.company_id !== null && isOwner;

      if (paymentGateApplies && (statusLoading || progressLoading)) {
        return;
      }

      const onboardingActive =
        progress && progress.is_owner && !progress.onboarding_completed;

      if (onboardingActive) {
        const allowed = isAllowedOnboardingPath(pathname, searchParams, progress);
        if (!allowed) {
          const target = getOnboardingRedirectPath(progress);
          const current = currentPathWithSearch(pathname, searchParams);
          if (target && target !== current) {
            if (progress.current_step === 'card') {
              try {
                localStorage.setItem(SIGNUP_PENDING_PAYMENT_METHOD_KEY, '1');
              } catch {
                /* ignore */
              }
            }
            router.replace(target);
            return;
          }
        }
      } else if (paymentGateApplies && !hasPaymentMethod && !inTrial) {
        const onBillingTab =
          pathname === paths.dashboard.user.account && searchParams.get('tab') === 'billing';
        if (!onBillingTab) {
          try {
            localStorage.setItem(SIGNUP_PENDING_PAYMENT_METHOD_KEY, '1');
          } catch {
            /* ignore */
          }
          router.replace(withOnboardingQuery(`${paths.dashboard.user.account}?tab=billing`));
          return;
        }
      }
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authenticated,
    loading,
    user,
    pathname,
    searchParams,
    hasPaymentMethod,
    inTrial,
    statusLoading,
    isOwner,
    progress,
    progressLoading,
  ]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
