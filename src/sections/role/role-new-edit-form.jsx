// src/sections/role/role-new-edit-form.jsx
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { createRole, updateRole, useGetAllPermissions } from 'src/actions/role';

import { toast } from 'src/components/snackbar';

const RoleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  default_permissions: z.array(z.string()).optional(),
});

export function RoleNewEditForm({ currentRole }) {
  const router = useRouter();
  const isEdit = Boolean(currentRole);
  const { permissionsByCategory, permissionsLoading, permissionsError } = useGetAllPermissions();

  const defaultValues = useMemo(() => ({
    name: currentRole?.name || '',
    description: currentRole?.description || '',
    default_permissions: currentRole?.default_permissions || [],
  }), [currentRole]);

  const methods = useForm({
    resolver: zodResolver(RoleSchema),
    defaultValues,
  });
  const {
    control, handleSubmit, reset,
    formState: { isSubmitting, errors }
  } = methods;

  const categories = useMemo(() => Object.keys(permissionsByCategory).sort(), [permissionsByCategory]);
  const [tab, setTab] = useState(0);

  useEffect(() => { reset(defaultValues); }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async data => {
    try {
      if (isEdit) {
        await updateRole(currentRole.id, data);
        toast.success('Role updated');
      } else {
        await createRole(data);
        toast.success('Role created');
      }
      router.push(paths.dashboard.role.root);
    } catch {
      toast.error('Operation failed');
    }
  });

  // helper to render an array of perm-strings as checkboxes
  const renderGrid = (perms) => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 1,
        mt: 1,
      }}
    >
      {perms.map((perm) => {
        const checked = methods.getValues('default_permissions').includes(perm);
        const [, action] = perm.split('.');
        return (
          <FormControlLabel
            key={perm}
            control={
              <Checkbox
                checked={checked}
                onChange={() => {
                  const current = methods.getValues('default_permissions');
                  const next = checked
                    ? current.filter((v) => v !== perm)
                    : [...current, perm];
                  methods.setValue('default_permissions', next, { shouldValidate: true });
                }}
              />
            }
            label={action}
          />
        );
      })}
    </Box>
  );

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={4} sx={{ maxWidth: 960, mx: 'auto' }}>

        {/* Details */}
        <Card>
          <CardHeader title={isEdit ? 'Edit Role' : 'New Role'} />
          <Divider />
          <CardContent>
            <Stack spacing={3}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Role Name"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    multiline
                    rows={3}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card>
          <CardHeader title="Permissions" />
          <Divider />

          {/* Tabs */}
          <Tabs
            value={tab}
            onChange={(_, i) => setTab(i)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="All" />
            {categories.map((cat) => (
              <Tab key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} />
            ))}
          </Tabs>

          <CardContent>
            {permissionsLoading && <Typography>Loading permissions…</Typography>}
            {permissionsError && <Typography color="error">Failed to load permissions</Typography>}

            {!permissionsLoading && !permissionsError && (
              <Controller
                name="default_permissions"
                control={control}
                render={({ field }) => {
                  // global perms
                  const allPerms = categories.flatMap((cat) =>
                    permissionsByCategory[cat].map((act) => `${cat}.${act}`)
                  );
                  const allChecked = field.value.length === allPerms.length;
                  const allIndet = field.value.length > 0 && field.value.length < allPerms.length;

                  // “All” tab panel
                  if (tab === 0) {
                    return (
                      <Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={allChecked}
                              indeterminate={allIndet}
                              onChange={() =>
                                field.onChange(allChecked ? [] : allPerms)
                              }
                            />
                          }
                          label="Select All Permissions"
                          sx={{ mb: 2 }}
                        />

                        {categories.map((cat) => {
                          const catPerms = permissionsByCategory[cat].map((a) => `${cat}.${a}`);
                          const catChecked = catPerms.every((p) => field.value.includes(p));
                          const catIndet = catPerms.some((p) => field.value.includes(p)) && !catChecked;

                          return (
                            <Box key={cat} sx={{ mb: 3 }}>
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                                  {cat}
                                </Typography>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={catChecked}
                                      indeterminate={catIndet}
                                      onChange={() => {
                                        const next = catChecked
                                          ? field.value.filter((v) => !catPerms.includes(v))
                                          : Array.from(new Set([...field.value, ...catPerms]));
                                        field.onChange(next);
                                      }}
                                    />
                                  }
                                  label="Select All"
                                />
                              </Box>
                              {renderGrid(catPerms)}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  }

                  // single-category panel
                  const selCat = categories[tab - 1];
                  const selPerms = permissionsByCategory[selCat].map((a) => `${selCat}.${a}`);
                  const selChecked = selPerms.every((p) => field.value.includes(p));
                  const selIndet = selPerms.some((p) => field.value.includes(p)) && !selChecked;

                  return (
                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selChecked}
                            indeterminate={selIndet}
                            onChange={() => {
                              const next = selChecked
                                ? field.value.filter((v) => !selPerms.includes(v))
                                : Array.from(new Set([...field.value, ...selPerms]));
                              field.onChange(next);
                            }}
                          />
                        }
                        label={`Select All ${selCat.charAt(0).toUpperCase() + selCat.slice(1)}`}
                        sx={{ mb: 2 }}
                      />
                      {renderGrid(selPerms)}
                    </Box>
                  );
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Box sx={{ textAlign: 'right' }}>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            size="large"
          >
            {isEdit ? 'Save Changes' : 'Create Role'}
          </LoadingButton>
        </Box>
      </Stack>
    </form>
  );
}
