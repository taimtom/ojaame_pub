import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductAddQuantityForm } from '../product-add-quantity';

// ----------------------------------------------------------------------

export function ProductQuantityAddView({ product, storeSlug, storeNameSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Add quantity"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Product', href: paths.dashboard.product.root(storeSlug) },
          { name: product?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductAddQuantityForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} currentProduct={product}  />
    </DashboardContent>
  );
}
