// src/sections/role/role-list.jsx
import React from 'react';

import {
  Paper,
  Table,
  TableRow,
  Checkbox,
  TableBody,
  TableHead,
  TableCell,
  TableContainer,
  TableSortLabel,
  TablePagination,
} from '@mui/material';

import RoleItem from './role-item';

const headCells = [
  { id: 'select', label: 'Select', align: 'left' },
  { id: 'name', label: 'Role Name', align: 'left' },
  { id: 'description', label: 'Description', align: 'left' },
  { id: 'permissions', label: 'Permissions Count', align: 'left' },
  { id: 'actions', label: 'Actions', align: 'right' },
];

const RoleList = ({
  roles,
  order,
  orderBy,
  selected,
  page,
  rowsPerPage,
  permissionsByCategory,
  onSort,
  onSelectAll,
  onSelectRow,
  onChangePage,
  onChangeRowsPerPage,
  onDeleteRole,
  onBulkDelete,
  onViewRole,
  onEditRole,
  onPermissionUpdate,
}) => {
  // Sort roles by the chosen column & direction
  const sortedRoles = React.useMemo(
    () =>
      [...roles].sort((a, b) => {
        const aVal = a[orderBy] || '';
        const bVal = b[orderBy] || '';
        const cmp = aVal.toString().localeCompare(bVal.toString());
        return order === 'asc' ? cmp : -cmp;
      }),
    [roles, order, orderBy]
  );

  return (
    <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 2 }}>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.align || 'left'}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{
                    fontWeight: 600,
                    bgcolor: 'background.neutral',
                    ...(headCell.id === 'select' && { width: 48 }),
                    ...(headCell.id === 'permissions' && { width: 140 }),
                    ...(headCell.id === 'actions' && { width: 80 }),
                  }}
                >
                  {headCell.id === 'select' ? (
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < sortedRoles.length}
                      checked={sortedRoles.length > 0 && selected.length === sortedRoles.length}
                      onChange={(e) => onSelectAll(e)}
                      sx={{ p: 0 }}
                    />
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => onSort(null, headCell.id)}
                      sx={{ color: 'text.primary', fontWeight: 600 }}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedRoles
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((role) => (
                <RoleItem
                  key={role.id}
                  role={role}
                  isSelected={selected.includes(role.id)}
                  permissionsByCategory={permissionsByCategory}
                  onSelect={() => onSelectRow(null, role.id)}
                  onDelete={() => onDeleteRole(role.id)}
                  onView={() => onViewRole(role.id)}
                  onEdit={() => onEditRole(role.id)}
                  onPermissionUpdate={onPermissionUpdate}
                />
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={roles.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onChangePage}
        onRowsPerPageChange={onChangeRowsPerPage}
      />
    </Paper>
  );
};

export default RoleList;
