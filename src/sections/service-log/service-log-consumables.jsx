import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

export function ServiceLogConsumables({
  items,
  onChange,
  onAddClick,
  currencySymbol,
  disabled = false,
}) {
  const updateItem = (index, patch) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Products used
        </Typography>
        <Button
          size="small"
          variant="text"
          disabled={disabled}
          startIcon={<Iconify icon="eva:plus-fill" width={16} />}
          onClick={onAddClick}
        >
          Add product
        </Button>
      </Stack>

      {!items.length && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>
          No products added yet.
        </Typography>
      )}

      <Stack spacing={1}>
        {items.map((row, index) => (
          <Stack key={`${row.product_id}-${index}`} direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              fullWidth
              label="Product"
              value={row.product_name || ''}
              disabled
            />
            <TextField
              size="small"
              label="Qty"
              type="number"
              value={row.quantity_used}
              disabled={disabled}
              onChange={(e) =>
                updateItem(index, { quantity_used: Math.max(0, Number(e.target.value) || 0) })
              }
              sx={{ width: 100 }}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              size="small"
              label="Unit price"
              value={row.unit_price != null ? fCurrency(row.unit_price) : `${currencySymbol || ''}0`}
              disabled
              sx={{ width: 140 }}
            />
            <TextField
              size="small"
              label="Total"
              value={fCurrency((Number(row.quantity_used) || 0) * (Number(row.unit_price) || 0))}
              disabled
              sx={{ width: 140 }}
            />
            <IconButton
              size="small"
              color="error"
              disabled={disabled}
              onClick={() => removeItem(index)}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
