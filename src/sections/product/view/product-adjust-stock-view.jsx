import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductAdjustStockForm } from '../product-adjust-stock';

// ----------------------------------------------------------------------

export function ProductAdjustStockView({ product, storeSlug, storeNameSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Record Stock Loss"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Product', href: paths.dashboard.product.root(storeSlug) },
          { name: product?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductAdjustStockForm
        storeId={storeId}
        storeSlug={storeSlug}
        storeNameSlug={storeNameSlug}
        currentProduct={product}
      />
    </DashboardContent>
  );
}
