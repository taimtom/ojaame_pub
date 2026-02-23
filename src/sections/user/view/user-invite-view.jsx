import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewInviteForm } from '../user-invite-form';

// ----------------------------------------------------------------------

export function UserInviteView({ user: currentUser }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Invite"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'User', href:''},
          { name: currentUser?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <UserNewInviteForm currentUser={currentUser} />
    </DashboardContent>
  );
}
