import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function InvoiceTableRow({ row, selected, onSelectRow, onViewRow, onEditRow, onHistoryRow, onDeleteRow, onMarkAsPaid }) {
  const confirm = useBoolean();
  const confirmPaid = useBoolean();

  const popover = usePopover();
  const customerName = row.customer_name || 'N/A';

  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox
            checked={selected}
            onClick={onSelectRow}
            inputProps={{ id: `row-checkbox-${row.id}`, 'aria-label': `Row checkbox` }}
          />
        </TableCell>

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
          <Avatar alt={customerName}>
              {customerName ? customerName.charAt(0).toUpperCase() : ''}
            </Avatar>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2" noWrap>
                  {customerName}
                </Typography>
              }
              secondary={
                <Link
                  noWrap
                  variant="body2"
                  onClick={onViewRow}
                  sx={{ color: 'text.disabled', cursor: 'pointer' }}
                >
                  {row.invoice_number}
                </Link>
              }
            />
          </Stack>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.fullcreate_date)}
            secondary={fTime(row.fullcreate_date)}
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
            secondaryTypographyProps={{ mt: 0.5, component: 'span', typography: 'caption' }}
          />
        </TableCell>

        <TableCell>
          <ListItemText
            primary={fDate(row.fulldue_date)}
            secondary={fTime(row.fulldue_date)}
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
            secondaryTypographyProps={{ mt: 0.5, component: 'span', typography: 'caption' }}
          />
        </TableCell>

        <TableCell>{fCurrency(row.total_amount)}</TableCell>

        <TableCell>
          {(() => {
            const isFullyPaid = row.status === 'paid' || row.status === 'completed';
            const paymentsSum = row.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
            // For paid/completed sales, treat the full amount as paid regardless of payment records
            const displayPaid = isFullyPaid ? row.total_amount : paymentsSum;
            const due = row.total_amount - displayPaid;
            return (
              <>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  {fCurrency(displayPaid)}
                </Typography>
                {!isFullyPaid && due > 0 && (
                  <Typography variant="caption" sx={{ color: 'error.main', display: 'block' }}>
                    Due: {fCurrency(due)}
                  </Typography>
                )}
              </>
            );
          })()}
        </TableCell>

        <TableCell>
          {row.discount > 0 ? (
            <Typography variant="body2" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              -{fCurrency(row.discount)}
            </Typography>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled' }}>
              No Discount
            </Typography>
          )}
        </TableCell>

        <TableCell align="center">{row.sent}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'paid' && 'success') ||
              (row.status === 'pending' && 'warning') ||
              (row.status === 'overdue' && 'error') ||
              (row.status === 'credit' && 'warning') ||
              (row.status === 'draft' && 'default') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell align="right" sx={{ px: 1 }}>
          <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
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
          <MenuItem
            onClick={() => {
              onViewRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            View
          </MenuItem>

          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => {
              onHistoryRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:eye-bold" />
            SalesHistory
          </MenuItem>

          {row.status === 'credit' && (
            <MenuItem
              onClick={() => {
                confirmPaid.onTrue();
                popover.onClose();
              }}
              sx={{ color: 'success.main' }}
            >
              <Iconify icon="solar:check-circle-bold" />
              Mark as Paid
            </MenuItem>
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />

      <ConfirmDialog
        open={confirmPaid.value}
        onClose={confirmPaid.onFalse}
        title="Mark as Paid"
        content={
          <>
            Mark <strong>{row.customer_name || 'this sale'}</strong> ({row.invoice_number}) as fully paid?
          </>
        }
        action={
          <Button variant="contained" color="success" onClick={() => { onMarkAsPaid(); confirmPaid.onFalse(); }}>
            Confirm
          </Button>
        }
      />
    </>
  );
}
