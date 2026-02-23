import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceNewEditForm } from '../pos-new-edit-form';

// ----------------------------------------------------------------------

export function InvoiceCreateView({ storeSlug, storeNameSlug, storeId}) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new sales invoice"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Sales Invoice', href: paths.dashboard.pos.root(storeSlug) },
          { name: 'New Sales invoice' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InvoiceNewEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} />
    </DashboardContent>
  );
}
