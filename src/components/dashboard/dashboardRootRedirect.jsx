// DashboardRootRedirect.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { paramCase } from 'src/utils/change-case';

import { useAuthContext } from 'src/auth/hooks';

export default function DashboardRootRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext(); // user object includes user_id and other login info

  useEffect(() => {
    // Allow direct access to pages that are NOT store-scoped.
    const nonStorePages = [
      paths.dashboard.general.analytics,
      paths.dashboard.reports?.companyRoot,
      paths.dashboard.user?.root,
      paths.dashboard.integration?.root,
      paths.dashboard.role?.root,
      paths.dashboard.role?.new,
    ];
    if (nonStorePages.some((p) => p && location.pathname.startsWith(p))) {
      return;
    }

    // Try to get the active workspace from localStorage.
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');

    // If there is no active workspace or user data, redirect immediately to the store list.
    if (!activeWorkspaceJson || !user || !user.user_id) {
      navigate(paths.dashboard.store.list, { replace: true });
      return;
    }

    const activeWorkspace = JSON.parse(activeWorkspaceJson);

    // Only enforce user ownership if user_id was explicitly stored in the workspace.
    // Workspaces saved via store-item.jsx may not include user_id, so we skip
    // the check when it is absent rather than always clearing localStorage.
    if (activeWorkspace.user_id && activeWorkspace.user_id !== user.user_id) {
      localStorage.removeItem('activeWorkspace');
      navigate(paths.dashboard.store.list, { replace: true });
      return;
    }

    // Build the expected store parameter from the active workspace.
    const storedStoreParam = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;

    // Check if there's a store parameter in the URL.
    const urlParams = new URLSearchParams(location.search);
    const urlStoreParam = urlParams.get('store');

    // If the URL store param exists and does not match the stored workspace,
    // clear the active workspace and redirect to the store list.
    if (urlStoreParam && urlStoreParam !== storedStoreParam) {
      localStorage.removeItem('activeWorkspace');
      navigate(paths.dashboard.store.list, { replace: true });
      return;
    }

    // Also, if the current pathname does not include the active store,
    // force a redirect to the dashboard for that store.
    if (!location.pathname.includes(storedStoreParam)) {
      navigate(`${paths.dashboard.root}/${storedStoreParam}`, { replace: true });
    }
  }, [navigate, location, user]);

  return null;
}
