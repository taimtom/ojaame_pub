import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// import { CategoryNewEditForm } from '../category-new-edit-form';
import { CategoryNewEditForm } from '../category-edit-form';

// ----------------------------------------------------------------------

export function CategoryCreateView({ storeSlug, storeNameSlug, storeId }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Create a new Category"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Category', href: paths.dashboard.category.root(storeSlug) },
          { name: 'New Category' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CategoryNewEditForm
        storeId={storeId}
        storeSlug={storeSlug}
        storeNameSlug={storeNameSlug}
      />
    </DashboardContent>
  );
}
