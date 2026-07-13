import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { paths } from 'src/routes/paths';
import { SplashScreen } from 'src/components/loading-screen';
import { useAuthContext } from 'src/auth/hooks';
import { ExternalRedirect } from 'src/components/external-redirect';

import { appRoutes } from './app';
import { authRoutes } from './auth';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';
import { agentRoutes } from './agent';
import { storeSiteRoutes } from './store-site';

const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://ojaa.me';

const ReferralRedirectPage = lazy(() => import('src/pages/ReferralRedirectPage'));
const SetupPrefillPage = lazy(() => import('src/pages/SetupPrefillPage'));

// ----------------------------------------------------------------------

function RootRedirect() {
  const { authenticated, loading } = useAuthContext();
  if (loading) return <SplashScreen />;
  if (authenticated) return <Navigate to={paths.dashboard.quickDashboard} replace />;
  return <Navigate to={paths.auth.jwt.signIn} replace />;
}

export function Router() {
  return useRoutes([
    {
      path: '/',
      element: <RootRedirect />,
    },

    // Auth
    ...authRoutes,
    ...authDemoRoutes,

    // Dashboard
    ...dashboardRoutes,

    // App routes
    ...appRoutes,

    // Agent portal
    ...agentRoutes,

    // Components (internal demos — keep for dev)
    ...componentsRoutes,

    // Legacy embedded storefront (app.ojaa.me/site/:slug)
    ...storeSiteRoutes,

    // Legacy marketing paths → ojaa.me
    { path: 'about-us', element: <ExternalRedirect to={`${MARKETING_URL}/about-us`} /> },
    { path: 'contact-us', element: <ExternalRedirect to={`${MARKETING_URL}/contact-us`} /> },
    { path: 'faqs', element: <ExternalRedirect to={`${MARKETING_URL}/faqs`} /> },
    { path: 'pricing', element: <ExternalRedirect to={`${MARKETING_URL}/pricing`} /> },
    { path: 'post/*', element: <ExternalRedirect to={`${MARKETING_URL}/blogs`} /> },
    { path: 'blogs/*', element: <ExternalRedirect to={`${MARKETING_URL}/blogs`} /> },

    // Referral agent link redirect (stays on app subdomain)
    {
      path: 'ref/:agentCode',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <ReferralRedirectPage />
        </Suspense>
      ),
    },
    {
      path: 'setup/prefill',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <SetupPrefillPage />
        </Suspense>
      ),
    },

    // No match
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
