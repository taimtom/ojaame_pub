import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ProductChangePriceForm } from '../product-change-price';

// ----------------------------------------------------------------------

export function ProductChangePriceView({ product, storeSlug, storeNameSlug }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Change Price"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Product', href: paths.dashboard.product.root(storeSlug) },
          { name: product?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductChangePriceForm
        currentProduct={product}
        storeSlug={storeSlug}
      />
    </DashboardContent>
  );
}

