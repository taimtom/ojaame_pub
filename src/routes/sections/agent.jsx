import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

import { SplashScreen } from 'src/components/loading-screen';
import { AgentGuard } from 'src/components/agent-guard';

// Lazy-loaded agent pages
const AgentLoginPage = lazy(() => import('src/pages/agent/AgentLoginPage'));
const AgentSignupPage = lazy(() => import('src/pages/agent/AgentSignupPage'));
const AgentLayout = lazy(() => import('src/pages/agent/AgentLayout'));
const AgentDashboardPage = lazy(() => import('src/pages/agent/AgentDashboardPage'));
const AgentBusinessesPage = lazy(() => import('src/pages/agent/AgentBusinessesPage'));
const AgentBusinessDetailPage = lazy(() => import('src/pages/agent/AgentBusinessDetailPage'));
const AgentEarningsPage = lazy(() => import('src/pages/agent/AgentEarningsPage'));
const AgentWithdrawalsPage = lazy(() => import('src/pages/agent/AgentWithdrawalsPage'));
const AgentSettingsPage = lazy(() => import('src/pages/agent/AgentSettingsPage'));

export const agentRoutes = [
  {
    path: 'agent',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Navigate to="agent/login" replace />
      </Suspense>
    ),
  },
  {
    path: 'agent/login',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <AgentLoginPage />
      </Suspense>
    ),
  },
  {
    path: 'agent/signup',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <AgentSignupPage />
      </Suspense>
    ),
  },
  {
    path: 'agent',
    element: (
      <AgentGuard>
        <Suspense fallback={<SplashScreen />}>
          <AgentLayout />
        </Suspense>
      </AgentGuard>
    ),
    children: [
      { path: 'dashboard', element: <Suspense fallback={<SplashScreen />}><AgentDashboardPage /></Suspense> },
      { path: 'businesses', element: <Suspense fallback={<SplashScreen />}><AgentBusinessesPage /></Suspense> },
      { path: 'businesses/:id', element: <Suspense fallback={<SplashScreen />}><AgentBusinessDetailPage /></Suspense> },
      { path: 'earnings', element: <Suspense fallback={<SplashScreen />}><AgentEarningsPage /></Suspense> },
      { path: 'withdrawals', element: <Suspense fallback={<SplashScreen />}><AgentWithdrawalsPage /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<SplashScreen />}><AgentSettingsPage /></Suspense> },
    ],
  },
];
