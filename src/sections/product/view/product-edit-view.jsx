import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useBusinessType } from 'src/hooks/use-business-type';

import { ProductNewEditForm } from '../product-new-edit-form';

// ----------------------------------------------------------------------

export function ProductEditView({ product, storeSlug, storeNameSlug, storeId }) {
  const { t } = useBusinessType();
  const productTerm = t('product');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Edit ${productTerm}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: productTerm.charAt(0).toUpperCase() + productTerm.slice(1), href: paths.dashboard.product.root(storeSlug) },
          { name: product?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ProductNewEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} currentProduct={product} />
    </DashboardContent>
  );
}
