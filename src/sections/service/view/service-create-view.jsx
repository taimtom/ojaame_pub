import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceEditForm } from '../service-edit-form';

// ----------------------------------------------------------------------

export function ServiceCreateView({ storeSlug, storeNameSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new Service"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Service', href: paths.dashboard.service.root(storeSlug) },
          { name: 'New service' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ServiceEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug}/>
    </DashboardContent>
  );
}
