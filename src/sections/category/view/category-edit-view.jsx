import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CategoryNewEditForm } from '../category-edit-form';

// ----------------------------------------------------------------------

export function CategoryEditView({ category, storeSlug, storeNameSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'category', href: paths.dashboard.category.root(storeSlug) },
          { name: category?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CategoryNewEditForm  storeId={storeId} storeSlug={storeSlug} storeNameSlug={storeNameSlug} currentCategory={category} />
    </DashboardContent>
  );
}
