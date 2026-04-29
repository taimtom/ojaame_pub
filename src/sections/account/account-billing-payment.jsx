import { useState } from 'react';
import PaystackPop from '@paystack/inline-js';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import {
  removeCard,
  clearAllCards,
  setDefaultCard,
  verifyAndSaveCard,
  useGetBillingCards,
  useGetSubscriptionStatus,
  getSubscriptionManageLink,
} from 'src/actions/billing';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';
import { SIGNUP_PENDING_PAYMENT_METHOD_KEY } from 'src/auth/signup-constants';

// ----------------------------------------------------------------------

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

const CARD_BRAND_ICONS = {
  visa: 'logos:visa',
  mastercard: 'logos:mastercard',
  verve: 'twemoji:credit-card',
};

// ----------------------------------------------------------------------

export function AccountBillingPayment() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { cards, cardsLoading, mutateCards } = useGetBillingCards();
  const { hasPaystackSubscription, mutateStatus } = useGetSubscriptionStatus();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handleAddCard = () => {
    if (!PAYSTACK_PUBLIC_KEY) {
      toast.error('Payment gateway not configured.');
      return;
    }
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: user?.email,
      amount: 5000,         // ₦50 — refunded automatically by backend after verification
      currency: 'NGN',
      label: 'Save payment method',
      metadata: {
        purpose: 'card_verification',
        company_id: user?.company_id,
      },
      onSuccess: async (transaction) => {
        try {
          await verifyAndSaveCard(transaction.reference);
          await mutateCards();
          await mutateStatus?.();
          toast.success('Payment method saved successfully.');
          let pending = false;
          try {
            pending = localStorage.getItem(SIGNUP_PENDING_PAYMENT_METHOD_KEY) === '1';
          } catch {
            /* ignore */
          }
          if (pending) {
            try {
              localStorage.removeItem(SIGNUP_PENDING_PAYMENT_METHOD_KEY);
            } catch {
              /* ignore */
            }
            router.replace(paths.dashboard.root);
          }
        } catch (err) {
          toast.error(err?.detail || err?.message || 'Failed to save card.');
        }
      },
      onCancel: () => {},
    });
  };

  const handleRemove = async (cardId) => {
    setActionLoading(`remove-${cardId}`);
    try {
      await removeCard(cardId);
      await mutateCards();
      toast.success('Card removed.');
    } catch {
      toast.error('Failed to remove card.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDefault = async (cardId) => {
    setActionLoading(`default-${cardId}`);
    try {
      await setDefaultCard(cardId);
      await mutateCards();
      toast.success('Default payment method updated.');
    } catch {
      toast.error('Failed to update default card.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllCards();
      await mutateCards();
      setClearConfirmOpen(false);
      toast.success('All payment methods removed.');
    } catch {
      toast.error('Failed to clear cards.');
    }
  };

  const handleManageLink = async () => {
    try {
      const { manage_link } = await getSubscriptionManageLink();
      if (manage_link) {
        window.open(manage_link, '_blank');
      } else {
        toast.info('Subscription management link is not available yet. It will be available after your first billing cycle.');
      }
    } catch {
      toast.error('Could not get subscription management link.');
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          Payment method
        </Typography>
        <Button
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddCard}
        >
          New Card
        </Button>
      </Stack>

      <Stack spacing={2}>
        {cardsLoading && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading payment methods...
          </Typography>
        )}

        {!cardsLoading && cards.length === 0 && (
          <Box
            sx={{
              py: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              color: 'text.secondary',
            }}
          >
            <Iconify icon="solar:card-bold" width={40} sx={{ opacity: 0.4 }} />
            <Typography variant="body2">
              No payment methods saved.
            </Typography>
            <Typography variant="caption">
              Add a card to enable automatic monthly billing.
            </Typography>
          </Box>
        )}

        {cards.map((card) => (
          <Stack
            key={card.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 2,
              borderRadius: 1,
              border: (theme) =>
                `1px solid ${card.is_default ? theme.palette.primary.main : theme.palette.divider}`,
              bgcolor: card.is_default ? 'primary.lighter' : 'background.neutral',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Iconify
                icon={CARD_BRAND_ICONS[card.card_type?.toLowerCase()] || 'mdi:credit-card'}
                width={36}
              />
              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="subtitle2">
                    •••• •••• •••• {card.last4}
                  </Typography>
                  {card.is_default && (
                    <Chip label="Default" size="small" color="primary" variant="outlined" />
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {card.bank} · Expires {card.exp_month}/{card.exp_year}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5}>
              {!card.is_default && (
                <Tooltip title="Set as default">
                  <IconButton
                    size="small"
                    disabled={actionLoading === `default-${card.id}`}
                    onClick={() => handleSetDefault(card.id)}
                  >
                    <Iconify icon="eva:star-outline" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Remove card">
                <IconButton
                  size="small"
                  color="error"
                  disabled={actionLoading === `remove-${card.id}`}
                  onClick={() => handleRemove(card.id)}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        ))}
      </Stack>

      {cards.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Stack direction="row" justifyContent="space-between">
            <Tooltip
              title={
                !hasPaystackSubscription
                  ? 'Available after your first billing cycle is set up'
                  : ''
              }
            >
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleManageLink}
                  disabled={!hasPaystackSubscription}
                >
                  Manage via Paystack
                </Button>
              </span>
            </Tooltip>
            <Button size="small" color="error" onClick={() => setClearConfirmOpen(true)}>
              Clear all
            </Button>
          </Stack>
        </>
      )}

      <ConfirmDialog
        open={clearConfirmOpen}
        onClose={() => setClearConfirmOpen(false)}
        title="Clear all payment methods"
        content="This will remove all saved cards. Automatic billing will stop until a new card is added."
        action={
          <Button variant="contained" color="error" onClick={handleClearAll}>
            Clear all
          </Button>
        }
      />
    </Card>
  );
}
