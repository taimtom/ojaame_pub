import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PaymentMethodNewEditForm } from '../payment-method-new-edit-form';

// ----------------------------------------------------------------------

export function PaymentMethodEditView({ paymentMethod, storeId, storeSlug, storeNameSlug }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Payment Method', href: paths.dashboard.paymentMethod.root(storeId) },
          { name: paymentMethod?.issuer },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <PaymentMethodNewEditForm storeId={storeId} currentPaymentMethod={paymentMethod} storeSlug={storeSlug} storeNameSlug={storeNameSlug} />
    </DashboardContent>
  );
}
