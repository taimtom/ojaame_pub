import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExpenseNewEditForm } from '../expense-new-edit-form';

// ----------------------------------------------------------------------

export function ExpenseCreateView({ storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new Expense"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Expenses', href: paths.dashboard.expense.root(storeId) },
          { name: 'New Expense' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

<ExpenseNewEditForm storeId={storeId} />
    </DashboardContent>
  );
}
