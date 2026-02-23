import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import {useParams, useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { paramCase } from 'src/utils/change-case';

import { useGetCustomers } from 'src/actions/customer';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
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

import { CustomerTableRow } from '../customer-table-row';
import { CustomerTableToolbar } from '../customer-table-toolbar';
import { CustomerTableFiltersResult } from '../customer-table-filters-result';

// ----------------------------------------------------------------------
// Table header definition for customers
// ----------------------------------------------------------------------
function getStoreSlug(propStoreSlug, storeParam) {
  let storeSlug = propStoreSlug || storeParam;
  if (!storeSlug) {
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
    if (activeWorkspaceJson) {
      try {
        const activeWorkspace = JSON.parse(activeWorkspaceJson);
        if (activeWorkspace && activeWorkspace.storeName && activeWorkspace.id) {
          storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
        } else {
          storeSlug = 'default-store';
        }
      } catch (error) {
        storeSlug = 'default-store';
      }
    } else {
      storeSlug = 'default-store';
    }
  }
  return storeSlug;
}
const TABLE_HEAD = [
  { id: 'name', label: 'Name' },
  { id: 'phone_number', label: 'Phone Number', width: 180 },
  { id: 'city', label: 'City', width: 120 },
  { id: 'state', label: 'State', width: 120 },
  { id: 'address_type', label: 'Address Type', width: 120 },
  { id: '', width: 88 },
];

export function CustomerListView({ storeSlug: propStoreSlug }) {
   const { storeParam } = useParams();
    const storeSlug = getStoreSlug(propStoreSlug, storeParam);

    const numericStoreId = storeSlug.split('-').pop();


  const table = useTable();
  const router = useRouter();
  const confirm = useBoolean();


  // *** Ensure you pass a valid store ID ***
  const storeId = 1; // Replace with your derived store ID if needed
  const { customers, customersLoading, customersError } = useGetCustomers(numericStoreId);
  const [tableData, setTableData] = useState([]);

  // Initialize filter state with "name" and "addressType"
  const filters = useSetState({ name: '', addressType: 'all' });

  useEffect(() => {
    if (customers) {
      console.log('Network data:', customers);
      setTableData(customers);
    }
  }, [customers]);

  // Updated filter function to also check for address type if not "all"
  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  // Debug: Log the filtered data
  useEffect(() => {
    console.log('Filtered Data:', dataFiltered);
  }, [dataFiltered]);

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);
  const canReset =
    !!filters.state.name || (filters.state.addressType && filters.state.addressType !== 'all');
  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    (id) => {
      const updatedData = tableData.filter((row) => row.id !== id);
      toast.success('Delete success!');
      setTableData(updatedData);
      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const updatedData = tableData.filter((row) => !table.selected.includes(row.id));
    toast.success('Delete success!');
    setTableData(updatedData);
    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.customer.edit(storeSlug, id));
    },
    [router, storeSlug]
  );

  const handleFilterName = useCallback(
    (event) => {
      table.onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, table]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Customers"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Customers', href: paths.dashboard.customer.root },
            { name: 'List' },
          ]}
          action={
            <Button
              component={RouterLink}
              to={paths.dashboard.customer.new(storeSlug)}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Add Customer
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <CustomerTableToolbar
            filters={filters}
            onFilterName={handleFilterName}
            onResetPage={table.onResetPage}
          />

          {canReset && (
            <CustomerTableFiltersResult
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
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Delete">
                  <IconButton color="primary" onClick={confirm.onTrue}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
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
                      dataFiltered.map((row) => row.id)
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
                      <CustomerTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDeleteRow={() => handleDeleteRow(row.id)}
                        onEditRow={() => handleEditRow(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 76}
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
            Are you sure you want to delete <strong>{table.selected.length}</strong> items?
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
    </>
  );
}

// ----------------------------------------------------------------------
// Filter function for customers based on their name and address type
// ----------------------------------------------------------------------
function applyFilter({ inputData, comparator, filters }) {
  const { name, addressType } = filters;
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter((customer) =>
      customer.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  if (addressType && addressType !== 'all') {
    inputData = inputData.filter((customer) => customer.address_type === addressType);
  }

  return inputData;
}
