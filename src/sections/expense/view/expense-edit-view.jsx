import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExpenseNewEditForm } from '../expense-new-edit-form';

// ----------------------------------------------------------------------

export function ExpenseEditView({ expense, storeId, storeSlug, storeNameSlug }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Expense', href: paths.dashboard.expense.root(storeId) },
          { name: expense?.category },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <ExpenseNewEditForm storeId={storeId} currentExpense={expense} storeSlug={storeSlug} storeNameSlug={storeNameSlug}/>
    </DashboardContent>
  );
}
