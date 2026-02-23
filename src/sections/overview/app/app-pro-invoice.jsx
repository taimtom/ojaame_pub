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

import { useStoreTopProducts } from 'src/actions/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

export function AppNewProduct({ title, subheader, storeId, headLabel, ...other }) {
  const [period, setPeriod] = useState('month');
  const [limit, setLimit] = useState(5);

  const { topProducts = [], topProductsLoading, refetchTopProducts } =
    useStoreTopProducts(storeId, period, limit);

  useEffect(() => {
    if (refetchTopProducts) refetchTopProducts();
  }, [period, limit, refetchTopProducts]);

  const tableData = useMemo(
    () =>
      topProducts.map((p) => ({
        id: p.product_id,
        name: p.name,
        qty: p.total_quantity,
        revenue: p.total_revenue,
        txns: p.transaction_count,
      })),
    [topProducts]
  );

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={subheader}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small">
              <InputLabel>Period</InputLabel>
              <Select
                value={period}
                label="Period"
                onChange={(e) => setPeriod(e.target.value)}
                size="small"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="year">Year</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Limit</InputLabel>
              <Select
                value={limit}
                label="Limit"
                onChange={(e) => setLimit(Number(e.target.value))}
                size="small"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        }
        sx={{ mb: 3 }}
      />

      <Scrollbar sx={{ minHeight: 402, position: 'relative' }}>
        {topProductsLoading && (
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <CircularProgress />
          </Box>
        )}
        <Table>
          <TableHeadCustom headLabel={headLabel} />
          <TableBody>
            { !topProductsLoading && tableData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headLabel.length} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Iconify
                      icon="eva:file-text-outline"
                      sx={{
                        fontSize: 48,
                        color: 'text.disabled',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        },
                        animation: 'spin 2s linear infinite'
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      No products to display
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              tableData.map((row) => (
                <RowItem key={row.id} row={row} loading={topProductsLoading} />
              ))
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
          disabled={topProductsLoading}
        >
          View all
        </Button>
      </Box>
    </Card>
  );
}

function RowItem({ row, loading }) {
  const popover = usePopover();
  const { id, name, qty, revenue, txns } = row;

  const handleAction = (type) => {
    console.info(type.toUpperCase(), id);
    popover.onClose();
  };

  return (
    <>
      <TableRow>
        <TableCell>{name}</TableCell>
        <TableCell>{`${qty} sold`}</TableCell>
        <TableCell>
        {fCurrency(revenue, { currency: 'NGN' })}
      </TableCell>
        {/* <TableCell>{fCurrency(revenue)}</TableCell> */}
        <TableCell>
          <Label variant="soft" color={txns === 0 ? 'error' : 'success'}>
            {`${txns} txns`}
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
