import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { MainLayout } from 'src/layouts/main';

import { paths } from 'src/routes/paths';
import { SplashScreen } from 'src/components/loading-screen';
import { useAuthContext } from 'src/auth/hooks';

import { appRoutes } from './app';
import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';
import { agentRoutes } from './agent';

const ReferralRedirectPage = lazy(() => import('src/pages/ReferralRedirectPage'));

// ----------------------------------------------------------------------

const HomePage = lazy(() => import('src/pages/home'));

function RootRedirect() {
  const { authenticated, loading } = useAuthContext();
  if (loading) return <SplashScreen />;
  if (authenticated) return <Navigate to={paths.dashboard.quickDashboard} replace />;
  return (
    <Suspense fallback={<SplashScreen />}>
      <MainLayout>
        <HomePage />
      </MainLayout>
    </Suspense>
  );
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

    // Main
    ...mainRoutes,

    // Components
    ...componentsRoutes,

    // Referral agent link redirect
    {
      path: 'ref/:agentCode',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <ReferralRedirectPage />
        </Suspense>
      ),
    },

    // No match
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
