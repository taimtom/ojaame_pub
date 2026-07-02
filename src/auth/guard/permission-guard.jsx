import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';

import { paths } from 'src/routes/paths';
import { usePermissions } from 'src/hooks/use-permissions';

export function PermissionGuard({ children, anyOf = [], allOf = [] }) {
  const location = useLocation();
  const { isLoading, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (isLoading) {
    return null;
  }

  const passesAny = anyOf.length === 0 || hasAnyPermission(anyOf);
  const passesAll = allOf.length === 0 || hasAllPermissions(allOf);

  if (!passesAny || !passesAll) {
    return <Navigate to={paths.dashboard.permission} replace state={{ from: location }} />;
  }

  return children;
}

PermissionGuard.propTypes = {
  children: PropTypes.node.isRequired,
  anyOf: PropTypes.arrayOf(PropTypes.string),
  allOf: PropTypes.arrayOf(PropTypes.string),
};
