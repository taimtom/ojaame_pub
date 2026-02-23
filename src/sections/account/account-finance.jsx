import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';

import axiosInstance from 'src/utils/axios';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';
import { useCurrency } from 'src/contexts/CurrencyContext';

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const fBalance = (amount, symbol = '') =>
  amount != null ? `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';

const connectionStatusColor = (status) => {
  if (status === 'active') return 'success';
  if (status === 'error') return 'error';
  return 'warning';
};

// ----------------------------------------------------------------------
// Currency Section
// ----------------------------------------------------------------------

function CurrencySection() {
  const { user } = useAuthContext();
  const { switchCurrency, refreshCurrencies } = useCurrency();
  const [allCurrencies, setAllCurrencies] = useState([]);
  const [enabledCurrencies, setEnabledCurrencies] = useState([]);
  const [baseCurrency, setBaseCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [settingBase, setSettingBase] = useState(false);

  const companyId = user?.company_id;

  const fetchData = useCallback(async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [allRes, enabledRes] = await Promise.allSettled([
        axiosInstance.get('/api/currency/all'),
        axiosInstance.get(`/api/currency/company/${companyId}/enabled`),
      ]);
      if (allRes.status === 'fulfilled') setAllCurrencies(allRes.value.data || []);
      if (enabledRes.status === 'fulfilled') {
        setBaseCurrency(enabledRes.value.data?.base_currency || null);
        setEnabledCurrencies(enabledRes.value.data?.enabled_currencies || []);
      } else {
        toast.error('Failed to load enabled currencies.');
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnableCurrency = async () => {
    if (!selectedToAdd) return;
    try {
      setSaving(true);
      await axiosInstance.post('/api/currency/enable', {
        company_id: companyId,
        currency_code: selectedToAdd,
      });
      toast.success(`${selectedToAdd} enabled successfully.`);
      setAddDialogOpen(false);
      setSelectedToAdd('');
      await fetchData();
      // Refresh global context so the new currency is available app-wide
      await refreshCurrencies();
    } catch {
      toast.error('Failed to enable currency.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetBase = async (code) => {
    try {
      setSettingBase(true);
      await axiosInstance.post('/api/currency/set-base', {
        company_id: companyId,
        currency_code: code,
      });
      toast.success(`Base currency set to ${code}.`);
      // Refresh local Finance tab data
      await fetchData();
      // Clear stored currency so the context defaults to the new base on reload
      localStorage.removeItem('current_currency');
      localStorage.removeItem('current_currency_symbol');
      // Refresh the global CurrencyContext so fCurrency and all hooks update
      await refreshCurrencies();
      // Switch the active display currency to the new base
      switchCurrency(code);
    } catch {
      toast.error('Failed to set base currency.');
    } finally {
      setSettingBase(false);
    }
  };

  // Currencies not yet enabled
  const availableToAdd = allCurrencies.filter(
    (c) => !enabledCurrencies.some((e) => e.code === c.code)
  );

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:dollar-minimalistic-bold-duotone" width={24} />
          <Typography variant="h6">Currency</Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setAddDialogOpen(true)}
          disabled={loading || availableToAdd.length === 0}
        >
          Add Currency
        </Button>
      </Stack>

      {loading ? (
        <LinearProgress />
      ) : !companyId ? (
        <Alert severity="info">No company found. Please create a company first.</Alert>
      ) : enabledCurrencies.length === 0 ? (
        <Alert severity="warning">
          No currencies enabled yet. Add one to start using multi-currency features.
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {enabledCurrencies.map((currency) => {
            const isBase = currency.code === baseCurrency;
            return (
              <Box
                key={currency.code}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: isBase ? 'primary.main' : 'divider',
                  bgcolor: isBase ? 'primary.lighter' : 'background.neutral',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h6" sx={{ width: 40, textAlign: 'center', color: 'text.secondary' }}>
                    {currency.symbol}
                  </Typography>
                  <Box>
                    <Typography variant="subtitle2">{currency.code}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {currency.name}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  {isBase && (
                    <Chip label="Base" size="small" color="primary" variant="filled" />
                  )}
                  {!isBase && (
                    <Button
                      size="small"
                      variant="text"
                      disabled={settingBase}
                      onClick={() => handleSetBase(currency.code)}
                    >
                      Set as base
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {/* Add Currency Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Currency</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Select currency"
            value={selectedToAdd}
            onChange={(e) => setSelectedToAdd(e.target.value)}
            sx={{ mt: 1 }}
          >
            {availableToAdd.map((c) => (
              <MenuItem key={c.code} value={c.code}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2" fontWeight="bold" sx={{ width: 30 }}>
                    {c.symbol}
                  </Typography>
                  <Typography variant="body2">{c.code}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    — {c.name}
                  </Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleEnableCurrency}
            disabled={!selectedToAdd || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            Enable
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Bank Accounts Section
// ----------------------------------------------------------------------

function BankAccountsSection() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [syncing, setSyncing] = useState(null); // account id being synced
  const [deleting, setDeleting] = useState(null); // account id being deleted
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/banking/accounts');
      setAccounts(res.data || []);
    } catch {
      toast.error('Failed to load bank accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSync = async (accountId) => {
    try {
      setSyncing(accountId);
      await axiosInstance.post('/api/banking/sync', { account_id: accountId });
      toast.success('Transactions synced successfully.');
      await fetchAccounts();
    } catch {
      toast.error('Failed to sync transactions.');
    } finally {
      setSyncing(null);
    }
  };

  const handleUpdateBalance = async (accountId) => {
    try {
      setSyncing(accountId);
      await axiosInstance.post(`/api/banking/accounts/${accountId}/update-balance`);
      toast.success('Balance updated.');
      await fetchAccounts();
    } catch {
      toast.error('Failed to update balance.');
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (accountId) => {
    try {
      setDeleting(accountId);
      await axiosInstance.delete(`/api/banking/accounts/${accountId}`);
      toast.success('Bank account disconnected.');
      setConfirmDeleteId(null);
      await fetchAccounts();
    } catch {
      toast.error('Failed to disconnect bank account.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:buildings-3-bold-duotone" width={24} />
          <Typography variant="h6">Bank Accounts</Typography>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setConnectOpen(true)}
        >
          Connect Bank
        </Button>
      </Stack>

      {loading ? (
        <LinearProgress />
      ) : accounts.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          No bank accounts connected yet. Click <strong>Connect Bank</strong> to get started.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {accounts.map((account) => (
            <Box
              key={account.id}
              sx={{
                p: 2,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.neutral',
              }}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1}>
                {/* Left: Account info */}
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Iconify icon="solar:card-bold-duotone" width={24} />
                  </Box>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="subtitle2">{account.account_name}</Typography>
                      {account.mask && (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          •••• {account.mask}
                        </Typography>
                      )}
                      <Chip
                        label={account.connection_status || 'active'}
                        size="small"
                        color={connectionStatusColor(account.connection_status)}
                        variant="soft"
                      />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {account.institution_name}
                      {account.account_type && ` · ${account.account_type}`}
                      {account.account_subtype && ` (${account.account_subtype})`}
                    </Typography>
                  </Box>
                </Stack>

                {/* Right: Balance + Actions */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ textAlign: 'right', mr: 1 }}>
                    <Typography variant="subtitle2">
                      {fBalance(account.current_balance, account.currency_code ? `${account.currency_code} ` : '')}
                    </Typography>
                    {account.available_balance != null && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Available: {fBalance(account.available_balance)}
                      </Typography>
                    )}
                  </Box>

                  {/* Sync */}
                  <IconButton
                    size="small"
                    title="Sync transactions"
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                  >
                    {syncing === account.id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Iconify icon="solar:refresh-bold" width={18} />
                    )}
                  </IconButton>

                  {/* Update Balance */}
                  <IconButton
                    size="small"
                    title="Update balance"
                    onClick={() => handleUpdateBalance(account.id)}
                    disabled={syncing === account.id}
                  >
                    <Iconify icon="solar:wallet-money-bold-duotone" width={18} />
                  </IconButton>

                  {/* Disconnect */}
                  <IconButton
                    size="small"
                    color="error"
                    title="Disconnect account"
                    onClick={() => setConfirmDeleteId(account.id)}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Sync error if any */}
              {account.sync_error && (
                <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
                  {account.sync_error}
                </Alert>
              )}

              {account.last_synced_at && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.disabled' }}>
                  Last synced: {new Date(account.last_synced_at).toLocaleString()}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {/* Connect Bank Dialog */}
      <ConnectBankDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        onSuccess={() => {
          setConnectOpen(false);
          fetchAccounts();
        }}
      />

      {/* Confirm Disconnect Dialog */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Disconnect Bank Account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will remove the bank connection and all associated transaction data. This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleDisconnect(confirmDeleteId)}
            disabled={deleting === confirmDeleteId}
            startIcon={deleting === confirmDeleteId ? <CircularProgress size={16} /> : null}
          >
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Connect Bank Dialog (lightweight wrapper around the banking API)
// ----------------------------------------------------------------------

function ConnectBankDialog({ open, onClose, onSuccess }) {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState(0); // 0: International (Plaid), 1: African (Mono)
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && activeTab === 0) fetchPlaidToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab]);

  const fetchPlaidToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.post('/api/banking/link-token', {
        provider: 'plaid',
        company_id: user?.company_id,
      });
      setLinkToken(res.data?.link_token || null);
    } catch {
      setError('Failed to initialize bank connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PROVIDER_TABS = [
    {
      label: 'International Banks',
      icon: 'solar:earth-bold-duotone',
      description: 'Connect banks from the US, Canada, UK, Europe, and more. Powered by Plaid.',
      regions: ['US', 'CA', 'GB', 'FR', 'ES', 'IE', 'NL'],
      features: ['Real-time balance updates', 'Transaction history', 'Bank-level encryption'],
    },
    {
      label: 'African Banks',
      icon: 'solar:map-point-bold-duotone',
      description: 'Connect banks from Nigeria, Ghana, Kenya, South Africa, and more. Powered by Mono.',
      regions: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
      features: ['Account statements', 'Balance monitoring', 'Transaction sync'],
    },
  ];

  const tab = PROVIDER_TABS[activeTab];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:buildings-3-bold-duotone" />
          <Typography variant="h6">Connect Bank Account</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {/* Provider tabs */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {PROVIDER_TABS.map((t, i) => (
            <Button
              key={t.label}
              variant={activeTab === i ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Iconify icon={t.icon} />}
              onClick={() => { setActiveTab(i); setError(null); }}
              sx={{ flexGrow: 1 }}
            >
              {t.label}
            </Button>
          ))}
        </Stack>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {tab.description}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Supported Regions</Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {tab.regions.map((r) => (
                <Chip key={r} label={r} size="small" />
              ))}
            </Box>
          </Card>
          <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Features</Typography>
            {tab.features.map((f) => (
              <Typography key={f} variant="body2" sx={{ color: 'text.secondary' }}>
                • {f}
              </Typography>
            ))}
          </Card>
        </Stack>

        <Alert severity="info">
          Your bank credentials are never stored. We use bank-level security.
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={loading || (activeTab === 0 && !linkToken)}
          startIcon={loading ? <CircularProgress size={16} /> : <Iconify icon="solar:link-bold" />}
          onClick={() => {
            // Plaid: link token is ready, Plaid SDK should be invoked by caller
            // Mono: open Mono widget
            toast.info('Bank connection flow would launch here with the respective provider SDK.');
          }}
        >
          Connect
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// Main Export
// ----------------------------------------------------------------------

export function AccountFinance() {
  return (
    <Stack spacing={4}>
      <CurrencySection />
      <Divider />
      <BankAccountsSection />
    </Stack>
  );
}
