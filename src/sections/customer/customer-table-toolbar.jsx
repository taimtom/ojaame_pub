import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

const ADDRESS_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Home', label: 'Home' },
  { value: 'Office', label: 'Office' },
  { value: 'Walk In', label: 'Walk In' },
];

export function CustomerTableToolbar({ filters, options, onResetPage }) {
  const popover = usePopover();

  const handleNameFilterChange = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleAddressTypeFilterChange = useCallback(
    (event) => {
      // Here we expect a single value; if you need multiple selections, adjust accordingly.
      onResetPage();
      filters.setState({ addressType: event.target.value });
    },
    [filters, onResetPage]
  );

  return (
    <>
      <Stack
        spacing={2}
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-end', md: 'center' }}
        sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
      >
        <FormControl sx={{ width: { xs: '100%', md: 200 } }}>
          <InputLabel id="customer-address-type-select-label">Address Type</InputLabel>
          <Select
            labelId="customer-address-type-select-label"
            value={filters.state.addressType || 'all'}
            onChange={handleAddressTypeFilterChange}
            input={<OutlinedInput label="Address Type" />}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            {ADDRESS_TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <TextField
            fullWidth
            value={filters.state.name}
            onChange={handleNameFilterChange}
            placeholder="Search by name..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <IconButton onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </Stack>
      </Stack>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem onClick={popover.onClose}>
            <Iconify icon="solar:printer-minimalistic-bold" />
            Print
          </MenuItem>
          <MenuItem onClick={popover.onClose}>
            <Iconify icon="solar:import-bold" />
            Import
          </MenuItem>
          <MenuItem onClick={popover.onClose}>
            <Iconify icon="solar:export-bold" />
            Export
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}
