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
  const { user } = useAuthContext();
  const companyId = user?.company_id;

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectOpen, setConnectOpen] = useState(false);
  const [syncing, setSyncing] = useState(null); // account id being synced
  const [deleting, setDeleting] = useState(null); // account id being deleted
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchAccounts = useCallback(async () => {
    if (!companyId) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/banking/accounts', {
        params: { company_id: companyId },
      });
      setAccounts(res.data || []);
    } catch {
      toast.error('Failed to load bank accounts.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const handleSync = async (accountId) => {
    const acc = accounts.find((a) => a.id === accountId);
    if (acc?.provider === 'manual') {
      toast.error('Manual accounts do not sync with the bank. Add or edit rows in Finance.');
      return;
    }
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
    const acc = accounts.find((a) => a.id === accountId);
    if (acc?.provider === 'manual') {
      toast.error('Manual accounts: update the balance when adding the account or contact support to edit.');
      return;
    }
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
                        label={
                          account.provider === 'manual'
                            ? 'Manual'
                            : account.connection_status || 'active'
                        }
                        size="small"
                        color={
                          account.provider === 'manual'
                            ? 'default'
                            : connectionStatusColor(account.connection_status)
                        }
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
                    title={
                      account.provider === 'manual'
                        ? 'Not available for manual accounts'
                        : 'Sync transactions'
                    }
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id || account.provider === 'manual'}
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
                    title={
                      account.provider === 'manual'
                        ? 'Not available for manual accounts'
                        : 'Update balance'
                    }
                    onClick={() => handleUpdateBalance(account.id)}
                    disabled={syncing === account.id || account.provider === 'manual'}
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
// Connect Bank Dialog (Plaid / Mono / Manual)
// ----------------------------------------------------------------------

const emptyManualTx = () => ({
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  direction: 'debit',
});

function ConnectBankDialog({ open, onClose, onSuccess }) {
  const { user } = useAuthContext();
  // 0: Plaid, 1: Mono, 2: Manual (no live API)
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);

  const [manualInstitution, setManualInstitution] = useState('');
  const [manualAccountName, setManualAccountName] = useState('');
  const [manualAccountType, setManualAccountType] = useState('checking');
  const [manualMask, setManualMask] = useState('');
  const [manualCurrency, setManualCurrency] = useState('NGN');
  const [manualBalance, setManualBalance] = useState('');
  const [manualAvailable, setManualAvailable] = useState('');
  const [manualStatementUrl, setManualStatementUrl] = useState('');
  const [manualTxRows, setManualTxRows] = useState([emptyManualTx()]);

  const resetManual = () => {
    setManualInstitution('');
    setManualAccountName('');
    setManualAccountType('checking');
    setManualMask('');
    setManualCurrency('NGN');
    setManualBalance('');
    setManualAvailable('');
    setManualStatementUrl('');
    setManualTxRows([emptyManualTx()]);
  };

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (activeTab === 0) fetchPlaidToken();
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
      label: 'International',
      icon: 'solar:earth-bold-duotone',
      description: 'Connect banks from the US, Canada, UK, Europe, and more. Powered by Plaid.',
      regions: ['US', 'CA', 'GB', 'FR', 'ES', 'IE', 'NL'],
      features: ['Real-time balance updates', 'Transaction history', 'Bank-level encryption'],
    },
    {
      label: 'African',
      icon: 'solar:map-point-bold-duotone',
      description: 'Connect banks from Nigeria, Ghana, Kenya, South Africa, and more. Powered by Mono.',
      regions: ['Nigeria', 'Ghana', 'Kenya', 'South Africa'],
      features: ['Account statements', 'Balance monitoring', 'Transaction sync'],
    },
    {
      label: 'Manual',
      icon: 'solar:pen-new-square-bold-duotone',
      description:
        'Add an account without linking Plaid or Mono. Enter balances yourself, attach a statement of account, and optionally type transaction lines. This account will not sync with any bank API.',
      regions: ['Any bank'],
      features: ['Statement upload', 'Balances you enter', 'Optional transaction lines', 'No API sync'],
    },
  ];

  const tab = PROVIDER_TABS[activeTab];

  const handleManualStatementUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', `bank-statement-${Date.now()}`);
    try {
      setLoading(true);
      const res = await axiosInstance.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.fileUrl;
      if (url) {
        setManualStatementUrl(url);
        toast.success('Statement uploaded.');
      }
    } catch {
      toast.error('Upload failed.');
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  };

  const submitManual = async () => {
    if (!user?.company_id) {
      toast.error('No company on your account.');
      return;
    }
    const bal = parseFloat(manualBalance, 10);
    if (!manualInstitution.trim() || !manualAccountName.trim() || Number.isNaN(bal)) {
      toast.error('Institution, account name, and current balance are required.');
      return;
    }
    const describedRows = manualTxRows.filter((row) => row.description?.trim());
    const invalidAmount = describedRows.find((row) =>
      Number.isNaN(parseFloat(row.amount, 10))
    );
    if (invalidAmount) {
      toast.error('Enter a valid amount for each transaction row.');
      return;
    }
    const transactions = describedRows.map((row) => {
      const amt = parseFloat(row.amount, 10);
      return {
        date: row.date,
        description: row.description.trim(),
        amount: Math.abs(amt),
        direction: row.direction === 'credit' ? 'credit' : 'debit',
      };
    });
    try {
      setLoading(true);
      setError(null);
      await axiosInstance.post('/api/banking/manual-accounts', {
        company_id: user.company_id,
        institution_name: manualInstitution.trim(),
        account_name: manualAccountName.trim(),
        account_type: manualAccountType,
        mask: manualMask.trim() || null,
        currency_code: manualCurrency.trim().toUpperCase() || 'NGN',
        current_balance: bal,
        available_balance:
          manualAvailable === '' ? null : parseFloat(manualAvailable, 10),
        statement_file_url: manualStatementUrl || null,
        transactions: transactions.length ? transactions : null,
      });
      toast.success('Manual bank account added.');
      resetManual();
      onSuccess?.();
      onClose();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === 'string' ? d : 'Could not save manual account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:buildings-3-bold-duotone" />
          <Typography variant="h6">Connect Bank Account</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
          {PROVIDER_TABS.map((t, i) => (
            <Button
              key={t.label}
              variant={activeTab === i ? 'contained' : 'outlined'}
              size="small"
              startIcon={<Iconify icon={t.icon} />}
              onClick={() => {
                setActiveTab(i);
                setError(null);
              }}
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

        {activeTab === 2 ? (
          <Stack spacing={2}>
            <Alert severity="warning" sx={{ py: 0.5 }}>
              Manual accounts are stored only in Ojaa Me. Balances and transactions are not fetched from
              your bank (no Plaid or Mono).
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Bank / institution name"
                value={manualInstitution}
                onChange={(e) => setManualInstitution(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Account name"
                value={manualAccountName}
                onChange={(e) => setManualAccountName(e.target.value)}
                fullWidth
                required
                placeholder="e.g. Main operating"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="Account type"
                value={manualAccountType}
                onChange={(e) => setManualAccountType(e.target.value)}
                fullWidth
              >
                <MenuItem value="checking">Checking</MenuItem>
                <MenuItem value="savings">Savings</MenuItem>
                <MenuItem value="current">Current</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
              <TextField
                label="Last 4 digits (optional)"
                value={manualMask}
                onChange={(e) => setManualMask(e.target.value.replace(/\D/g, '').slice(0, 4))}
                fullWidth
                inputProps={{ maxLength: 4 }}
              />
              <TextField
                label="Currency"
                value={manualCurrency}
                onChange={(e) => setManualCurrency(e.target.value.toUpperCase().slice(0, 3))}
                fullWidth
                placeholder="NGN"
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Current balance"
                type="number"
                value={manualBalance}
                onChange={(e) => setManualBalance(e.target.value)}
                fullWidth
                required
                inputProps={{ step: '0.01' }}
              />
              <TextField
                label="Available balance (optional)"
                type="number"
                value={manualAvailable}
                onChange={(e) => setManualAvailable(e.target.value)}
                fullWidth
                inputProps={{ step: '0.01' }}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Statement of account (optional)
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
                <Button variant="outlined" component="label" size="small" disabled={loading}>
                  Upload file
                  <input type="file" hidden onChange={handleManualStatementUpload} />
                </Button>
                {manualStatementUrl && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>
                    {manualStatementUrl}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Transactions (optional)</Typography>
                <Button
                  size="small"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={() => setManualTxRows((prev) => [...prev, emptyManualTx()])}
                >
                  Add row
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {manualTxRows.map((row, idx) => (
                  <Card key={idx} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                      <TextField
                        type="date"
                        label="Date"
                        value={row.date}
                        onChange={(e) => {
                          const next = [...manualTxRows];
                          next[idx] = { ...next[idx], date: e.target.value };
                          setManualTxRows(next);
                        }}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 140 }}
                      />
                      <TextField
                        label="Description"
                        value={row.description}
                        onChange={(e) => {
                          const next = [...manualTxRows];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setManualTxRows(next);
                        }}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        select
                        label="Type"
                        value={row.direction}
                        onChange={(e) => {
                          const next = [...manualTxRows];
                          next[idx] = { ...next[idx], direction: e.target.value };
                          setManualTxRows(next);
                        }}
                        size="small"
                        sx={{ minWidth: 100 }}
                      >
                        <MenuItem value="debit">Debit</MenuItem>
                        <MenuItem value="credit">Credit</MenuItem>
                      </TextField>
                      <TextField
                        label="Amount"
                        type="number"
                        value={row.amount}
                        onChange={(e) => {
                          const next = [...manualTxRows];
                          next[idx] = { ...next[idx], amount: e.target.value };
                          setManualTxRows(next);
                        }}
                        size="small"
                        sx={{ minWidth: 120 }}
                        inputProps={{ step: '0.01' }}
                      />
                      {manualTxRows.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setManualTxRows((prev) => prev.filter((_, i) => i !== idx))}
                          aria-label="Remove row"
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      )}
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Stack>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {tab.description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
              <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Supported Regions
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {tab.regions.map((r) => (
                    <Chip key={r} label={r} size="small" />
                  ))}
                </Box>
              </Card>
              <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Features
                </Typography>
                {tab.features.map((f) => (
                  <Typography key={f} variant="body2" sx={{ color: 'text.secondary' }}>
                    • {f}
                  </Typography>
                ))}
              </Card>
            </Stack>

            <Alert severity="info">
              {activeTab === 1
                ? 'We use secure, read-only access where supported. Mono connection opens from your environment when configured.'
                : 'Your bank credentials are never stored on our servers when using Plaid.'}
            </Alert>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeTab === 2 ? (
          <Button
            variant="contained"
            disabled={loading}
            onClick={submitManual}
            startIcon={loading ? <CircularProgress size={16} /> : <Iconify icon="solar:check-circle-bold" />}
          >
            Save manual account
          </Button>
        ) : (
          <Button
            variant="contained"
            disabled={loading || (activeTab === 0 && !linkToken)}
            startIcon={loading ? <CircularProgress size={16} /> : <Iconify icon="solar:link-bold" />}
            onClick={() => {
              toast.info('Plaid / Mono connection is configured in your deployment. Use Manual to add an account without APIs.');
            }}
          >
            Connect
          </Button>
        )}
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
