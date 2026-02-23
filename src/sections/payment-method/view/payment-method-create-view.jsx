import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PaymentMethodNewEditForm } from '../payment-method-new-edit-form';

// ----------------------------------------------------------------------

export function PaymentMethodCreateView({ storeId, storeSlug, storeNameSlug, }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new Payment Method"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payment Method', href: paths.dashboard.paymentMethod.root(storeSlug) },
          { name: 'New Payment Method' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

<PaymentMethodNewEditForm   storeId={storeId}
        storeSlug={storeSlug}
        storeNameSlug={storeNameSlug} />
    </DashboardContent>
  );
}
