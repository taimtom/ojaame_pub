import { useState, useCallback } from 'react';
import { toast } from 'src/components/snackbar';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { useGetSubscriptionStatus } from 'src/actions/billing';
import { useGetSubscriptionSummary, adjustSeats } from 'src/actions/subscription';

// ----------------------------------------------------------------------

function BillingRow({ label, value, secondary }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        {secondary && (
          <Typography variant="caption" color="text.disabled">
            {secondary}
          </Typography>
        )}
        <Typography variant="subtitle2">{value}</Typography>
      </Stack>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function AccountBillingPlan() {
  const { summary, summaryLoading, summaryError, mutate } = useGetSubscriptionSummary();
  const { nextBillingDate } = useGetSubscriptionStatus();
  const [adjusting, setAdjusting] = useState(null);

  // Prefer summary date (most up-to-date), fall back to status endpoint date
  const billingDate = summary?.next_billing_date || nextBillingDate;
  const daysUntilBilling = billingDate
    ? Math.max(0, Math.ceil((new Date(billingDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleSeatChange = useCallback(
    async (delta, scope, storeId) => {
      const key = `${scope}-${storeId ?? 'biz'}-${delta}`;
      setAdjusting(key);
      try {
        await adjustSeats({ delta, scope, store_id: storeId });
        await mutate();
        toast.success(delta > 0 ? 'Seat added.' : 'Seat removed.');
      } catch (err) {
        toast.error(err?.data?.detail || err?.detail || err?.message || 'Failed to adjust seat.');
      } finally {
        setAdjusting(null);
      }
    },
    [mutate]
  );

  const isUnpaid = summary?.status === 'unpaid';
  const isAttention = summary?.paystack_status === 'attention';

  if (summaryLoading) {
    return (
      <Card>
        <CardHeader title="Subscription & Billing" />
        <Stack spacing={1.5} sx={{ p: 3 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={28} />
          ))}
        </Stack>
      </Card>
    );
  }

  if (summaryError || !summary) {
    return (
      <Card>
        <CardHeader title="Subscription & Billing" />
        <Stack alignItems="center" spacing={1.5} sx={{ p: 4 }}>
          <Iconify icon="solar:bill-list-bold" width={48} sx={{ color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            Could not load billing information.
          </Typography>
        </Stack>
      </Card>
    );
  }

  const statusColor =
    summary.status === 'active'
      ? 'success'
      : summary.status === 'unpaid'
        ? 'warning'
        : 'error';

  return (
    <Card>
      <CardHeader
        title="Subscription & Billing"
        action={
          <Chip
            size="small"
            label={summary.status}
            color={statusColor}
            variant="soft"
            sx={{ textTransform: 'capitalize' }}
          />
        }
      />

      {/* Payment failed / attention banner */}
      {isAttention && (
        <Alert severity="warning" sx={{ mx: 2, mb: 0, borderRadius: 1 }}>
          Last payment failed. Paystack will automatically retry on your next billing date.
          You can also update your payment method below.
        </Alert>
      )}

      {/* Unpaid (but not yet deactivated) banner */}
      {isUnpaid && !isAttention && (
        <Alert severity="warning" sx={{ mx: 2, mb: 0, borderRadius: 1 }}>
          Your subscription payment is pending. Please ensure a valid payment method is saved.
        </Alert>
      )}

      <Stack sx={{ px: 3, pb: 1, pt: 1 }}>
        <Divider sx={{ mb: 1.5 }} />

        {/* Base fee */}
        <BillingRow
          label="Base subscription"
          secondary="includes 1 owner seat"
          value={`${fCurrency(summary.base_fee)}/mo`}
        />

        {/* Total seats — read-only summary across all stores */}
        <BillingRow
          label="Total seats"
          secondary="sum across all stores"
          value={summary.total_seats ?? '—'}
        />

        <Divider sx={{ my: 1 }} />

        {/* Store breakdown */}
        <Typography variant="overline" color="text.disabled" sx={{ mb: 0.5 }}>
          Stores ({summary.store_count} total — 1 free)
        </Typography>

        {summary.store_breakdown?.map((store) => (
          <Stack
            key={store.store_id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 0.5, pl: 1 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon={store.is_free ? 'solar:shop-bold' : 'solar:shop-2-bold'}
                width={16}
                sx={{ color: store.is_free ? 'success.main' : 'primary.main' }}
              />
              <Typography variant="body2">{store.store_name}</Typography>
              {store.is_free && (
                <Chip label="Free" size="small" color="success" variant="soft" />
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              {/* Seat controls for ALL stores — free store owner seat (index 0) is locked */}
              <Tooltip title={store.paid_seats <= 1 ? 'Owner seat — cannot be removed' : 'Remove seat'}>
                <span>
                  <Button
                    size="small"
                    variant="soft"
                    color="inherit"
                    disabled={store.paid_seats <= 1 || adjusting !== null}
                    onClick={() => handleSeatChange(-1, 'store', store.store_id)}
                    sx={{ minWidth: 24, px: 0.5 }}
                  >
                    {adjusting === `store-${store.store_id}--1` ? (
                      <CircularProgress size={12} />
                    ) : (
                      <Iconify icon="mingcute:minus-line" width={12} />
                    )}
                  </Button>
                </span>
              </Tooltip>

              <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'center' }}>
                {store.paid_seats} seat{store.paid_seats !== 1 ? 's' : ''}
              </Typography>

              <Tooltip title="Add seat (+₦1,000/mo)">
                <Button
                  size="small"
                  variant="soft"
                  color="primary"
                  disabled={adjusting !== null}
                  onClick={() => handleSeatChange(1, 'store', store.store_id)}
                  sx={{ minWidth: 24, px: 0.5 }}
                >
                  {adjusting === `store-${store.store_id}-1` ? (
                    <CircularProgress size={12} />
                  ) : (
                    <Iconify icon="mingcute:add-line" width={12} />
                  )}
                </Button>
              </Tooltip>

              <Typography variant="body2" sx={{ ml: 1, minWidth: 80, textAlign: 'right' }}>
                {store.is_free && store.seat_fees === 0
                  ? 'Free'
                  : `${fCurrency((store.store_fee ?? 0) + (store.seat_fees ?? 0))}/mo`}
              </Typography>
            </Stack>
          </Stack>
        ))}

        <Divider sx={{ my: 1.5 }} />

        {/* Total */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Total</Typography>
          <Typography variant="h5" color="primary.main">
            {fCurrency(summary.total)}
            <Box component="span" sx={{ typography: 'body2', color: 'text.disabled', ml: 0.5 }}>
              /mo
            </Box>
          </Typography>
        </Stack>

        {/* Next billing date */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mt: 1.5,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            bgcolor: 'background.neutral',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:calendar-bold" width={18} sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                Next charge date
              </Typography>
              <Typography variant="subtitle2">
                {billingDate ? fDate(billingDate) : '—'}
              </Typography>
            </Box>
          </Stack>

          {daysUntilBilling !== null && (
            <Chip
              size="small"
              label={daysUntilBilling === 0 ? 'Today' : `${daysUntilBilling}d away`}
              color={daysUntilBilling <= 3 ? 'warning' : 'default'}
              variant="soft"
            />
          )}
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 1, display: 'block' }}>
          Seat changes are pro-rated. Invoices are auto-generated 3 days before your billing date.
        </Typography>
      </Stack>
    </Card>
  );
}
