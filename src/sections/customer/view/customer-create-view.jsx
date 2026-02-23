import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CustomerNewEditForm } from '../customer-new-edit-form';

// ----------------------------------------------------------------------

export function CustomerCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a Customer"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href: paths.dashboard.customer.list },
          { name: 'New Customer' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CustomerNewEditForm />
    </DashboardContent>
  );
}
