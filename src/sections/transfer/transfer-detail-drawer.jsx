import PropTypes from 'prop-types';

import {
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
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { getTransferActionAccess, TRANSFER_ACTION_LABELS } from 'src/utils/transfer-permissions';

const STATUS_COLORS = {
  created: 'default',
  packed: 'info',
  picked_up: 'warning',
  in_transit: 'warning',
  delivered: 'success',
  received: 'success',
  reconciled_with_exception: 'error',
  closed: 'primary',
};

const EVIDENCE_VALUE_PROP_TYPE = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number,
  PropTypes.bool,
  PropTypes.arrayOf(PropTypes.string),
  PropTypes.arrayOf(PropTypes.number),
  PropTypes.arrayOf(PropTypes.bool),
]);

function EvidenceBlock({ evidence }) {
  if (!evidence || typeof evidence !== 'object') {
    return null;
  }
  const entries = Object.entries(evidence);
  if (!entries.length) {
    return null;
  }
  return (
    <Box
      sx={{
        mt: 0.5,
        p: 1,
        borderRadius: 1,
        bgcolor: 'background.paper',
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      {entries.map(([key, value]) => (
        <Typography key={key} variant="caption" display="block" color="text.secondary">
          {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </Typography>
      ))}
    </Box>
  );
}

function TimelineEvent({ event, isLast }) {
  return (
    <Stack direction="row" spacing={2}>
      <Stack alignItems="center" sx={{ width: 24 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            mt: 0.5,
          }}
        />
        {!isLast && (
          <Box sx={{ flex: 1, width: 2, bgcolor: 'divider', minHeight: 32, my: 0.5 }} />
        )}
      </Stack>
      <Box sx={{ pb: isLast ? 0 : 2, flex: 1 }}>
        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
          {event.event_type?.replace(/_/g, ' ')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {fDateTime(event.created_at)}
          {event.actor_role ? ` · ${event.actor_role}` : ''}
          {event.actor_user_id ? ` · user #${event.actor_user_id}` : ''}
        </Typography>
        {event.notes && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {event.notes}
          </Typography>
        )}
        <EvidenceBlock evidence={event.evidence_data} />
      </Box>
    </Stack>
  );
}

TimelineEvent.propTypes = {
  event: PropTypes.shape({
    event_type: PropTypes.string,
    created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    actor_role: PropTypes.string,
    actor_user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    notes: PropTypes.string,
    evidence_data: PropTypes.objectOf(EVIDENCE_VALUE_PROP_TYPE),
  }).isRequired,
  isLast: PropTypes.bool,
};

export function TransferDetailDrawer({
  open,
  onClose,
  transfer,
  storeId,
  storeNameById,
  productNameById,
  userPermissions,
  currentUserId,
  submitting,
  onAction,
  assignedDriverId,
  onCreateDriver,
}) {
  if (!transfer) {
    return null;
  }

  const access = getTransferActionAccess({
    userPermissions,
    currentUserId,
    currentStoreId: storeId,
    transfer,
  });

  const events = [...(transfer.events || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const actionButtons = [
    { key: 'pack', show: access.canPack },
    { key: 'assign', show: access.canAssignDriver },
    { key: 'pickup', show: access.canPickup },
    { key: 'transit', show: access.canInTransit },
    { key: 'deliver', show: access.canDeliver },
    { key: 'receive', show: access.canReceive },
    { key: 'close', show: access.canClose, variant: 'contained' },
  ].filter((btn) => btn.show);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 480 } } }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5, pb: 2 }}>
        <Box>
          <Typography variant="h6">{transfer.transfer_number}</Typography>
          <Chip
            size="small"
            label={transfer.status}
            color={STATUS_COLORS[transfer.status] || 'default'}
            sx={{ mt: 0.5 }}
          />
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider />

      <Scrollbar sx={{ flex: 1 }}>
        <Stack spacing={3} sx={{ p: 2.5 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Route
            </Typography>
            <Typography variant="body2">
              {storeNameById?.(transfer.source_store_id) || `Store #${transfer.source_store_id}`}
              {' → '}
              {storeNameById?.(transfer.destination_store_id) ||
                `Store #${transfer.destination_store_id}`}
            </Typography>
            {transfer.assigned_driver_user_id && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                Driver: user #{transfer.assigned_driver_user_id}
              </Typography>
            )}
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">
              Items
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {(transfer.items || []).map((item) => (
                <Box
                  key={item.product_id}
                  sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}
                >
                  <Typography variant="subtitle2">
                    {productNameById?.(item.product_id) || `Product #${item.product_id}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Req {item.requested_qty} · Packed {item.packed_qty} · Received{' '}
                    {item.received_qty}
                    {item.damaged_qty > 0 ? ` · Damaged ${item.damaged_qty}` : ''}
                  </Typography>
                  <Chip size="small" label={item.status} sx={{ mt: 0.5 }} />
                </Box>
              ))}
            </Stack>
          </Box>

          {(transfer.packages || []).length > 0 && (
            <Box>
              <Typography variant="overline" color="text.secondary">
                Packages
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {transfer.packages.map((pkg) => (
                  <Box
                    key={pkg.package_code}
                    sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}
                  >
                    <Typography variant="subtitle2">{pkg.package_code}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pkg.seal_code ? `Seal: ${pkg.seal_code} · ` : ''}
                      Status: {pkg.status}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          <Box>
            <Typography variant="overline" color="text.secondary">
              Chain of custody
            </Typography>
            <Stack sx={{ mt: 1.5 }}>
              {events.length ? (
                events.map((event, index) => (
                  <TimelineEvent
                    key={`${event.event_type}-${event.created_at}-${index}`}
                    event={event}
                    isLast={index === events.length - 1}
                  />
                ))
              ) : (
                <Typography variant="body2" color="text.disabled">
                  No events recorded yet.
                </Typography>
              )}
            </Stack>
          </Box>
        </Stack>
      </Scrollbar>

      {actionButtons.length > 0 && (
        <>
          <Divider />
          <Stack spacing={1} sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Actions
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {actionButtons.map((btn) => (
                <Button
                  key={btn.key}
                  size="small"
                  variant={btn.variant || 'outlined'}
                  disabled={submitting || (btn.key === 'assign' && !assignedDriverId)}
                  onClick={() => onAction(transfer, btn.key)}
                >
                  {TRANSFER_ACTION_LABELS[btn.key]}
                </Button>
              ))}
            </Stack>
            {actionButtons.some((b) => b.key === 'assign') && !assignedDriverId && (
              <Stack spacing={1}>
                <Typography variant="caption" color="warning.main">
                  Select a driver in the list header before assigning.
                </Typography>
                <Button size="small" variant="text" onClick={onCreateDriver}>
                  + Create driver
                </Button>
              </Stack>
            )}
          </Stack>
        </>
      )}
    </Drawer>
  );
}

TransferDetailDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  transfer: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    transfer_number: PropTypes.string,
    status: PropTypes.string,
    source_store_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    destination_store_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    assigned_driver_user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    items: PropTypes.arrayOf(
      PropTypes.shape({
        product_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        requested_qty: PropTypes.number,
        packed_qty: PropTypes.number,
        received_qty: PropTypes.number,
        damaged_qty: PropTypes.number,
        status: PropTypes.string,
      })
    ),
    packages: PropTypes.arrayOf(
      PropTypes.shape({
        package_code: PropTypes.string,
        seal_code: PropTypes.string,
        status: PropTypes.string,
      })
    ),
    events: PropTypes.arrayOf(
      PropTypes.shape({
        event_type: PropTypes.string,
        created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        actor_role: PropTypes.string,
        actor_user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        notes: PropTypes.string,
        evidence_data: PropTypes.objectOf(EVIDENCE_VALUE_PROP_TYPE),
      })
    ),
  }),
  storeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  storeNameById: PropTypes.func,
  productNameById: PropTypes.func,
  userPermissions: PropTypes.arrayOf(PropTypes.string),
  currentUserId: PropTypes.number,
  submitting: PropTypes.bool,
  onAction: PropTypes.func,
  assignedDriverId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onCreateDriver: PropTypes.func,
};
