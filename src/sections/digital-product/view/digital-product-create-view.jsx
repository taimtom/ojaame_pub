import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { DigitalProductEditForm } from '../digital-product-edit-form';

export function DigitalProductCreateView({ storeSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create digital product"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Digital Products', href: paths.dashboard.digitalProduct.root(storeSlug) },
          { name: 'New' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DigitalProductEditForm storeId={storeId} storeSlug={storeSlug} />
    </DashboardContent>
  );
}
