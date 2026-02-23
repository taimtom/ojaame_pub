import React from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { useGetRole } from 'src/actions/role';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RoleNewEditForm } from '../role-new-edit-form';

export function RoleEditView({ roleId }) {
  const { role, roleLoading, roleError } = useGetRole(roleId);

  if (roleLoading) {
    return <DashboardContent>Loading role…</DashboardContent>;
  }
  if (roleError || !role) {
    return <DashboardContent>Failed to load role</DashboardContent>;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={`Edit "${role.name}"`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Roles', href: paths.dashboard.role.root },
          { name: role.name },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              component="a"
              href={paths.dashboard.role.details(role.id)}
              startIcon={<Iconify icon="solar:eye-bold" />}
            >
              View
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <RoleNewEditForm currentRole={role} />
    </DashboardContent>
  );
}
