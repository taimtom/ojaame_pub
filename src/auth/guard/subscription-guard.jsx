import { Navigate, useLocation } from 'react-router-dom';

import { useGetSubscriptionStatus } from 'src/actions/billing';
import { NotFoundView } from 'src/sections/error';

// ---------------------------------------------------------------------------

// Pages that remain accessible even when the subscription is deactivated.
// These paths match the start of the current pathname.
const ALLOWED_PATHS = [
  '/app/quick-dashboard',
  '/app/quick-sale',
  '/app/user/account',
  '/app/user/notifications',
  '/app/notifications',
];

// ---------------------------------------------------------------------------

export function SubscriptionGuard({ children }) {
  const { status, isOwner, statusLoading } = useGetSubscriptionStatus();
  const { pathname } = useLocation();

  // Don't block while loading — avoids a flash of the 404 or redirect
  if (statusLoading) {
    return <>{children}</>;
  }

  if (status === 'deactivated') {
    const isAllowed = ALLOWED_PATHS.some((p) => pathname.startsWith(p));
    if (!isAllowed) {
      if (isOwner) {
        // Owner: redirect to billing settings page
        return <Navigate to="/app/user/account?tab=billing" replace />;
      }
      // Staff: show 404 page
      return <NotFoundView />;
    }
  }

  return <>{children}</>;
}
