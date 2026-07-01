import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import {
  DataGrid,
  gridClasses,
  GridToolbarExport,
  GridToolbarContainer,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { paramCase } from 'src/utils/change-case';
import { fCurrency } from 'src/utils/format-number';
import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetRestockBatches, useGetRestockBatch } from 'src/actions/product';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

function getStoreSlug(propStoreSlug, storeParam) {
  let storeSlug = propStoreSlug || storeParam;
  if (!storeSlug) {
    const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
    if (activeWorkspaceJson) {
      try {
        const activeWorkspace = JSON.parse(activeWorkspaceJson);
        if (activeWorkspace?.storeName && activeWorkspace?.id) {
          storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
        } else {
          storeSlug = 'default-store';
        }
      } catch {
        storeSlug = 'default-store';
      }
    } else {
      storeSlug = 'default-store';
    }
  }
  return storeSlug;
}

function RestockBatchDetailDialog({ batchId, open, onClose }) {
  const { restockBatch, restockBatchLoading } = useGetRestockBatch(open ? batchId : null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Restock Batch #{batchId}</DialogTitle>
      <DialogContent dividers>
        {restockBatchLoading && (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        )}
        {!restockBatchLoading && restockBatch && (
          <Stack spacing={3}>
            <Box
              display="grid"
              gap={2}
              gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
            >
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body2">{fDateTime(restockBatch.created_at)}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Recorded by
                </Typography>
                <Typography variant="body2">{restockBatch.user_name || '—'}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Total amount
                </Typography>
                <Typography variant="subtitle1">{fCurrency(restockBatch.total_amount)}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Items
                </Typography>
                <Typography variant="body2">{restockBatch.item_count}</Typography>
              </Stack>
            </Box>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">Supplier</Typography>
              {restockBatch.supplier_name ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2">{restockBatch.supplier_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {restockBatch.supplier_phone}
                  </Typography>
                  {restockBatch.supplier_email && (
                    <Typography variant="body2" color="text.secondary">
                      {restockBatch.supplier_email}
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No supplier recorded
                </Typography>
              )}
            </Stack>

            {restockBatch.notes && (
              <>
                <Divider />
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body2">{restockBatch.notes}</Typography>
                </Stack>
              </>
            )}

            <Divider />

            <Typography variant="subtitle2">Items in batch</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Unit cost</TableCell>
                  <TableCell align="right">Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(restockBatch.items || []).map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>{line.product_name}</TableCell>
                    <TableCell align="right">{line.quantity}</TableCell>
                    <TableCell align="right">
                      {line.unit_cost != null ? fCurrency(line.unit_cost) : '—'}
                    </TableCell>
                    <TableCell align="right">{fCurrency(line.line_total || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function RestockHistoryListView({ storeSlug: propStoreSlug }) {
  const { storeParam } = useParams();
  const storeSlug = getStoreSlug(propStoreSlug, storeParam);
  const numericStoreId = storeSlug.split('-').pop();

  const { restockBatches, restockBatchesLoading } = useGetRestockBatches(numericStoreId);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  const handleViewBatch = useCallback((id) => {
    setSelectedBatchId(id);
  }, []);

  const columns = [
    {
      field: 'created_at',
      headerName: 'Date',
      width: 180,
      valueFormatter: (value) => (value ? fDateTime(value) : '—'),
    },
    {
      field: 'supplier_name',
      headerName: 'Supplier',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => params.row.supplier_name || '—',
    },
    {
      field: 'supplier_phone',
      headerName: 'Phone',
      width: 140,
      renderCell: (params) => params.row.supplier_phone || '—',
    },
    {
      field: 'item_count',
      headerName: 'Items',
      width: 90,
      type: 'number',
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 130,
      valueFormatter: (value) => fCurrency(value || 0),
    },
    {
      field: 'user_name',
      headerName: 'Recorded by',
      width: 160,
    },
    {
      field: 'actions',
      headerName: ' ',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            handleViewBatch(params.row.id);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarQuickFilter />
      <Stack flexGrow={1} direction="row" justifyContent="flex-end">
        <GridToolbarExport />
      </Stack>
    </GridToolbarContainer>
  );

  return (
    <DashboardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <CustomBreadcrumbs
        heading="Restock History"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Product', href: paths.dashboard.product.root(storeSlug) },
          { name: 'Restock History' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card
        sx={{
          flexGrow: { md: 1 },
          display: { md: 'flex' },
          height: { xs: 800, md: 2 },
          flexDirection: { md: 'column' },
        }}
      >
        <DataGrid
          rows={restockBatches}
          columns={columns}
          loading={restockBatchesLoading}
          getRowHeight={() => 'auto'}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          onRowClick={(params) => handleViewBatch(params.row.id)}
          slots={{
            toolbar: CustomToolbar,
            noRowsOverlay: () => <EmptyContent title="No restock batches yet" />,
            noResultsOverlay: () => <EmptyContent title="No results found" />,
          }}
          sx={{
            [`& .${gridClasses.cell}`]: { alignItems: 'center', display: 'inline-flex' },
            [`& .${gridClasses.row}`]: { cursor: 'pointer' },
          }}
        />
      </Card>

      <RestockBatchDetailDialog
        batchId={selectedBatchId}
        open={Boolean(selectedBatchId)}
        onClose={() => setSelectedBatchId(null)}
      />
    </DashboardContent>
  );
}
