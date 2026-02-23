import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceEditForm } from '../service-edit-form';

// ----------------------------------------------------------------------

export function ServiceEditView({ service, storeSlug, storeNameSlug, storeId  }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'service', href: paths.dashboard.service.root(storeSlug) },
          { name: service?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} currentService={service}  />
    </DashboardContent>
  );
}
