import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function formatPaymentMethodLabel(pm) {
  if (!pm) return '';
  const type = String(pm.method_type || '').replace(/_/g, ' ').toUpperCase();
  return pm.issuer ? `${type} — ${pm.issuer}` : type;
}

export function sumPaymentLines(lines) {
  return (lines || []).reduce((s, line) => s + (Number(line.amount) || 0), 0);
}

const AMOUNT_EPS = 0.02;

// ----------------------------------------------------------------------

export function QuickDashboardPayments({
  lines,
  onChange,
  cartTotal,
  paymentMethods = [],
  paymentMethodsLoading = false,
  disabled = false,
  showSummary = true,
  compact = false,
  onPaymentsTouched,
}) {
  const paidSum = sumPaymentLines(lines);
  const balance = Math.max(0, cartTotal - paidSum);
  const overpayment = Math.max(0, paidSum - cartTotal);
  const isOverpaid = overpayment > AMOUNT_EPS;

  const updateLine = (index, patch) => {
    onChange(
      lines.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  };

  const addLine = () => {
    onPaymentsTouched?.();
    const suggested = Math.max(0, cartTotal - paidSum);
    const defaultMethodId = paymentMethods[0]?.id ?? '';
    onChange([
      ...lines,
      { payment_method_id: defaultMethodId, amount: suggested },
    ]);
  };

  const removeLine = (index) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ mb: compact ? 0 : 1.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Payments
        </Typography>
        <Button
          size="small"
          variant="text"
          disabled={disabled || paymentMethodsLoading || !paymentMethods.length}
          startIcon={<Iconify icon="eva:plus-fill" width={16} />}
          onClick={addLine}
          sx={{ minWidth: 0, px: 0.5 }}
        >
          Add payment
        </Button>
      </Stack>

      {paymentMethodsLoading && (
        <Box display="flex" justifyContent="center" py={1}>
          <CircularProgress size={20} />
        </Box>
      )}

      {!paymentMethodsLoading && paymentMethods.length === 0 && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
          No payment methods configured for this store. Add them in Settings.
        </Typography>
      )}

      {lines.map((line, idx) => (
        <Stack
          key={`pay-${idx}`}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ sm: 'center' }}
          sx={{ mb: 1 }}
        >
          <FormControl fullWidth size="small" disabled={disabled || paymentMethodsLoading}>
            <InputLabel>Method</InputLabel>
            <Select
              value={line.payment_method_id || ''}
              label="Method"
              onChange={(e) => updateLine(idx, { payment_method_id: e.target.value })}
            >
              {paymentMethods.map((pm) => (
                <MenuItem key={pm.id} value={pm.id}>
                  {formatPaymentMethodLabel(pm)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Amount"
            type="number"
            disabled={disabled}
            value={line.amount === 0 ? '' : line.amount}
            onChange={(e) => {
              onPaymentsTouched?.();
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              updateLine(idx, { amount: Number.isFinite(val) ? val : 0 });
            }}
            inputProps={{ min: 0, step: 0.01, max: cartTotal }}
            error={isOverpaid}
          />

          {lines.length > 1 && (
            <IconButton
              color="error"
              size="small"
              disabled={disabled}
              onClick={() => removeLine(idx)}
              sx={{ flexShrink: 0 }}
            >
              <Iconify icon="eva:close-circle-outline" />
            </IconButton>
          )}
        </Stack>
      ))}

      {showSummary && (
        <Box
          sx={{
            mt: 1,
            p: 1.25,
            borderRadius: 1,
            bgcolor: 'background.neutral',
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Total paid
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {fCurrency(paidSum)}
              </Typography>
            </Stack>
            {isOverpaid ? (
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="error.main">
                  Overpayment
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {fCurrency(overpayment)} over limit
                </Typography>
              </Stack>
            ) : (
              <Stack direction="row" justifyContent="space-between">
                <Typography
                  variant="body2"
                  color={balance > AMOUNT_EPS ? 'warning.main' : 'success.main'}
                >
                  {balance > AMOUNT_EPS ? 'Balance due' : 'Balance'}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={balance > AMOUNT_EPS ? 'warning.main' : 'success.main'}
                >
                  {balance > AMOUNT_EPS ? fCurrency(balance) : 'Fully paid'}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
