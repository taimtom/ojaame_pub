import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { AiAgentMarkdown } from './ai-agent-markdown';

// ----------------------------------------------------------------------

function formatQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value ?? '');
  // Keep up to 4 decimals, drop trailing zeros (0.483870967… → 0.4839)
  return String(Number(n.toFixed(4)));
}

function formatToolPreview(toolName, payload) {
  if (toolName === 'create_quick_sale') {
    const items = payload?.items || [];
    const lines = items.map((i) => {
      const amountMode = i.line_amount != null;
      const packMode = String(i.pack_sale_mode || 'unit').toLowerCase() === 'pack';
      const qty = Number(i.quantity);
      const price = Number(i.unit_price);
      const sub = Number(i.subtotal);
      if (amountMode) {
        return `${i.name}: ₦${Number(i.line_amount).toLocaleString()} (≈${formatQty(qty)} × ₦${price.toLocaleString()})`;
      }
      if (packMode) {
        const qpp = Number(i.quantity_per_pack) || null;
        const qppHint = qpp ? ` (${formatQty(qty * qpp)} units)` : '';
        return `${i.name} × ${formatQty(qty)} pack${qty === 1 ? '' : 's'}${qppHint} @ ₦${price.toLocaleString()} = ₦${sub.toLocaleString()}`;
      }
      return `${i.name} × ${formatQty(qty)} @ ₦${price.toLocaleString()} = ₦${sub.toLocaleString()}`;
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

export function AiAgentPendingAction({ action, onConfirm, onCancel, disabled, compact = false }) {
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

        <Stack direction="row" spacing={1}>
          <Box
            component="button"
            type="button"
            disabled={disabled}
            onClick={onConfirm}
            sx={{
              flex: compact ? 1 : undefined,
              border: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
              borderRadius: 1.5,
              px: 2,
              py: compact ? 1.25 : 1,
              bgcolor: 'success.main',
              color: 'success.contrastText',
              fontWeight: 600,
              opacity: disabled ? 0.6 : 1,
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
