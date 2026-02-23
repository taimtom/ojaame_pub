import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { CustomerQuickEditForm } from './customer-quick-edit-form';

export function CustomerTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const confirm = useBoolean();
  const popover = usePopover();
  const quickEdit = useBoolean();

  // Use row.name directly as full name.
  const fullName = row.name || 'N/A';

  return (
    <>
      <TableRow hover selected={selected} tabIndex={-1}>
        {/* Selection checkbox */}
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        {/* Name with avatar and added_by information */}
        <TableCell>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar alt={fullName}>{fullName.charAt(0)}</Avatar>
            <Stack sx={{ flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link
                color="inherit"
                onClick={onEditRow}
                sx={{ cursor: 'pointer', fontWeight: 500 }}
              >
                {fullName}
              </Link>
              <Box component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>
                {row.added_by_user_name || 'N/A'}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        {/* Phone number */}
        <TableCell>{row.phone_number || 'N/A'}</TableCell>

        {/* City */}
        <TableCell>{row.city || 'N/A'}</TableCell>

        {/* State */}
        <TableCell>{row.state || 'N/A'}</TableCell>

        {/* Address Type */}
        <TableCell>{row.address_type || 'N/A'}</TableCell>

        {/* Actions */}
        <TableCell align="right">
          <Stack direction="row" spacing={1}>
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                onClick={quickEdit.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <IconButton
              color={popover.open ? 'inherit' : 'default'}
              onClick={popover.onOpen}
            >
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      {/* Quick edit dialog */}
      <CustomerQuickEditForm
        currentUser={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
      />

      {/* Popover for additional actions */}
      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
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
          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </MenuList>
      </CustomPopover>

      {/* Confirmation dialog for deletion */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure you want to delete this customer?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
