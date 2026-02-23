// src/sections/role/role-item.jsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Tab,
  Grid,
  Card,
  Menu,
  Tabs,
  Chip,
  Alert,
  Stack,
  Button,
  Divider,
  TableRow,
  Collapse,
  Checkbox,
  MenuItem,
  TableCell,
  IconButton,
  Typography,
  CardHeader,
  CardContent,
  LinearProgress,
  FormControlLabel,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

const RoleItem = ({
  role,
  permissionsByCategory,
  isSelected,
  onSelect,
  onDelete,
  onView,
  onEdit,
  onPermissionUpdate,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [tab, setTab] = useState(0);
  const canEdit = !role.is_default;

  // react-hook-form to manage the “default_permissions” array
  const { control, getValues, reset } = useForm({
    defaultValues: { default_permissions: role.default_permissions || [] },
  });

  // When `role.default_permissions` changes, reset the form
  useEffect(() => {
    reset({ default_permissions: role.default_permissions || [] });
  }, [role.id, role.default_permissions, reset]);

  // 1) Build a sorted list of category names
  const categories = Object.keys(permissionsByCategory || {}).sort(
    (a, b) => a.localeCompare(b)
  );

  // 2) For a given category string, return something like ['users.create', 'users.read', …]
  const getCategoryPermissions = (category) =>
    (permissionsByCategory[category] || []).map((action) => `${category}.${action}`);

  return (
    <>
      {/* ─────────────────────────────────────────────
           Main row: checkbox, expand toggle, role name, description, count, actions
         ───────────────────────────────────────────── */}
      <TableRow hover selected={isSelected}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={onSelect}
            inputProps={{ 'aria-labelledby': `role-${role.id}` }}
          />
        </TableCell>
        <TableCell>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <Iconify
              icon={
                expanded
                  ? 'eva:arrow-ios-downward-fill'
                  : 'eva:arrow-ios-forward-fill'
              }
            />
          </IconButton>
          <Typography component="span" sx={{ ml: 1 }}>
            {role.name}
            {role.is_default && (
              <Chip
                size="small"
                label="Default"
                color="primary"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {role.description}
          </Typography>
        </TableCell>
        <TableCell>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.primary">
              {role.default_permissions?.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              / {categories.flatMap(getCategoryPermissions).length}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell align="right">
          <IconButton onClick={onView} size="small">
            <Iconify icon="solar:eye-bold" />
          </IconButton>
          {canEdit && (
            <>
              <IconButton
                size="small"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                aria-controls="role-menu"
              >
                <Iconify icon="eva:more-vertical-fill" />
              </IconButton>
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
              >
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    onEdit(role.id);
                  }}
                >
                  <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null);
                    onDelete(role.id);
                  }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              </Menu>
            </>
          )}
        </TableCell>
      </TableRow>

      {/* ─────────────────────────────────────────────
           Collapsible row: Tabs + permissions checkboxes
         ───────────────────────────────────────────── */}
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0 }}>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box m={2}>
              <Card>
                <CardHeader 
                  title="Permissions Configuration" 
                  subheader={
                    canEdit 
                      ? "Configure role permissions by category" 
                      : "Default roles cannot be modified"
                  }
                  action={
                    <Chip
                      size="small"
                      label={canEdit ? "Editable" : "Read-only"}
                      color={canEdit ? "success" : "default"}
                      variant="outlined"
                    />
                  }
                />
                <Divider />

                {/* ─── Tabs: “All” + each category ─── */}
                <Tabs
                  value={tab}
                  onChange={(_, newValue) => setTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="All" />
                  {categories.map((category) => (
                    <Tab
                      key={category}
                      label={
                        category.charAt(0).toUpperCase() + category.slice(1)
                      }
                    />
                  ))}
                </Tabs>

                <CardContent>
                  <Controller
                    name="default_permissions"
                    control={control}
                    render={({ field }) => {
                      // 1) If "All" tab, flatten every category's perms
                      const allPermissions = categories.flatMap(
                        getCategoryPermissions
                      );

                      // 2) If a specific category tab is selected, only show that category's perms
                      const currentPermissions =
                        tab === 0
                          ? allPermissions
                          : getCategoryPermissions(categories[tab - 1]);

                      // Count how many of currentPermissions are currently checked
                      const checkedCount = field.value.filter((p) =>
                        currentPermissions.includes(p)
                      ).length;
                      const totalCount = currentPermissions.length;
                      const progressPercentage = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

                      return (
                        <Box>
                          {/* Permission summary and progress */}
                          <Box mb={2}>
                            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                              <Typography variant="subtitle2">
                                {tab === 0 ? 'All Permissions' : `${categories[tab - 1].charAt(0).toUpperCase() + categories[tab - 1].slice(1)} Permissions`}
                              </Typography>
                              <Chip
                                size="small"
                                label={`${checkedCount}/${totalCount}`}
                                color={checkedCount === totalCount ? 'success' : checkedCount > 0 ? 'warning' : 'default'}
                                variant="outlined"
                              />
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={progressPercentage}
                              sx={{ height: 6, borderRadius: 3, mb: 2 }}
                              color={checkedCount === totalCount ? 'success' : checkedCount > 0 ? 'warning' : 'primary'}
                            />
                          </Box>

                          {/* "Select All" checkbox for this tab */}
                          <FormControlLabel
                            control={
                              <Checkbox
                                indeterminate={
                                  checkedCount > 0 && checkedCount < totalCount
                                }
                                checked={
                                  totalCount > 0 &&
                                  checkedCount === totalCount
                                }
                                onChange={() => {
                                  const newPermissions =
                                    checkedCount === totalCount
                                      ? // uncheck them
                                        field.value.filter(
                                          (p) =>
                                            !currentPermissions.includes(p)
                                        )
                                      : // check all
                                        [
                                          ...new Set([
                                            ...field.value,
                                            ...currentPermissions,
                                          ]),
                                        ];
                                  field.onChange(newPermissions);
                                }}
                                disabled={!canEdit}
                              />
                            }
                            label={`Select All in ${tab === 0 ? 'All Categories' : categories[tab - 1]}`}
                            sx={{ mb: 2 }}
                          />

                          {!canEdit && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                              This is a default role and cannot be modified. Default roles come with predefined permissions.
                            </Alert>
                          )}

                          <Grid container spacing={1}>
                            {currentPermissions.length === 0 ? (
                              <Grid item xs={12}>
                                <Typography color="text.secondary" textAlign="center" py={4}>
                                  No permissions available in this category
                                </Typography>
                              </Grid>
                            ) : (
                              currentPermissions.map((permission) => {
                                const [category, action] = permission.split('.');
                                const isChecked = field.value.includes(permission);
                                
                                return (
                                  <Grid item xs={12} sm={6} md={4} lg={3} key={permission}>
                                    <FormControlLabel
                                      control={
                                        <Checkbox
                                          checked={isChecked}
                                          onChange={() => {
                                            const newPermissions = isChecked
                                              ? field.value.filter((p) => p !== permission)
                                              : [...field.value, permission];
                                            field.onChange(newPermissions);
                                          }}
                                          disabled={!canEdit}
                                          color="primary"
                                        />
                                      }
                                      label={
                                        <Box>
                                          <Typography variant="body2" component="span">
                                            {action.charAt(0).toUpperCase() + action.slice(1)}
                                          </Typography>
                                          {tab === 0 && (
                                            <Typography 
                                              variant="caption" 
                                              color="text.secondary" 
                                              component="div"
                                            >
                                              {category}
                                            </Typography>
                                          )}
                                        </Box>
                                      }
                                      sx={{
                                        width: '100%',
                                        border: 1,
                                        borderColor: isChecked ? 'primary.main' : 'divider',
                                        borderRadius: 1,
                                        p: 1,
                                        m: 0,
                                        bgcolor: isChecked ? 'primary.lighter' : 'transparent',
                                        '&:hover': {
                                          bgcolor: isChecked ? 'primary.light' : 'action.hover',
                                        },
                                      }}
                                    />
                                  </Grid>
                                );
                              })
                            )}
                          </Grid>

                          {canEdit && (
                            <Box mt={3}>
                              <Divider sx={{ mb: 2 }} />
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Changes will be saved to role permissions
                                </Typography>
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    variant="outlined"
                                    onClick={() => reset()}
                                    color="error"
                                    size="small"
                                    startIcon={<Iconify icon="solar:refresh-bold" />}
                                  >
                                    Reset
                                  </Button>
                                  <Button
                                    variant="contained"
                                    onClick={() =>
                                      onPermissionUpdate(
                                        role.id,
                                        getValues('default_permissions')
                                      )
                                    }
                                    color="primary"
                                    size="small"
                                    startIcon={<Iconify icon="solar:check-circle-bold" />}
                                  >
                                    Save Changes
                                  </Button>
                                </Stack>
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      );
                    }}
                  />
                </CardContent>
              </Card>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default RoleItem;
