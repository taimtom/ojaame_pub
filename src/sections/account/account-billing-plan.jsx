import { useState, useCallback } from 'react';
import { toast } from 'src/components/snackbar';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import { fDate } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { useGetSubscriptionStatus } from 'src/actions/billing';
import {
  useGetSubscriptionSummary,
  useGetSubscriptionPlans,
  adjustSeats,
  changePlan,
} from 'src/actions/subscription';

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

function tierLabel(tier) {
  if (!tier) return 'Basic';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

const PLAN_HIGHLIGHTS = {
  basic: [
    'Full POS, inventory & customers',
    'Essential reports',
    'Up to 3 team members per store',
    'Roles & per-user permissions',
  ],
  standard: [
    'Everything in Basic',
    '2 stores included',
    '3 seats included (owner + 2)',
    'Unlimited team size beyond included seats',
    'Custom roles',
    'Advanced & company reports',
    'Integrations, store website & more',
  ],
};

// ----------------------------------------------------------------------

export function AccountBillingPlan() {
  const { summary, summaryLoading, summaryError, mutate } = useGetSubscriptionSummary();
  const { plans, storePrice } = useGetSubscriptionPlans();
  const { nextBillingDate, inTrial, trialDaysRemaining, mutateStatus } = useGetSubscriptionStatus();
  const [adjusting, setAdjusting] = useState(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [pendingTier, setPendingTier] = useState(null);

  const billingDate = summary?.next_billing_date || nextBillingDate;
  const daysUntilBilling = billingDate
    ? Math.max(0, Math.ceil((new Date(billingDate) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  const seatPrice = summary?.seat_price ?? 1000;
  const currentTier = summary?.plan_tier ?? 'basic';
  const isEnterprise = currentTier === 'enterprise';
  const maxSeatsPerStore = summary?.max_seats_per_store ?? null;
  const freeStores = summary?.free_stores ?? (currentTier === 'standard' ? 2 : 1);
  const includedSeats = summary?.included_seats ?? (currentTier === 'standard' ? 3 : null);
  const isStandard = currentTier === 'standard';

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

  const estimateTotalForTier = useCallback(
    (planTier) => {
      const plan = plans.find((p) => p.plan_tier === planTier);
      if (!plan || !summary) return null;
      const tierFreeStores = plan.free_stores ?? (planTier === 'standard' ? 2 : 1);
      const estimatedStoreFees =
        Math.max(0, (summary.store_count ?? 0) - tierFreeStores) * (storePrice ?? 3000);

      let extraSeatFees = 0;
      if (planTier === 'standard') {
        const included = plan.included_seats ?? 3;
        extraSeatFees =
          Math.max(0, (summary.total_seats ?? 0) - included) * (plan.seat_price ?? 0);
      } else {
        extraSeatFees =
          summary.store_breakdown?.reduce(
            (sum, store) => sum + Math.max((store.paid_seats ?? 1) - 1, 0) * plan.seat_price,
            0
          ) ?? 0;
      }
      return (plan.base_fee ?? 0) + estimatedStoreFees + extraSeatFees;
    },
    [plans, summary, storePrice]
  );

  const handleConfirmPlanChange = useCallback(async () => {
    if (!pendingTier) return;
    setChangingPlan(true);
    try {
      await changePlan({ plan_tier: pendingTier });
      await Promise.all([mutate(), mutateStatus?.()]);
      toast.success(`Plan updated to ${tierLabel(pendingTier)}.`);
      setPendingTier(null);
    } catch (err) {
      toast.error(err?.data?.detail || err?.detail || err?.message || 'Failed to change plan.');
    } finally {
      setChangingPlan(false);
    }
  }, [pendingTier, mutate, mutateStatus]);

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

  const pendingTotal = pendingTier ? estimateTotalForTier(pendingTier) : null;

  return (
    <>
      <Card>
        <CardHeader
          title="Subscription & Billing"
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                label={tierLabel(currentTier)}
                color="primary"
                variant="soft"
              />
              <Chip
                size="small"
                label={summary.status}
                color={statusColor}
                variant="soft"
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>
          }
        />

        {inTrial && (
          <Alert severity="info" sx={{ mx: 2, mb: 0, borderRadius: 1 }}>
            <strong>Free trial.</strong> Your first billing date is{' '}
            {billingDate ? fDate(billingDate) : '—'} ({trialDaysRemaining} day
            {trialDaysRemaining !== 1 ? 's' : ''} left). You can use the app without paying
            until then.
          </Alert>
        )}

        {isAttention && (
          <Alert severity="warning" sx={{ mx: 2, mb: 0, borderRadius: 1 }}>
            Last payment failed. Paystack will automatically retry on your next billing date.
            You can also update your payment method below.
          </Alert>
        )}

        {isUnpaid && !isAttention && (
          <Alert severity="warning" sx={{ mx: 2, mb: 0, borderRadius: 1 }}>
            Your subscription payment is pending. Please ensure a valid payment method is saved.
          </Alert>
        )}

        <Stack sx={{ px: 3, pb: 1, pt: 1 }}>
          <Typography variant="overline" color="text.disabled" sx={{ mb: 1 }}>
            Plan
          </Typography>

          {isEnterprise ? (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
              Your <strong>Enterprise</strong> plan is managed by Ojaame (
              {fCurrency(summary.base_fee)}/mo base, {fCurrency(seatPrice)}/extra seat). Contact
              support to make changes.
            </Alert>
          ) : (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              {plans.map((plan) => {
                const selected = plan.plan_tier === currentTier;
                return (
                  <Card
                    key={plan.plan_tier}
                    variant="outlined"
                    sx={{
                      flex: 1,
                      p: 2,
                      borderWidth: selected ? 2 : 1,
                      borderColor: selected ? 'primary.main' : 'divider',
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2">{plan.label}</Typography>
                        {selected && (
                          <Chip label="Current" size="small" color="primary" variant="soft" />
                        )}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {fCurrency(plan.base_fee)}/mo + {fCurrency(plan.seat_price)}/seat
                      </Typography>
                      <Stack component="ul" sx={{ m: 0, pl: 2, mt: 1 }} spacing={0.25}>
                        {(PLAN_HIGHLIGHTS[plan.plan_tier] || []).map((item) => (
                          <Typography key={item} component="li" variant="caption" color="text.secondary">
                            {item}
                          </Typography>
                        ))}
                      </Stack>
                      {!selected && (
                        plan.plan_tier === 'basic' &&
                        (summary.store_count ?? 0) > 1 &&
                        currentTier !== 'basic' ? (
                          <Tooltip title="Basic supports one store only. Remove extra stores before switching.">
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                disabled
                                sx={{ mt: 1, alignSelf: 'flex-start' }}
                              >
                                Switch to {plan.label}
                              </Button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1, alignSelf: 'flex-start' }}
                            onClick={() => setPendingTier(plan.plan_tier)}
                          >
                            Switch to {plan.label}
                          </Button>
                        )
                      )}
                    </Stack>
                  </Card>
                );
              })}
            </Stack>
          )}

          <Divider sx={{ mb: 1.5 }} />

          <BillingRow
            label={`Base subscription (${tierLabel(currentTier)})`}
            secondary={
              isStandard
                ? 'includes 3 seats (owner + 2)'
                : 'includes 1 owner seat'
            }
            value={`${fCurrency(summary.base_fee)}/mo`}
          />

          <BillingRow
            label="Extra seat rate"
            secondary={
              isStandard
                ? `per seat beyond ${includedSeats ?? 3} included`
                : 'per seat beyond first per store'
            }
            value={`${fCurrency(seatPrice)}/mo`}
          />

          <BillingRow
            label="Total seats"
            secondary={
              maxSeatsPerStore
                ? `sum across all stores (max ${maxSeatsPerStore} per store on Basic)`
                : 'sum across all stores'
            }
            value={summary.total_seats ?? '—'}
          />

          {maxSeatsPerStore && (
            <Alert severity="info" sx={{ mt: 1, borderRadius: 1 }}>
              Basic includes up to {maxSeatsPerStore} seats per store (owner +{' '}
              {maxSeatsPerStore - 1} staff). Upgrade to Standard for unlimited team size.
            </Alert>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography variant="overline" color="text.disabled" sx={{ mb: 0.5 }}>
            Stores ({summary.store_count} total — {freeStores} free)
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
                <Tooltip
                  title={
                    isStandard
                      ? store.paid_seats <= 1 && includedSeats > 0
                        ? 'Included in your 3-seat allowance'
                        : 'Remove seat'
                      : store.paid_seats <= 1
                        ? 'Owner seat — cannot be removed'
                        : 'Remove seat'
                  }
                >
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

                <Tooltip
                  title={
                    maxSeatsPerStore && store.paid_seats >= maxSeatsPerStore
                      ? `Basic plan limit: ${maxSeatsPerStore} seats per store`
                      : `Add seat (+${fCurrency(seatPrice)}/mo)`
                  }
                >
                  <span>
                    <Button
                      size="small"
                      variant="soft"
                      color="primary"
                      disabled={
                        adjusting !== null
                        || (maxSeatsPerStore != null && store.paid_seats >= maxSeatsPerStore)
                      }
                      onClick={() => handleSeatChange(1, 'store', store.store_id)}
                      sx={{ minWidth: 24, px: 0.5 }}
                    >
                    {adjusting === `store-${store.store_id}-1` ? (
                      <CircularProgress size={12} />
                    ) : (
                      <Iconify icon="mingcute:add-line" width={12} />
                    )}
                  </Button>
                  </span>
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

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle1">Total</Typography>
            <Typography variant="h5" color="primary.main">
              {fCurrency(summary.total)}
              <Box component="span" sx={{ typography: 'body2', color: 'text.disabled', ml: 0.5 }}>
                /mo
              </Box>
            </Typography>
          </Stack>

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

      <Dialog open={Boolean(pendingTier)} onClose={() => !changingPlan && setPendingTier(null)}>
        <DialogTitle>Change subscription plan?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Switch from <strong>{tierLabel(currentTier)}</strong> to{' '}
            <strong>{tierLabel(pendingTier)}</strong>.
          </Typography>
          {pendingTotal !== null && (
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              Your estimated monthly total will change from{' '}
              <strong>{fCurrency(summary.total)}</strong> to{' '}
              <strong>{fCurrency(pendingTotal)}</strong>.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingTier(null)} disabled={changingPlan}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmPlanChange}
            disabled={changingPlan}
          >
            {changingPlan ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
