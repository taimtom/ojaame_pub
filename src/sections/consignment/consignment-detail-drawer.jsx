import PropTypes from 'prop-types';

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  CONSIGNMENT_STATUS_COLORS,
  consignmentHasOnHand,
  formatItemProgress,
  getConsignmentActionAccess,
  getConsignmentActionLabel,
  getConsignmentEventLabel,
  getConsignmentStatusLabel,
  getSettlementLabel,
  itemOnHand,
} from 'src/utils/consignment-permissions';

export function ConsignmentDetailDrawer({
  open,
  onClose,
  consignment,
  storeId,
  submitting,
  onAction,
  userPermissions,
}) {
  if (!consignment) {
    return null;
  }

  const access = getConsignmentActionAccess({
    userPermissions,
    currentStoreId: storeId,
    consignment,
  });

  const direction = consignment.direction || 'borrowing';
  const isLending = direction === 'lending';

  const events = [...(consignment.events || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const actionButtons = [
    { key: 'receive', show: access.canReceive, variant: 'contained' },
    { key: 'return', show: access.canReturn },
  ].filter((btn) => btn.show);

  const showReturnDue =
    consignment.return_due_date &&
    consignmentHasOnHand(consignment) &&
    ['received', 'return_overdue'].includes(consignment.status);

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 1, sm: 480 } } }}>
      <Stack direction="row" alignItems="center" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {consignment.consignment_number}
        </Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Scrollbar sx={{ flex: 1 }}>
        <Stack spacing={2} sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={getConsignmentStatusLabel(consignment.status, direction)}
              color={CONSIGNMENT_STATUS_COLORS[consignment.status] || 'default'}
              size="small"
            />
            <Chip label={isLending ? 'lent' : direction} size="small" variant="outlined" />
            {consignment.partner_name && (
              <Chip label={consignment.partner_name} size="small" variant="outlined" />
            )}
          </Stack>

          {isLending &&
            (consignment.items || []).some((i) => Number(i.qty_on_hand ?? 0) > 0 || itemOnHand(i) > 0) && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              Stock with partner — partner owes you when they sell
            </Alert>
          )}

          {Number(consignment.total_owed || 0) > 0 &&
            consignment.payment_status &&
            consignment.payment_status !== 'paid' && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Owe {consignment.partner_name || 'partner'}: {fCurrency(consignment.total_owed)}
              {consignment.payment_status === 'unpaid' ? ' — unpaid' : ' — partially paid'}
            </Alert>
          )}

          {(consignment.items || []).some((i) => Number(i.qty_sold || 0) > 0) &&
            consignment.payment_status === 'paid' &&
            Number(consignment.total_owed || 0) === 0 && (
            <Alert severity="success" sx={{ py: 0.5 }}>
              Partner payment recorded
            </Alert>
          )}

          {showReturnDue && (
            <Typography variant="body2" color="text.secondary">
              Return due: {fDateTime(consignment.return_due_date)}
            </Typography>
          )}

          {consignment.notes && (
            <Typography variant="body2">{consignment.notes}</Typography>
          )}

          <Divider />

          <Typography variant="subtitle2">Items</Typography>
          {(consignment.items || []).map((item) => (
            <Box key={item.id} sx={{ p: 1.5, borderRadius: 1, border: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2">{item.product_name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {formatItemProgress(item, direction)}
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                {item.settlement_type === 'fixed_cost'
                  ? `${getSettlementLabel(direction)}: ${item.agreed_cost ?? '—'}`
                  : `Commission: ${item.commission_percent ?? '—'}%`}
              </Typography>
              {Number(item.qty_sold || 0) > 0 && Number(item.amount_owed || 0) > 0 && (
                <Typography variant="caption" display="block" color="text.secondary">
                  Owed: {fCurrency(item.amount_owed)}
                  {item.vendor_bill_status ? ` (${item.vendor_bill_status})` : ''}
                </Typography>
              )}
            </Box>
          ))}

          <Divider />

          <Typography variant="subtitle2">Timeline</Typography>
          {events.map((event, idx) => (
            <Box key={`${event.event_type}-${event.created_at}-${idx}`}>
              <Typography variant="subtitle2">
                {getConsignmentEventLabel(event.event_type, direction)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {fDateTime(event.created_at)}
                {event.actor_name ? ` · ${event.actor_name}` : ''}
              </Typography>
              {event.notes && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {event.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Scrollbar>

      {actionButtons.length > 0 && (
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          {actionButtons.map((btn) => (
            <Button
              key={btn.key}
              size="small"
              variant={btn.variant || 'outlined'}
              disabled={submitting}
              onClick={() => onAction(btn.key, consignment)}
            >
              {getConsignmentActionLabel(btn.key, direction)}
            </Button>
          ))}
        </Stack>
      )}
    </Drawer>
  );
}

ConsignmentDetailDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  consignment: PropTypes.object,
  storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  submitting: PropTypes.bool,
  onAction: PropTypes.func,
  userPermissions: PropTypes.array,
};
