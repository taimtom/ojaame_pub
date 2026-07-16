import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import { AiAgentMarkdown } from './ai-agent-markdown';

// ----------------------------------------------------------------------

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  return String(Number(n.toFixed(4)));
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function recalcItem(item, field, rawValue) {
  const next = { ...item };
  if (field === 'quantity') {
    next.quantity = rawValue;
  } else if (field === 'unit_price') {
    next.unit_price = rawValue;
  }
  const qty = Number(next.quantity);
  const price = Number(next.unit_price);
  if (Number.isFinite(qty) && Number.isFinite(price) && qty > 0 && price >= 0) {
    next.subtotal = Math.round(qty * price * 100) / 100;
  }
  delete next.line_amount;
  return next;
}

function initSaleItem(item) {
  const price = Number(item.unit_price);
  const lineAmount = item.line_amount != null ? Number(item.line_amount) : null;
  let subtotal = Number(item.subtotal) || 0;
  let quantity = Number(item.quantity);

  if (lineAmount != null && Number.isFinite(lineAmount)) {
    subtotal = lineAmount;
    if (Number.isFinite(price) && price > 0) {
      quantity = lineAmount / price;
    }
  } else if (Number.isFinite(quantity) && Number.isFinite(price) && quantity > 0 && price >= 0) {
    const expected = Math.round(quantity * price * 100) / 100;
    if (Math.abs(subtotal - quantity * price) > 0.02) {
      subtotal = expected;
    }
  }

  return {
    ...item,
    quantity: Number.isFinite(quantity) ? quantity : item.quantity ?? '',
    unit_price: item.unit_price ?? '',
    subtotal,
    line_amount: lineAmount,
  };
}

function formatToolPreview(toolName, payload) {
  if (toolName === 'create_quick_sale') {
    const items = payload?.items || [];
    const lines = items.map((i) => {
      const packMode = String(i.pack_sale_mode || 'unit').toLowerCase() === 'pack';
      const qty = Number(i.quantity);
      const price = Number(i.unit_price);
      const sub = Number(i.subtotal);
      if (packMode) {
        const qpp = Number(i.quantity_per_pack) || null;
        const qppHint = qpp ? ` (${formatQty(qty * qpp)} units)` : '';
        return `${i.name} × ${formatQty(qty)} pack${qty === 1 ? '' : 's'}${qppHint} @ ₦${price.toLocaleString()} = ₦${sub.toLocaleString()}`;
      }
      const unitLabel = qty === 1 ? 'pc' : 'pcs';
      return `${i.name} × ${formatQty(qty)} ${unitLabel} @ ₦${price.toLocaleString()} = ₦${sub.toLocaleString()}`;
    });
    const total = items.reduce((sum, i) => sum + Number(i.subtotal || 0), 0);
    const pay = payload?.payment_method ? `\nPayment: ${payload.payment_method}` : '';
    return `${lines.join('\n')}\nTotal: ₦${total.toLocaleString()}${pay}`;
  }
  if (toolName === 'bulk_restock') {
    const items = payload?.items || [];
    return `${items.length} product(s) to restock`;
  }
  if (toolName === 'create_product') {
    return `${payload?.name} — ₦${Number(payload?.price || 0).toLocaleString()}`;
  }
  if (toolName === 'create_customer') {
    return `${payload?.name} (${payload?.phone_number || ''})`;
  }
  return JSON.stringify(payload, null, 2);
}

function SaleLineEditor({ item, index, compact, onChange }) {
  const packMode = String(item.pack_sale_mode || 'unit').toLowerCase() === 'pack';
  const qtyLabel = packMode ? 'Packs' : 'Qty';

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={compact ? 0.75 : 1}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      sx={{
        py: compact ? 0.75 : 1,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-child': { borderBottom: 0 },
      }}
    >
      <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap title={item.name}>
          {item.name}
        </Typography>
        {packMode && item.quantity_per_pack ? (
          <Typography variant="caption" color="text.secondary">
            Pack × {formatQty(item.quantity_per_pack)} units
          </Typography>
        ) : null}
      </Box>

      <TextField
        size="small"
        type="number"
        label={qtyLabel}
        value={item.quantity ?? ''}
        onChange={(e) => onChange(index, 'quantity', e.target.value)}
        inputProps={{ min: 0, step: 'any' }}
        sx={{ width: { xs: '100%', sm: compact ? 88 : 96 } }}
      />

      <TextField
        size="small"
        type="number"
        label={packMode ? 'Pack price' : 'Unit price'}
        value={item.unit_price ?? ''}
        onChange={(e) => onChange(index, 'unit_price', e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start">₦</InputAdornment>,
        }}
        inputProps={{ min: 0, step: 'any' }}
        sx={{ width: { xs: '100%', sm: compact ? 120 : 132 } }}
      />

      <Typography
        variant="body2"
        fontWeight={600}
        sx={{
          width: { xs: '100%', sm: compact ? 88 : 96 },
          textAlign: { xs: 'left', sm: 'right' },
          flexShrink: 0,
        }}
      >
        {formatMoney(item.subtotal)}
      </Typography>
    </Stack>
  );
}

export function AiAgentPendingAction({ action, onConfirm, onCancel, disabled, compact = false }) {
  const [saleItems, setSaleItems] = useState([]);

  const isEditableSale = action?.tool_name === 'create_quick_sale';

  useEffect(() => {
    if (!action || action.status !== 'pending') {
      setSaleItems([]);
      return;
    }
    if (action.tool_name === 'create_quick_sale') {
      setSaleItems((action.payload?.items || []).map(initSaleItem));
    } else {
      setSaleItems([]);
    }
  }, [action]);

  const saleTotal = useMemo(
    () => saleItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [saleItems]
  );

  const saleValid = useMemo(
    () =>
      saleItems.length > 0 &&
      saleItems.every((item) => {
        const qty = Number(item.quantity);
        const price = Number(item.unit_price);
        return Number.isFinite(qty) && qty > 0 && Number.isFinite(price) && price >= 0;
      }),
    [saleItems]
  );

  const handleSaleItemChange = (index, field, rawValue) => {
    setSaleItems((prev) =>
      prev.map((item, i) => (i === index ? recalcItem(item, field, rawValue) : item))
    );
  };

  const handleConfirm = () => {
    if (!action) return;
    if (isEditableSale) {
      if (!saleValid) return;
      const payload = {
        ...action.payload,
        items: saleItems.map((item) => {
          const quantity = Number(item.quantity);
          const unit_price = Number(item.unit_price);
          return {
            id: item.id,
            type: item.type,
            name: item.name,
            quantity,
            unit_price,
            subtotal: Math.round(quantity * unit_price * 100) / 100,
            pack_sale_mode: item.pack_sale_mode,
            quantity_per_pack: item.quantity_per_pack,
          };
        }),
      };
      onConfirm(payload);
      return;
    }
    onConfirm();
  };

  if (!action || action.status !== 'pending') return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: compact ? 1.5 : 2,
        mx: compact ? 1.5 : 2,
        mb: compact ? 1 : 2,
        borderColor: 'warning.main',
        bgcolor: 'warning.lighter',
        borderRadius: 2,
        flexShrink: 0,
      }}
    >
      <Stack spacing={compact ? 1.25 : 1.5}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Iconify icon="solar:shield-warning-bold" width={22} color="warning.main" />
          <Typography variant="subtitle2">Confirm action</Typography>
          <Chip size="small" label={action.tool_name.replace(/_/g, ' ')} color="warning" variant="soft" />
        </Stack>

        <AiAgentMarkdown>{action.summary}</AiAgentMarkdown>

        {isEditableSale ? (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.paper',
              maxHeight: compact ? 220 : 280,
              overflow: 'auto',
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                pb: 0.5,
                px: 0.25,
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                Product
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: compact ? 88 : 96, textAlign: 'center' }}>
                Qty
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: compact ? 120 : 132, textAlign: 'center' }}>
                Price
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ width: compact ? 88 : 96, textAlign: 'right' }}>
                Subtotal
              </Typography>
            </Stack>

            {saleItems.map((item, index) => (
              <SaleLineEditor
                key={`${item.id}-${index}`}
                item={item}
                index={index}
                compact={compact}
                onChange={handleSaleItemChange}
              />
            ))}

            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1.25 }}>
              <Typography variant="body2" color="text.secondary">
                {action.payload?.payment_method
                  ? `Payment: ${action.payload.payment_method}`
                  : 'Adjust quantity or price before confirming'}
              </Typography>
              <Typography variant="subtitle2">Total: {formatMoney(saleTotal)}</Typography>
            </Stack>
          </Box>
        ) : (
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'background.paper',
              fontSize: 12,
              overflow: 'auto',
              maxHeight: compact ? 120 : 160,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {formatToolPreview(action.tool_name, action.payload)}
          </Box>
        )}

        <Stack direction="row" spacing={1}>
          <Box
            component="button"
            type="button"
            disabled={disabled || (isEditableSale && !saleValid)}
            onClick={handleConfirm}
            sx={{
              flex: compact ? 1 : undefined,
              border: 0,
              cursor: disabled || (isEditableSale && !saleValid) ? 'not-allowed' : 'pointer',
              borderRadius: 1.5,
              px: 2,
              py: compact ? 1.25 : 1,
              bgcolor: 'success.main',
              color: 'success.contrastText',
              fontWeight: 600,
              opacity: disabled || (isEditableSale && !saleValid) ? 0.6 : 1,
              minHeight: compact ? 44 : undefined,
            }}
          >
            Confirm
          </Box>
          <Box
            component="button"
            type="button"
            disabled={disabled}
            onClick={onCancel}
            sx={{
              flex: compact ? 1 : undefined,
              border: 1,
              borderColor: 'divider',
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderRadius: 1.5,
              px: 2,
              py: compact ? 1.25 : 1,
              bgcolor: 'background.paper',
              fontWeight: 600,
              opacity: disabled ? 0.6 : 1,
              minHeight: compact ? 44 : undefined,
            }}
          >
            Cancel
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}
