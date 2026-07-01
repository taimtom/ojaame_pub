import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { useAuthContext } from 'src/auth/hooks';
import { useGetSuppliers } from 'src/actions/product';

// ----------------------------------------------------------------------

const EMPTY_SUPPLIER = { name: '', phone: '', email: '' };

const ADD_NEW_OPTION = { id: '__add__', __isAddNew: true };

function getInitialMode(value) {
  if (value?.supplier_id) return 'existing';
  if (value?.supplier?.name?.trim() || value?.supplier?.phone?.trim()) return 'new';
  return 'existing';
}

/**
 * Supplier picker: select an existing supplier or enter new contact details.
 * onChange receives { supplier_id?, supplier? } for API payloads.
 */
export function SupplierSelect({ value, onChange, disabled = false }) {
  const { user } = useAuthContext();
  const companyId = user?.company_id;
  const { suppliers, suppliersLoading } = useGetSuppliers(companyId);

  const [mode, setMode] = useState(() => getInitialMode(value));

  const selectedSupplier = useMemo(() => {
    if (!value?.supplier_id) return null;
    return suppliers.find((s) => s.id === value.supplier_id) || null;
  }, [suppliers, value?.supplier_id]);

  const handleSelectExisting = () => {
    setMode('existing');
    onChange({ supplier_id: selectedSupplier?.id || null, supplier: null });
  };

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Supplier</Typography>

      {mode === 'existing' ? (
        <Autocomplete
          options={suppliers}
          loading={suppliersLoading}
          value={selectedSupplier}
          getOptionLabel={(option) => {
            if (option?.__isAddNew) return option.name;
            return option?.name ? `${option.name} (${option.phone})` : '';
          }}
          isOptionEqualToValue={(option, val) => {
            if (option?.__isAddNew || val?.__isAddNew) return false;
            return option.id === val?.id;
          }}
          filterOptions={(opts, state) => {
            const query = state.inputValue.toLowerCase();
            const filtered = opts.filter((option) => {
              const name = option.name?.toLowerCase() || '';
              const phone = option.phone?.toLowerCase() || '';
              return name.includes(query) || phone.includes(query);
            });
            filtered.push({
              ...ADD_NEW_OPTION,
              name: `+ Add "${state.inputValue || 'new supplier'}"`,
            });
            return filtered;
          }}
          onChange={(_, option) => {
            if (option?.__isAddNew) {
              setMode('new');
              onChange({ supplier_id: null, supplier: { ...EMPTY_SUPPLIER } });
              return;
            }
            onChange({ supplier_id: option?.id || null, supplier: null });
          }}
          renderOption={(props, option) => (
            <li
              {...props}
              key={option.id}
              style={
                option.__isAddNew
                  ? { color: 'var(--palette-primary-main)', fontWeight: 600 }
                  : undefined
              }
            >
              {option.__isAddNew ? option.name : `${option.name} (${option.phone})`}
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Select supplier" placeholder="Search by name or phone" />
          )}
          disabled={disabled}
        />
      ) : (
        <Stack spacing={2}>
          <Button
            size="small"
            color="inherit"
            onClick={handleSelectExisting}
            disabled={disabled}
            sx={{ alignSelf: 'flex-start', px: 0, minWidth: 0 }}
          >
            ← Select existing supplier
          </Button>

          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
          >
            <TextField
              label="Supplier name"
              required
              value={value?.supplier?.name || ''}
              onChange={(e) =>
                onChange({
                  supplier_id: null,
                  supplier: { ...(value?.supplier || EMPTY_SUPPLIER), name: e.target.value },
                })
              }
              disabled={disabled}
            />
            <TextField
              label="Phone number"
              required
              value={value?.supplier?.phone || ''}
              onChange={(e) =>
                onChange({
                  supplier_id: null,
                  supplier: { ...(value?.supplier || EMPTY_SUPPLIER), phone: e.target.value },
                })
              }
              disabled={disabled}
            />
            <TextField
              label="Email (optional)"
              type="email"
              value={value?.supplier?.email || ''}
              onChange={(e) =>
                onChange({
                  supplier_id: null,
                  supplier: { ...(value?.supplier || EMPTY_SUPPLIER), email: e.target.value },
                })
              }
              disabled={disabled}
              sx={{ gridColumn: { sm: 'span 2' } }}
            />
          </Box>
        </Stack>
      )}
    </Stack>
  );
}

export function buildSupplierPayload(supplierValue) {
  if (!supplierValue) return {};
  if (supplierValue.supplier_id) {
    return { supplier_id: supplierValue.supplier_id };
  }
  const { name, phone, email } = supplierValue.supplier || {};
  if (name?.trim() && phone?.trim()) {
    return {
      supplier: {
        name: name.trim(),
        phone: phone.trim(),
        email: email?.trim() || undefined,
      },
    };
  }
  return {};
}

export function isSupplierValid(supplierValue) {
  if (!supplierValue) return false;
  if (supplierValue.supplier_id) return true;
  const { name, phone } = supplierValue.supplier || {};
  return Boolean(name?.trim() && phone?.trim());
}
