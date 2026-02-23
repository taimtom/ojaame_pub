import { lazy, Suspense } from 'react';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// OAuth callback pages
const OAuthSuccessPage = lazy(() => import('src/pages/dashboard/integration/oauth-success'));

// ----------------------------------------------------------------------

export const appRoutes = [
  {
    path: '/app',
    children: [
      {
        path: 'integration',
        children: [
          {
            path: 'oauth-success',
            element: (
              <Suspense fallback={<SplashScreen />}>
                <OAuthSuccessPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
];

