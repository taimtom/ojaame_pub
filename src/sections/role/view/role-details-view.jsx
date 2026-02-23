// src/sections/role/view/role-details-view.jsx
import React, { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetRole } from 'src/actions/role';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { RolePermissions } from '../role-permissions';

export function RoleDetailsView({ roleId }) {
  const { role, roleLoading, roleError } = useGetRole(roleId);

  // 1. compute grouped perms up‐front (never inside conditional)
  const groupedPermissions = useMemo(
    () =>
      (role?.default_permissions || []).reduce((acc, perm) => {
        const [category, action] = perm.split('.');
        if (!acc[category]) acc[category] = [];
        acc[category].push(action);
        return acc;
      }, {}),
    [role?.default_permissions]
  );

  if (roleLoading) return <DashboardContent>Loading role…</DashboardContent>;
  if (roleError || !role) return <DashboardContent>Failed to load role details.</DashboardContent>;

  const canEdit = role.company_id !== null;

  return (
    <DashboardContent>
      {/* ─── Toolbar ───────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
        <Button
          component={RouterLink}
          href={paths.dashboard.role.root}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
        >
          Back
        </Button>
        <Box sx={{ flexGrow: 1 }} />
        {canEdit && (
          <IconButton component={RouterLink} href={paths.dashboard.role.edit(role.id)}>
            <Iconify icon="solar:pen-bold" />
          </IconButton>
        )}
      </Stack>

      {/* ─── Main Grid ─────────────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Info panel */}
        <Grid xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5">{role.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {role.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Permissions panel */}
        <Grid xs={12} md={8}>
          <RolePermissions groupedPermissions={groupedPermissions} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
