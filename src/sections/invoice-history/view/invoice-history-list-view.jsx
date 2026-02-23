import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import {
  Box,
  Paper,
  Table,
  TableRow,
  Collapse,
  TableCell,
  TableBody,
  TableHead,
  TextField,
  IconButton,
  Typography,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Field } from 'src/components/hook-form';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// A single collapsible row for a sales history record with a serial number
function CollapsibleHistoryRow({ row, serial }) {
  const collapsible = useBoolean();

  const renderCollapseContent = () => {
    const op = row.operation.toLowerCase();

    if (op === 'create' && row.changes.items) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Service</TableCell>
              <TableCell align="right">Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {row.changes.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>
                  {item.product_name ? item.product_name : item.product_id}
                </TableCell>
                <TableCell>
                  {item.service_name ? item.service_name : item.service_id}
                </TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    if (op === 'update' && row.changes.details) {
      return (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Name / ID</TableCell>
              <TableCell>Change</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {row.changes.details.map((detail, index) => (
              <TableRow key={index}>
                <TableCell>{detail.type}</TableCell>
                <TableCell>
                  {detail.product_name
                    ? detail.product_name
                    : detail.service_name
                    ? detail.service_name
                    : detail.id}
                </TableCell>
                <TableCell>{detail.change}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    if (op === 'delete') {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body1">
            <strong>Status:</strong> {row.changes.status}
          </Typography>
          <Typography variant="body2">
            <strong>Details:</strong> {row.changes.details}
          </Typography>
        </Box>
      );
    }
    return <Typography>No details available.</Typography>;
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={collapsible.onToggle}>
            <Iconify
              icon={
                collapsible.value
                  ? 'eva:arrow-ios-upward-fill'
                  : 'eva:arrow-ios-downward-fill'
              }
            />
          </IconButton>
        </TableCell>
        <TableCell>{serial}</TableCell>
        <TableCell>
          <Typography variant="body2">
            {row.invoice_number} - {row.customer_name}
          </Typography>
        </TableCell>
        <TableCell>{row.operation}</TableCell>
        <TableCell>{row.performed_by}</TableCell>
        <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={collapsible.value} timeout="auto" unmountOnExit>
            <Box margin={1}>{renderCollapseContent()}</Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Main view component that supports search, date filtering, serial numbering, and pagination.
export function SalesHistoryListView({
  storeId,
  storeSlug,
  history,
  loading,
  error,
  emptyMessage,
}) {
  const [searchText, setSearchText] = useState('');
  // Use null as initial value for date pickers.
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // For the Field.DatePicker, we create a simple form context.
  const methods = useForm();

  // Filter history based on search text and date range.
  const filteredHistory = history.filter((row) => {
    const searchMatch =
      row.operation.toLowerCase().includes(searchText.toLowerCase()) ||
      row.performed_by.toLowerCase().includes(searchText.toLowerCase());
    let dateMatch = true;
    const rowDate = new Date(row.timestamp);
    if (fromDate) {
      if (rowDate < new Date(fromDate)) dateMatch = false;
    }
    if (toDate) {
      if (rowDate > new Date(toDate)) dateMatch = false;
    }
    return searchMatch && dateMatch;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <DashboardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <CustomBreadcrumbs
        heading="Sales History"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Sales Invoice', href: paths.dashboard.invoice.root(storeSlug) },
          { name: 'History' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Paper sx={{ width: '100%', mb: 2 }}>
        {/* Search and Date Filters */}
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            variant="outlined"
            placeholder="Search history..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            fullWidth
          />
           <Box
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'nowrap',
          }}
        >
          <FormProvider {...methods}>
            <Field.DatePicker
              name="fromDate"
              label="From Date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
            <Field.DatePicker
              name="toDate"
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          </FormProvider>
          </Box>
        </Box>

        {/* Total count display */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">Total Records: {filteredHistory.length}</Typography>
        </Box>

        {/* Empty message banner */}
        {filteredHistory.length === 0 && (
          <Box
            sx={{
              p: 2,
              textAlign: 'center',
              backgroundColor: '#f8d7da',
              color: '#721c24',
            }}
          >
            {emptyMessage}
          </Box>
        )}

        {/* Collapsible table */}
        <TableContainer>
          <Table aria-label="sales history table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>No.</TableCell>
                <TableCell>Customer (Invoice)</TableCell>
                <TableCell>Operation</TableCell>
                <TableCell>Performed By</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistory
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => (
                  <CollapsibleHistoryRow
                    key={row.id}
                    row={row}
                    serial={page * rowsPerPage + index + 1}
                  />
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination controls */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredHistory.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </DashboardContent>
  );
}
