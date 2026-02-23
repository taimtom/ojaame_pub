import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CustomerNewEditForm } from '../customer-new-edit-form';

// ----------------------------------------------------------------------

export function CustomerEditView({ customer, storeSlug, storeNameSlug, storeId  }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit Customer"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Customers', href: paths.dashboard.customer.root(storeSlug)  },
          { name: customer?.name || 'Customer' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CustomerNewEditForm currentUser={customer} />
    </DashboardContent>
  );
}
