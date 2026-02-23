// src/sections/overview/app/app-recent-invoices.jsx
import React, { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputLabel from '@mui/material/InputLabel';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import { useStoreRecentInvoices } from 'src/actions/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

export function AppNewInvoice({ title, subheader, storeId, headLabel, sx, ...other }) {
  const [limit, setLimit] = useState(5);
  const [status, setStatus] = useState('paid');

  // fetch with dynamic params
  const {
    recentInvoices = [],
    recentInvoicesLoading,
    refetchRecentInvoices,
  } = useStoreRecentInvoices(storeId, { limit, status_filter: status });

  // re-fetch whenever filters change
  useEffect(() => {
    if (refetchRecentInvoices) {
      refetchRecentInvoices();
    }
  }, [limit, status, refetchRecentInvoices]);

  // map API to table rows
  const tableData = useMemo(
    () =>
      recentInvoices.map((inv) => ({
        id:            inv.invoice_id,
        invoiceNumber: inv.invoice_number,
        category:      inv.category,
        price:         inv.price,
        status:        inv.status,
      })),
    [recentInvoices]
  );

  return (
    <Card sx={sx}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Status filter */}
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>
            {/* Limit filter */}
            <FormControl size="small">
              <InputLabel>Limit</InputLabel>
              <Select
                value={limit}
                label="Limit"
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <MenuItem key={n} value={n}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ mb: 3 }}
      />

      <Scrollbar sx={{ minHeight: 402, position: 'relative' }}>
        {recentInvoicesLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Table sx={{ minWidth: 680 }}>
          <TableHeadCustom headLabel={headLabel} />
          <TableBody>
            {!recentInvoicesLoading && tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headLabel.length} align="center" sx={{ py: 8 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Iconify
                      icon="eva:file-text-outline"
                      sx={{
                        fontSize: 48,
                        color: 'text.disabled',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                        animation: 'spin 2s linear infinite',
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No invoices to display
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => <RowItem key={row.id} row={row} loading={recentInvoicesLoading} />)
            )}
          </TableBody>
        </Table>
      </Scrollbar>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} />}
          disabled={recentInvoicesLoading}
        >
          View all
        </Button>
      </Box>
    </Card>
  );
}

function RowItem({ row, loading }) {
  const popover = usePopover();

  const handleAction = (type) => {
    console.info(type.toUpperCase(), row.id);
    popover.onClose();
  };

  return (
    <>
      <TableRow>
        <TableCell>{row.invoiceNumber}</TableCell>
        <TableCell>{row.category}</TableCell>
        <TableCell>{fCurrency(row.price)}</TableCell>
        <TableCell>
          <Label
            variant="soft"
            color={row.status === 'paid' ? 'success' : 'warning'}
          >
            {row.status}
          </Label>
        </TableCell>
        <TableCell align="right" sx={{ pr: 1 }}>
          <IconButton onClick={popover.onOpen} disabled={loading}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          {['download', 'print', 'share', 'delete'].map((action) => (
            <MenuItem
              key={action}
              onClick={() => handleAction(action)}
              sx={action === 'delete' ? { color: 'error.main' } : {}}
            >
              <Iconify
                icon={
                  action === 'download'
                    ? 'eva:cloud-download-fill'
                    : action === 'print'
                    ? 'solar:printer-minimalistic-bold'
                    : action === 'share'
                    ? 'solar:share-bold'
                    : 'solar:trash-bin-trash-bold'
                }
              />
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
