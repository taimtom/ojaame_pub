import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

export function ServiceLogExpenses({ items, onChange, disabled = false }) {
  const updateItem = (index, patch) => {
    onChange(items.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    onChange([
      ...items,
      { amount: '', description: '', category: 'Service delivery' },
    ]);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Quick expenses on this service
        </Typography>
        <Button
          size="small"
          variant="text"
          disabled={disabled}
          startIcon={<Iconify icon="eva:plus-fill" width={16} />}
          onClick={addItem}
        >
          Add expense
        </Button>
      </Stack>

      {!items.length && (
        <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>
          No expenses added.
        </Typography>
      )}

      <Stack spacing={1}>
        {items.map((row, index) => (
          <Stack key={`expense-${index}`} direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              fullWidth
              label="Description"
              value={row.description}
              disabled={disabled}
              onChange={(e) => updateItem(index, { description: e.target.value })}
            />
            <TextField
              size="small"
              label="Amount"
              type="number"
              value={row.amount}
              disabled={disabled}
              onChange={(e) => updateItem(index, { amount: e.target.value })}
              sx={{ width: 120 }}
              inputProps={{ min: 0, step: 0.01 }}
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
