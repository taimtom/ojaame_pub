// src/sections/role/RoleListView.jsx
import React, { useMemo, useState, useEffect } from 'react';

import {
  Stack,
  Button,
  TextField,
  Typography,
  InputAdornment,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  updateRole,
  useGetRoles,
  useGetAllPermissions,
} from 'src/actions/role';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import RoleList from '../role-list';

export function RoleListView() {
  const router = useRouter();

  // 1) Fetch roles
  const {
    roles,
    rolesLoading,
    rolesError,
  } = useGetRoles();

  // 2) Fetch all permissions (SWR hook)
  const {
    data: permissionsData,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = useGetAllPermissions();

  // 3) Build an object: { [category]: [actions...] }
  //    Support both top‐level and nested‐under‐`data`.
  const permissionsByCategory = useMemo(() => {
    if (!permissionsData) {
      return {};
    }

    // Case A: payload = { permissions_by_category: { … }, all_permissions: [ … ] }
    if (permissionsData.permissions_by_category) {
      return permissionsData.permissions_by_category;
    }

    // Case B: payload = { data: { permissions_by_category: { … }, all_permissions: [ … ] } }
    if (
      permissionsData.data &&
      permissionsData.data.permissions_by_category
    ) {
      return permissionsData.data.permissions_by_category;
    }

    // Fallback: empty
    return {};
  }, [permissionsData]);

  // Local state for role table + search/sort/etc.
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // When roles finish loading, copy into local `rows`
  useEffect(() => {
    if (!rolesLoading && !rolesError) {
      setRows(Array.isArray(roles) ? roles : []);
    }
  }, [roles, rolesLoading, rolesError]);

  // Handler: update a role’s default_permissions on the server
  const handlePermissionUpdate = async (roleId, updatedPermissions) => {
    try {
      await updateRole(roleId, { default_permissions: updatedPermissions });
      // Update local copy of that role’s default_permissions
      setRows((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? { ...r, default_permissions: updatedPermissions }
            : r
        )
      );
      toast.success('Permissions updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update permissions');
    }
  };

  // Filter roles by `searchQuery`
  const filteredRows = useMemo(
    () =>
      rows.filter((r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rows, searchQuery]
  );

  const handleSearch = (e) => setSearchQuery(e.target.value);
  const handleSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Show spinner while loading
  if (rolesLoading || permissionsLoading) {
    return (
      <DashboardContent>
        <CircularProgress />
      </DashboardContent>
    );
  }

  // Show error UI if either fetch fails
  if (rolesError || permissionsError) {
    console.error('Error loading data:', { rolesError, permissionsError });
    return (
      <DashboardContent>
        <Stack alignItems="center" sx={{ py: 10 }}>
          <Iconify
            icon="solar:warning-amber-bold"
            sx={{ fontSize: 64, color: 'error.main' }}
          />
          <Typography variant="h6">Failed to load data</Typography>
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Roles Management"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Roles', href: paths.dashboard.role.root },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.role.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New Role
          </Button>
        }
        sx={{ mb: 3 }}
      />

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:search-bold" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        
        {selected.length > 0 && (
          <Stack direction="row" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              {selected.length} selected
            </Typography>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => {
                if (window.confirm(`Delete ${selected.length} selected roles?`)) {
                  setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
                  setSelected([]);
                }
              }}
            >
              Delete Selected
            </Button>
          </Stack>
        )}
      </Stack>

      <RoleList
        roles={filteredRows}
        order={order}
        orderBy={orderBy}
        selected={selected}
        page={page}
        rowsPerPage={rowsPerPage}
        permissionsByCategory={permissionsByCategory}
        onSort={handleSort}
        onSelectAll={(e) => {
          const newSelected = e.target.checked ? filteredRows.map((r) => r.id) : [];
          setSelected(newSelected);
        }}
        onSelectRow={(e, id) => {
          setSelected((prev) => {
            const newSelected = prev.includes(id)
              ? prev.filter((x) => x !== id)
              : [...prev, id];
            return newSelected;
          });
        }}
        onChangePage={(_, newPage) => setPage(newPage)}
        onChangeRowsPerPage={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onDeleteRole={(id) => {
          if (window.confirm('Delete this role?')) {
            setRows((prev) => prev.filter((r) => r.id !== id));
            setSelected((prev) => prev.filter((x) => x !== id));
          }
        }}
        onBulkDelete={() => {
          if (
            selected.length > 0 &&
            window.confirm(`Delete ${selected.length} roles?`)
          ) {
            setRows((prev) => prev.filter((r) => !selected.includes(r.id)));
            setSelected([]);
          }
        }}
        onViewRole={(id) => router.push(paths.dashboard.role.details(id))}
        onEditRole={(id) => router.push(paths.dashboard.role.edit(id))}
        onPermissionUpdate={handlePermissionUpdate}
      />
    </DashboardContent>
  );
}
