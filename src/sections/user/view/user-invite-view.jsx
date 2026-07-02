import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';

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

      <OnboardingSetupShell subtitle="Invite team members now, or skip and add them later from User & Staff.">
        <UserNewInviteForm currentUser={currentUser} />
      </OnboardingSetupShell>
    </DashboardContent>
  );
}
