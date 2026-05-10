import { useState } from 'react';
import PaystackPop from '@paystack/inline-js';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';

import { useAuthContext } from 'src/auth/hooks';
import { createWallet, verifyWalletTopup, useGetWallet, useGetWalletTransactions } from 'src/actions/wallet';
import { useGetSubscriptionStatus } from 'src/actions/billing';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

function fCurrency(amount) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount ?? 0);
}

// ----------------------------------------------------------------------

export function AccountBillingWallet() {
  const { user } = useAuthContext();
  const {
    walletExists, walletBalance, hasDva,
    dvaBankName, dvaAccountNumber, dvaAccountName,
    walletLoading, mutateWallet,
  } = useGetWallet();
  const { transactions, txLoading } = useGetWalletTransactions(1, 5);
  const { walletBalance: statusBalance } = useGetSubscriptionStatus();

  const [creating, setCreating] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  const handleCreateWallet = async () => {
    setCreating(true);
    try {
      await createWallet();
      await mutateWallet();
      toast.success('Wallet created and bank account provisioned.');
    } catch (err) {
      toast.error(err?.message || 'Failed to create wallet.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyAccount = (text) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied to clipboard.'),
      () => toast.error('Failed to copy.')
    );
  };

  const handleFundViaCard = () => {
    const amount = parseFloat(fundAmount);
    if (!amount || amount < 100) {
      toast.error('Minimum top-up is ₦100.');
      return;
    }
    if (!PAYSTACK_PUBLIC_KEY) {
      toast.error('Payment gateway not configured.');
      return;
    }
    setFundLoading(true);
    const paystack = new PaystackPop();
    paystack.newTransaction({
      key: PAYSTACK_PUBLIC_KEY,
      email: user?.email,
      amount: Math.round(amount * 100),  // kobo
      currency: 'NGN',
      label: 'Fund wallet',
      metadata: {
        purpose: 'wallet_topup',
        company_id: user?.company_id,
      },
      onSuccess: async (transaction) => {
        try {
          await verifyWalletTopup(transaction.reference, user?.company_id);
          await mutateWallet();
          setFundAmount('');
          toast.success(`₦${amount.toLocaleString()} credited to your wallet.`);
        } catch (err) {
          toast.error(err?.message || 'Failed to credit wallet.');
        } finally {
          setFundLoading(false);
        }
      },
      onCancel: () => {
        setFundLoading(false);
      },
    });
  };

  if (walletLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!walletExists) {
    return (
      <Box
        sx={{
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          color: 'text.secondary',
        }}
      >
        <Iconify icon="solar:wallet-bold" width={48} sx={{ opacity: 0.4 }} />
        <Typography variant="body2" align="center">
          Create a wallet to fund your subscription via bank transfer. A unique account
          number will be assigned to your business.
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={handleCreateWallet}
          disabled={creating}
          startIcon={creating ? <CircularProgress size={16} /> : <Iconify icon="mingcute:add-line" />}
        >
          {creating ? 'Creating…' : 'Create Wallet'}
        </Button>
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      {/* Balance */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          bgcolor: 'primary.lighter',
          border: (theme) => `1px solid ${theme.palette.primary.light}`,
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Wallet Balance
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
          {fCurrency(walletBalance)}
        </Typography>
        {walletBalance < (statusBalance ?? 3000) && walletBalance >= 0 && (
          <Chip
            label="Low balance — top up before next billing"
            size="small"
            color="warning"
            icon={<Iconify icon="solar:danger-bold" width={14} />}
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      {/* DVA bank details */}
      {hasDva ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.neutral',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Iconify icon="solar:bank-bold" width={20} sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2">Your Dedicated Bank Account</Typography>
          </Stack>

          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Bank</Typography>
              <Typography variant="caption" fontWeight={600}>{dvaBankName}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Account Number</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" fontWeight={700} letterSpacing={1.5}>
                  {dvaAccountNumber}
                </Typography>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => handleCopyAccount(dvaAccountNumber)}>
                    <Iconify icon="eva:copy-outline" width={14} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Account Name</Typography>
              <Typography variant="caption" fontWeight={600}>{dvaAccountName}</Typography>
            </Stack>
          </Stack>

          <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
            Transfer any amount to this account number to fund your wallet. Credits are reflected
            instantly after bank confirmation.
          </Alert>
        </Box>
      ) : (
        <Alert severity="warning">
          Bank account provisioning is pending. Refresh or contact support if this persists.
        </Alert>
      )}

      {/* Fund via card */}
      <Accordion disableGutters elevation={0} sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:card-bold" width={20} sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2">Fund via Card</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <TextField
              size="small"
              label="Amount (₦)"
              type="number"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              inputProps={{ min: 100, step: 100 }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleFundViaCard}
              disabled={fundLoading || !fundAmount}
              sx={{ mt: 0.25 }}
            >
              {fundLoading ? <CircularProgress size={18} /> : 'Pay'}
            </Button>
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            Powered by Paystack. The amount will be added to your wallet immediately.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Recent transactions */}
      <Box>
        <Typography variant="overline" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          Recent Transactions
        </Typography>

        {txLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        )}

        {!txLoading && transactions.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled', py: 1 }}>
            No transactions yet.
          </Typography>
        )}

        <Stack spacing={1}>
          {transactions.map((txn) => (
            <Stack
              key={txn.id}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: 'background.neutral',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Iconify
                  icon={txn.type === 'credit' ? 'solar:arrow-down-bold' : 'solar:arrow-up-bold'}
                  width={18}
                  sx={{ color: txn.type === 'credit' ? 'success.main' : 'error.main' }}
                />
                <Box>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    {txn.description}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {new Date(txn.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Typography>
                </Box>
              </Stack>
              <Typography
                variant="subtitle2"
                sx={{ color: txn.type === 'credit' ? 'success.main' : 'error.main' }}
              >
                {txn.type === 'credit' ? '+' : '-'}{fCurrency(txn.amount)}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {transactions.length > 0 && (
          <Divider sx={{ mt: 1 }} />
        )}
      </Box>
    </Stack>
  );
}
