import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceDetails } from '../invoice-details';

// ----------------------------------------------------------------------

export function InvoiceDetailsView({ invoice, storeSlug, storeNameSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={invoice?.invoiceNumber || 'Invoice Details'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Invoice', href: paths.dashboard.invoice.root(storeSlug) },
          { name: invoice?.invoice_number || 'Invoice' }
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InvoiceDetails
        invoice={invoice}
        storeId={storeId}
        storeSlug={storeSlug}
        storeNameSlug={storeNameSlug}
      />
    </DashboardContent>
  );
}
