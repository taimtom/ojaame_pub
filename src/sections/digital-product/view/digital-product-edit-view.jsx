import { paths } from 'src/routes/paths';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { DigitalProductEditForm } from '../digital-product-edit-form';

export function DigitalProductEditView({ storeSlug, storeId, currentProduct }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit digital product"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Digital Products', href: paths.dashboard.digitalProduct.root(storeSlug) },
          { name: currentProduct?.name || 'Edit' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <DigitalProductEditForm
        currentProduct={currentProduct}
        storeId={storeId}
        storeSlug={storeSlug}
      />
    </DashboardContent>
  );
}
