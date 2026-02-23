import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { StoreNewEditForm } from '../store-new-edit-form';

// ----------------------------------------------------------------------

export function StoreEditView({ store, loading, error }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: store?.storeName || 'Store' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <StoreNewEditForm currentStore={store} />
    </DashboardContent>
  );
}
