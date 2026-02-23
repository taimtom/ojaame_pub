import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useBusinessType } from 'src/hooks/use-business-type';

import { ProductNewEditForm } from '../product-new-edit-form';

// ----------------------------------------------------------------------

export function ProductCreateView({ storeSlug, storeNameSlug, storeId }) {
  const { t } = useBusinessType();
  const productTerm = t('product');

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Add new ${productTerm}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: productTerm.charAt(0).toUpperCase() + productTerm.slice(1), href: paths.dashboard.product.root(storeSlug) },
          { name: `New ${productTerm}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Optionally, pass these props further if needed */}
      <ProductNewEditForm storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} />
    </DashboardContent>
  );
}
