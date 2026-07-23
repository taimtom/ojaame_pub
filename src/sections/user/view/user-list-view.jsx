import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import Stack from '@mui/material/Stack';
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { usePermissions } from 'src/hooks/use-permissions';
import { useSetState } from 'src/hooks/use-set-state';
import { useAuthContext } from 'src/auth/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { varAlpha } from 'src/theme/styles';
import { useGetRoles } from 'src/actions/role';
import { useGetUsers, resendInvitation, softDeleteUser } from 'src/actions/user';
import { USER_STATUS_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { NonLoginStaffDialog } from 'src/components/staff/non-login-staff-dialog';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { RoleBased } from 'src/auth/guard';

import { UserTableRow } from '../user-table-row';
import { UserTableToolbar } from '../user-table-toolbar';
import { UserTableFiltersResult } from '../user-table-filters-result';


// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  ...USER_STATUS_OPTIONS,
  { value: 'no_login', label: 'No login' },
];

const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'phoneNumber', label: 'Phone number', width: 180 },
  { id: 'Store', label: 'Store', width: 220 },
  { id: 'role', label: 'Role', width: 180 },
  { id: 'status', label: 'Status', width: 100 },
  { id: '', width: 88 },
];

function mapNonLoginEmployee(emp) {
  const name = (emp.name || '').trim();
  const parts = name.split(/\s+/);
  return {
    row_key: `nl-${emp.id}`,
    user_id: `nl-${emp.id}`,
    employee_id: emp.id,
    isNonLogin: true,
    firstName: parts[0] || name || 'Staff',
    lastName: parts.slice(1).join(' '),
    email: emp.email || 'No login account',
    phoneNumber: '—',
    store_names: [],
    role: 'No login',
    status: 'no_login',
    photoURL: '',
  };
}
// ----------------------------------------------------------------------

export function UserListView() {
  const table = useTable();

  const router = useRouter();
  const { user } = useAuthContext();

  const confirm = useBoolean();
  const nonLoginDialog = useBoolean();

  const { users, usersLoading, usersError } = useGetUsers();
  const [tableData, setTableData] = useState([]);
  const [statusCode, setStatusCode] = useState(null);
  const [nonLoginStaff, setNonLoginStaff] = useState([]);

  const loadNonLoginStaff = useCallback(async () => {
    if (!user?.company_id) {
      setNonLoginStaff([]);
      return;
    }
    try {
      const { data } = await axiosInstance.get(endpoints.payroll.employees, {
        params: { company_id: user.company_id },
      });
      const rows = (data || [])
        .filter((emp) => emp.active !== false && !emp.has_login)
        .map(mapNonLoginEmployee);
      setNonLoginStaff(rows);
    } catch {
      setNonLoginStaff([]);
    }
  }, [user?.company_id]);

  useEffect(() => {
    loadNonLoginStaff();
  }, [loadNonLoginStaff]);

  useEffect(() => {
    const loginUsers = (users || []).map((u) => ({
      ...u,
      row_key: `user-${u.user_id}`,
      isNonLogin: false,
    }));
    setTableData([...loginUsers, ...nonLoginStaff]);
  }, [users, nonLoginStaff]);

  useEffect(() => {
    if (
      usersError?.status === 403 ||
      usersError?.detail === 'Permission denied: Only admins can access this endpoint.'
    ) {
      setStatusCode(403);
    }
  }, [usersError]);

  const { roles } = useGetRoles();
  const { hasPermission } = usePermissions();
  const canInviteUser = hasPermission('users.create');
  const canDeleteUser = hasPermission('users.delete');

  const filters = useSetState({ name: '', role: [], status: 'all' });

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name || filters.state.role.length > 0 || filters.state.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (rowId) => {
      const targetRow = tableData.find((row) => row.user_id === rowId);
      if (!targetRow) return;

      if (targetRow.isNonLogin) {
        try {
          await axiosInstance.delete(`${endpoints.payroll.employees}/${targetRow.employee_id}`);
          toast.success('Non-login staff removed');
          setNonLoginStaff((prev) => prev.filter((r) => r.employee_id !== targetRow.employee_id));
          table.onUpdatePageDeleteRow(dataInPage.length);
        } catch (error) {
          toast.error(error?.data?.detail || error?.message || 'Failed to remove staff');
        }
        return;
      }

      if (targetRow?.role === 'merchant' || targetRow?.role === 'owner') {
        toast.error('The owner account cannot be deleted.');
        return;
      }
      if (targetRow?.status === 'deleted') {
        toast.error('This user is already deleted.');
        return;
      }

      try {
        await softDeleteUser(rowId);
        const deleteRow = tableData.map((row) =>
          row.user_id === rowId ? { ...row, status: 'deleted' } : row
        );
        toast.success('Delete success!');
        setTableData(deleteRow);
        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        const message =
          error?.response?.data?.detail || error?.message || 'Failed to delete user';
        toast.error(message);
      }
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    const selected = tableData.filter((row) => table.selected.includes(row.user_id));
    const loginToDelete = selected.filter(
      (row) =>
        !row.isNonLogin &&
        row.role !== 'merchant' &&
        row.role !== 'owner' &&
        row.status !== 'deleted'
    );
    const nonLoginToDelete = selected.filter((row) => row.isNonLogin);

    if (!loginToDelete.length && !nonLoginToDelete.length) {
      toast.error('No deletable staff selected.');
      return;
    }

    try {
      await Promise.all([
        ...loginToDelete.map((row) => softDeleteUser(row.user_id)),
        ...nonLoginToDelete.map((row) =>
          axiosInstance.delete(`${endpoints.payroll.employees}/${row.employee_id}`)
        ),
      ]);
      const deletedLoginIds = new Set(loginToDelete.map((row) => row.user_id));
      const deletedEmpIds = new Set(nonLoginToDelete.map((row) => row.employee_id));
      setTableData((prev) =>
        prev
          .filter((row) => !(row.isNonLogin && deletedEmpIds.has(row.employee_id)))
          .map((row) =>
            deletedLoginIds.has(row.user_id) ? { ...row, status: 'deleted' } : row
          )
      );
      setNonLoginStaff((prev) => prev.filter((r) => !deletedEmpIds.has(r.employee_id)));
      toast.success('Delete success!');
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch (error) {
      const message =
        error?.response?.data?.detail || error?.message || 'Failed to delete staff';
      toast.error(message);
    }
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (row) => {
      if (row?.isNonLogin) {
        toast.info('Non-login staff have no account to edit. Manage them from Payroll if needed.');
        return;
      }
      router.push(paths.dashboard.user.edit(row.user_id ?? row));
    },
    [router]
  );

  const handleResendInvite = useCallback(async (id) => {
    try {
      await resendInvitation(id);
      toast.success('Invitation resent successfully!');
    } catch (error) {
      const message =
        error?.response?.data?.detail || error?.message || 'Failed to resend invitation';
      toast.error(message);
    }
  }, []);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  return (
     <RoleBased statusCode={statusCode} hasContent>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'User', href: paths.dashboard.user.root },
            { name: 'List' },
          ]}
          action={
            canInviteUser ? (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:user-speak-bold" />}
                  onClick={nonLoginDialog.onTrue}
                >
                  Add staff without login
                </Button>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.user.invite}
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                >
                  Invite user
                </Button>
              </Stack>
            ) : null
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: (theme) =>
                `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {STATUS_OPTIONS.map((tab) => (
              <Tab
                key={tab.value}
                iconPosition="end"
                value={tab.value}
                label={tab.label}
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={
                      (tab.value === 'active' && 'success') ||
                      (tab.value === 'pending' && 'warning') ||
                      (tab.value === 'banned' && 'error') ||
                      (tab.value === 'deleted' && 'default') ||
                      (tab.value === 'no_login' && 'info') ||
                      'default'
                    }
                  >
                    {['active', 'pending', 'banned', 'deleted', 'rejected', 'no_login'].includes(
                      tab.value
                    )
                      ? tableData.filter((u) => u.status === tab.value).length
                      : tableData.length}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <UserTableToolbar
            filters={filters}
            onResetPage={table.onResetPage}
            // Pass live roles from backend instead of mock roles.
            options={{ roles }}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={dataFiltered.length}
              onResetPage={table.onResetPage}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.user_id)
                )
              }
              action={
                canDeleteUser ? (
                  <Tooltip title="Delete">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                ) : null
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.user_id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <UserTableRow
                        key={row.row_key || row.user_id}
                        row={row}
                        selected={table.selected.includes(row.user_id)}
                        onSelectRow={() => table.onSelectRow(row.user_id)}
                        onDeleteRow={() => handleDeleteRow(row.user_id)}
                        onEditRow={() => handleEditRow(row)}
                        onResendInvite={() => handleResendInvite(row.user_id)}
                        canDeleteUser={canDeleteUser}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />

      <NonLoginStaffDialog
        open={nonLoginDialog.value}
        companyId={user?.company_id}
        onClose={nonLoginDialog.onFalse}
        onCreated={() => {
          loadNonLoginStaff();
        }}
      />
    </RoleBased>
  );
}

function applyFilter({ inputData, comparator, filters }) {
  const { name, status, role } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    // Combine firstName and lastName (with a space) for full name search.
    inputData = inputData.filter((user) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      return fullName.includes(name.toLowerCase());
    });
  }
  if (status !== 'all') {
    inputData = inputData.filter((user) => user.status === status);
  }
  if (role.length) {
    inputData = inputData.filter((user) => role.includes(user.role));
  }
  return inputData;
}
