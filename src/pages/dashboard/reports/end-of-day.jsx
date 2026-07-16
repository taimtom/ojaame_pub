import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link as RouterLink, useParams } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';
import { usePermissions } from 'src/hooks/use-permissions';
import axiosInstance from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';

// ----------------------------------------------------------------------

function getStoreId(storeParam) {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { id } = JSON.parse(raw);
      if (id != null && id !== '') return String(id);
    }
  } catch {
    /* ignore */
  }
  if (storeParam) return storeParam.split('-').pop();
  return null;
}

function statusColor(status) {
  if (status === 'ok') return 'success';
  if (status === 'warning') return 'warning';
  return 'error';
}

function startOfWeek(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // monday start
  d.setDate(d.getDate() + diff);
  return d;
}

/** Calendar date in local timezone (avoids UTC shift from toISOString). */
function toIsoDate(dateObj) {
  const d = new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultPeriodValueForType(periodType) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  switch (periodType) {
    case 'monthly':
      return `${y}-${m}-01`;
    case 'quarterly':
      return `${y}-01-01`;
    case 'yearly':
      return `${y}-01-01`;
    case 'weekly':
    case 'daily':
    default:
      return toIsoDate(now);
  }
}

function getPeriodBounds(periodType, periodValue, quarter, yearValue) {
  const now = new Date();
  switch (periodType) {
    case 'weekly': {
      const ref = periodValue ? new Date(periodValue) : now;
      const start = startOfWeek(ref);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { period_start: toIsoDate(start), period_end: toIsoDate(end) };
    }
    case 'monthly': {
      const [y, m] = (periodValue || toIsoDate(now).slice(0, 7)).split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 0);
      return { period_start: toIsoDate(start), period_end: toIsoDate(end) };
    }
    case 'quarterly': {
      const y = Number(yearValue || now.getFullYear());
      const q = Number(quarter || 1);
      const startMonth = (q - 1) * 3;
      const start = new Date(y, startMonth, 1);
      const end = new Date(y, startMonth + 3, 0);
      return { period_start: toIsoDate(start), period_end: toIsoDate(end) };
    }
    case 'yearly': {
      const y = Number(yearValue || now.getFullYear());
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31);
      return { period_start: toIsoDate(start), period_end: toIsoDate(end) };
    }
    case 'daily':
    default: {
      const d = periodValue || toIsoDate(now);
      return { period_start: d, period_end: d };
    }
  }
}

// ----------------------------------------------------------------------

export default function EndOfDayReportPage() {
  const { storeParam } = useParams();
  const { user } = useAuthContext();
  const { hasPermission } = usePermissions();
  const canUpdateReports = hasPermission('reports.update');
  const canCreateReports = hasPermission('reports.create');
  const canDeleteReports =
    hasPermission('reports.delete') || hasPermission('reports.update');
  const confirmDelete = useBoolean();
  const storeId = getStoreId(storeParam);
  const companyId = user?.company_id;

  const today = useMemo(() => toIsoDate(new Date()), []);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [list, setList] = useState([]);
  const [resetList, setResetList] = useState([]);
  const [preview, setPreview] = useState(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetSaving, setResetSaving] = useState(false);
  const [resetContext, setResetContext] = useState(null);
  const [resetEffectiveDate, setResetEffectiveDate] = useState(today);
  const [resetCash, setResetCash] = useState('');
  const [resetBankBalances, setResetBankBalances] = useState({});
  const [resetReason, setResetReason] = useState('');
  const [resetNotes, setResetNotes] = useState('');
  const [expandedResetId, setExpandedResetId] = useState(null);

  const periodTypeTouchedRef = useRef(false);
  const [periodType, setPeriodType] = useState('daily');
  const [periodValue, setPeriodValue] = useState(today);
  const [quarter, setQuarter] = useState('1');
  const [yearValue, setYearValue] = useState(String(new Date().getFullYear()));
  const [cashBalance, setCashBalance] = useState('');
  const [initialOpening, setInitialOpening] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([
    { bank_account_id: '', balance: '', entry_method: 'manual', statement_file_url: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);

  const fetchAccounts = useCallback(async () => {
    if (!companyId) return;
    try {
      const res = await axiosInstance.get('/api/banking/accounts', {
        params: { company_id: companyId },
      });
      setAccounts(res.data || []);
    } catch {
      toast.error('Could not load bank accounts.');
      setAccounts([]);
    }
  }, [companyId]);

  const fetchList = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await axiosInstance.get(`/api/end-of-day/stores/${storeId}/reports`, {
        params: { limit: 60 },
      });
      setList(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Could not load end-of-period history.');
    }
  }, [storeId]);

  const fetchResets = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await axiosInstance.get(`/api/end-of-day/stores/${storeId}/balance-resets`, {
        params: { limit: 50 },
      });
      setResetList(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Could not load balance restart history.');
    }
  }, [storeId]);

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      if (tb !== ta) return tb - ta;
      return (b.id || 0) - (a.id || 0);
    });
  }, [list]);

  const fetchPeriodType = useCallback(async () => {
    if (!storeId || periodTypeTouchedRef.current) return;
    try {
      const { data } = await axiosInstance.get(`/api/end-of-day/stores/${storeId}/settings/period-type`);
      const nextType = data?.period_type || 'daily';
      setPeriodType(nextType);
      setPeriodValue(defaultPeriodValueForType(nextType));
    } catch {
      setPeriodType('daily');
      setPeriodValue(today);
    }
  }, [storeId, today]);

  const fetchPreview = useCallback(async () => {
    if (!storeId) return;
    const bounds = getPeriodBounds(periodType, periodValue, quarter, yearValue);
    try {
      const res = await axiosInstance.get(`/api/end-of-day/stores/${storeId}/preview`, {
        params: bounds,
      });
      setPreview(res.data);
    } catch {
      setPreview(null);
    }
  }, [storeId, periodType, periodValue, quarter, yearValue]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchAccounts();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchAccounts]);

  useEffect(() => {
    fetchPeriodType();
  }, [fetchPeriodType]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchResets();
  }, [fetchResets]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const openResetDialog = async () => {
    if (!storeId) return;
    setResetEffectiveDate(today);
    setResetCash('');
    setResetReason('');
    setResetNotes('');
    const nextBanks = {};
    (accounts || []).forEach((a) => {
      if (a?.is_active !== false) nextBanks[String(a.id)] = '';
    });
    setResetBankBalances(nextBanks);
    setResetOpen(true);
    try {
      const { data } = await axiosInstance.get(
        `/api/end-of-day/stores/${storeId}/balance-resets/context`,
        { params: { as_of: today } }
      );
      setResetContext(data);
    } catch {
      setResetContext(null);
    }
  };

  const closeResetDialog = () => {
    if (resetSaving) return;
    setResetOpen(false);
  };

  const resetNewTotal = useMemo(() => {
    const cash = parseFloat(resetCash, 10);
    let bank = 0;
    Object.values(resetBankBalances).forEach((v) => {
      const n = parseFloat(v, 10);
      if (!Number.isNaN(n)) bank += n;
    });
    if (Number.isNaN(cash)) return null;
    return cash + bank;
  }, [resetCash, resetBankBalances]);

  const handleSaveReset = async () => {
    if (!storeId) return;
    const cash = parseFloat(resetCash, 10);
    if (Number.isNaN(cash) || cash < 0) {
      toast.error('Enter a valid cash balance.');
      return;
    }
    if (!resetReason.trim() || resetReason.trim().length < 3) {
      toast.error('Enter a reason (at least 3 characters) for audit.');
      return;
    }
    const bank_lines = Object.entries(resetBankBalances).map(([id, bal]) => {
      const n = parseFloat(bal, 10);
      return {
        bank_account_id: Number(id),
        balance: Number.isNaN(n) ? 0 : n,
      };
    });

    setResetSaving(true);
    try {
      await axiosInstance.post(`/api/end-of-day/stores/${storeId}/balance-resets`, {
        effective_date: resetEffectiveDate,
        cash_balance: cash,
        bank_lines,
        reason: resetReason.trim(),
        notes: resetNotes.trim() || null,
      });
      toast.success('Balances restarted. This is saved in the audit history.');
      setResetOpen(false);
      await Promise.all([fetchResets(), fetchPreview(), fetchList()]);
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === 'string' ? d : err.message || 'Restart failed.');
    } finally {
      setResetSaving(false);
    }
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { bank_account_id: '', balance: '', entry_method: 'manual', statement_file_url: '' },
    ]);
  };

  const removeLine = (idx) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const usedAccountIds = useMemo(
    () =>
      new Set(
        lines.map((l) => l.bank_account_id).filter((id) => id !== '' && id !== null)
      ),
    [lines]
  );

  const periodBounds = useMemo(
    () => getPeriodBounds(periodType, periodValue, quarter, yearValue),
    [periodType, periodValue, quarter, yearValue]
  );

  const enteredClosingTotal = useMemo(() => {
    const cash = parseFloat(cashBalance, 10);
    if (Number.isNaN(cash)) return null;
    const bankSum = lines.reduce((sum, line) => {
      if (line.bank_account_id === '' || line.bank_account_id == null) return sum;
      const bal = parseFloat(line.balance, 10);
      return sum + (Number.isNaN(bal) ? 0 : bal);
    }, 0);
    return cash + bankSum;
  }, [cashBalance, lines]);

  const liveVariance = useMemo(() => {
    if (!preview || enteredClosingTotal == null) return null;
    const opening = preview.requires_initial_opening
      ? parseFloat(initialOpening, 10)
      : preview.opening_total;
    if (preview.requires_initial_opening && Number.isNaN(opening)) return null;
    return enteredClosingTotal - opening - preview.net_operations;
  }, [preview, enteredClosingTotal, initialOpening]);

  const handlePeriodTypeChange = (nextType) => {
    periodTypeTouchedRef.current = true;
    setPeriodType(nextType);
    setPeriodValue(defaultPeriodValueForType(nextType));
  };

  const handleUpload = async (idx, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', `eop-statement-${periodValue}-${idx}`);
    try {
      const res = await axiosInstance.post('/api/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.fileUrl;
      if (url) {
        updateLine(idx, 'statement_file_url', url);
        toast.success('Statement uploaded.');
      }
    } catch {
      toast.error('Upload failed.');
    }
  };

  const buildBankLines = () => {
    const bank_lines = lines
      .filter((l) => l.bank_account_id !== '' && l.bank_account_id != null)
      .map((l) => {
        const bal = parseFloat(l.balance, 10);
        if (Number.isNaN(bal)) throw new Error('Enter a valid balance for each bank line.');
        const entry_method = l.entry_method || 'manual';
        if (entry_method === 'mono') throw new Error('Mono is not available yet.');
        return {
          bank_account_id: Number(l.bank_account_id),
          balance: bal,
          entry_method,
          statement_file_url: l.statement_file_url || null,
          statement_storage_key: null,
        };
      });
    return bank_lines;
  };

  const buildPayload = () => {
    const cash = parseFloat(cashBalance, 10);
    if (Number.isNaN(cash)) {
      throw new Error('Enter a valid cash balance.');
    }
    const bank_lines = buildBankLines();

    const bounds = getPeriodBounds(periodType, periodValue, quarter, yearValue);
    const payload = {
      period_start: bounds.period_start,
      period_end: bounds.period_end,
      period_type: periodType,
      cash_balance: cash,
      bank_lines,
      notes: notes || null,
    };
    if (preview?.requires_initial_opening) {
      const io = parseFloat(initialOpening, 10);
      if (Number.isNaN(io)) {
        throw new Error('Initial opening total is required for the first end-of-period.');
      }
      payload.initial_opening_total = io;
    }
    return payload;
  };

  const buildPatchPayload = () => {
    const cash = parseFloat(cashBalance, 10);
    if (Number.isNaN(cash)) {
      throw new Error('Enter a valid cash balance.');
    }
    const payload = {
      cash_balance: cash,
      bank_lines: buildBankLines(),
      notes: notes || null,
      period_start: periodBounds.period_start,
      period_end: periodBounds.period_end,
      period_type: periodType,
    };
    if (preview?.requires_initial_opening) {
      const io = parseFloat(initialOpening, 10);
      if (!Number.isNaN(io)) {
        payload.initial_opening_total = io;
      }
    }
    return payload;
  };

  const loadReportForEdit = async (reportId) => {
    if (!storeId) return;
    try {
      const { data } = await axiosInstance.get(
        `/api/end-of-day/stores/${storeId}/reports/${reportId}`
      );
      setEditingId(reportId);
      periodTypeTouchedRef.current = true;
      const nextPeriodType = data.period_type || periodType;
      const nextPeriodStart = data.period_start || data.report_date;
      setPeriodType(nextPeriodType);
      setPeriodValue(nextPeriodStart);
      if (nextPeriodStart) {
        const d = new Date(nextPeriodStart);
        setYearValue(String(d.getFullYear()));
        setQuarter(String(Math.floor(d.getMonth() / 3) + 1));
      }
      setCashBalance(String(data.cash_balance));
      setNotes(data.notes || '');
      setInitialOpening(
        data.used_initial_opening ? String(data.opening_total_snapshot ?? '') : ''
      );
      const bl = (data.bank_balances || []).map((b) => ({
        bank_account_id: b.bank_account_id,
        balance: String(b.balance),
        entry_method: b.entry_method || 'manual',
        statement_file_url: b.statement_file_url || '',
      }));
      setLines(
        bl.length
          ? bl
          : [{ bank_account_id: '', balance: '', entry_method: 'manual', statement_file_url: '' }]
      );
      toast.success('Loaded for editing.');
    } catch {
      toast.error('Could not load report.');
    }
  };

  const clearEdit = () => {
    setEditingId(null);
    periodTypeTouchedRef.current = false;
    setPeriodValue(today);
    setCashBalance('');
    setNotes('');
    setInitialOpening('');
    setLines([{ bank_account_id: '', balance: '', entry_method: 'manual', statement_file_url: '' }]);
    fetchPeriodType();
    fetchPreview();
  };

  const openDeleteConfirm = (row) => {
    setReportToDelete(row);
    confirmDelete.onTrue();
  };

  const handleDeleteReport = async () => {
    if (!storeId || !reportToDelete?.id) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(
        `/api/end-of-day/stores/${storeId}/reports/${reportToDelete.id}`
      );
      if (editingId === reportToDelete.id) {
        clearEdit();
      }
      toast.success('End-of-period report deleted.');
      confirmDelete.onFalse();
      setReportToDelete(null);
      fetchList();
      fetchPreview();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === 'string' ? d : err.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeId) return;
    if (editingId && !canUpdateReports) {
      toast.error('You need reports.update permission to edit end-of-period reports.');
      return;
    }
    if (!editingId && !canCreateReports) {
      toast.error('You need reports.create permission to save end-of-period reports.');
      return;
    }
    let payload;
    try {
      payload = editingId ? buildPatchPayload() : buildPayload();
    } catch (err) {
      toast.error(err.message);
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await axiosInstance.patch(`/api/end-of-day/stores/${storeId}/reports/${editingId}`, payload);
        toast.success('End-of-period updated.');
        clearEdit();
      } else {
        await axiosInstance.post(`/api/end-of-day/stores/${storeId}/reports`, payload);
        toast.success('End-of-period saved.');
        setNotes('');
      }
      fetchList();
      fetchPreview();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === 'string' ? d : err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!storeId) {
    return (
      <DashboardContent>
        <Alert severity="warning">Select a store workspace to use end-of-period reports.</Alert>
      </DashboardContent>
    );
  }

  return (
    <>
      <Helmet>
        <title>End of period report</title>
      </Helmet>
      <DashboardContent maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify icon="solar:wallet-money-bold-duotone" width={32} />
            <Typography variant="h4">End of period report</Typography>
          </Stack>
          {canUpdateReports && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Iconify icon="solar:refresh-circle-bold-duotone" />}
              onClick={openResetDialog}
            >
              Restart balances
            </Button>
          )}
        </Stack>

        {loading ? (
          <CircularProgress />
        ) : (
          <Stack spacing={3}>
            <Alert
              severity="info"
              action={
                <Button
                  component={RouterLink}
                  to={`${paths.dashboard.user.account}?tab=finance`}
                  size="small"
                  variant="outlined"
                  color="inherit"
                >
                  Add bank accounts
                </Button>
              }
            >
              Closing cash and bank balances are compared to sales and expenses for the selected period. Bank
              accounts must be added under <strong>Account → Finance</strong> first.
            </Alert>

            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6">{editingId ? 'Edit report' : 'New report'}</Typography>
                {editingId && (
                  <Button size="small" onClick={clearEdit}>
                    Cancel edit
                  </Button>
                )}
              </Stack>
              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  {!editingId && (
                    <Typography variant="caption" color="text.secondary">
                      Period: {periodBounds.period_start} → {periodBounds.period_end}
                    </Typography>
                  )}

                  <TextField
                    select
                    label="Period type"
                    value={periodType}
                    onChange={(e) => handlePeriodTypeChange(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="quarterly">Quarterly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </TextField>

                  {periodType === 'daily' && (
                    <TextField
                      type="date"
                      label="Day"
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  )}
                  {periodType === 'weekly' && (
                    <TextField
                      type="date"
                      label="Week reference date"
                      value={periodValue}
                      onChange={(e) => setPeriodValue(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  )}
                  {periodType === 'monthly' && (
                    <TextField
                      type="month"
                      label="Month"
                      value={periodValue?.slice(0, 7) || ''}
                      onChange={(e) => setPeriodValue(`${e.target.value}-01`)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  )}
                  {periodType === 'quarterly' && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        select
                        label="Quarter"
                        value={quarter}
                        onChange={(e) => setQuarter(e.target.value)}
                        fullWidth
                      >
                        <MenuItem value="1">Q1</MenuItem>
                        <MenuItem value="2">Q2</MenuItem>
                        <MenuItem value="3">Q3</MenuItem>
                        <MenuItem value="4">Q4</MenuItem>
                      </TextField>
                      <TextField
                        type="number"
                        label="Year"
                        value={yearValue}
                        onChange={(e) => setYearValue(e.target.value)}
                        fullWidth
                      />
                    </Stack>
                  )}
                  {periodType === 'yearly' && (
                    <TextField
                      type="number"
                      label="Year"
                      value={yearValue}
                      onChange={(e) => setYearValue(e.target.value)}
                      fullWidth
                    />
                  )}

                  {editingId && (
                    <Typography variant="caption" color="text.secondary">
                      Editing period: {periodBounds.period_start} → {periodBounds.period_end}. Later
                      reports will be recalculated from this one.
                    </Typography>
                  )}

                  {preview && (
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Preview (from system)
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          Opening total
                          {preview.opening_source === 'balance_reset'
                            ? ' (from balance restart)'
                            : preview.opening_source === 'previous_eod'
                              ? ' (from previous period)'
                              : ''}
                          : <strong>{fCurrency(preview.opening_total)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Revenue (period): <strong>{fCurrency(preview.revenue_day)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Expenses (period): <strong>{fCurrency(preview.expenses_day)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Net operations: <strong>{fCurrency(preview.net_operations)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Expected closing (opening + net):{' '}
                          <strong>
                            {fCurrency(
                              (() => {
                                const opening = preview.requires_initial_opening
                                  ? parseFloat(initialOpening, 10)
                                  : preview.opening_total;
                                if (Number.isNaN(opening)) return preview.opening_total + preview.net_operations;
                                return opening + preview.net_operations;
                              })()
                            )}
                          </strong>
                        </Typography>
                        {enteredClosingTotal != null && (
                          <Typography variant="body2">
                            Your closing total: <strong>{fCurrency(enteredClosingTotal)}</strong>
                          </Typography>
                        )}
                        {liveVariance != null && (
                          <Typography
                            variant="body2"
                            color={
                              Math.abs(liveVariance) <= 1
                                ? 'success.main'
                                : liveVariance > 0
                                  ? 'warning.main'
                                  : 'error.main'
                            }
                          >
                            Variance (before save): <strong>{fCurrency(liveVariance)}</strong>
                          </Typography>
                        )}
                        {preview.requires_initial_opening && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            First end-of-period for this store: enter the opening total (cash + all
                            banks at the start of the period). Or use Restart balances if you want
                            an audited reset going forward.
                          </Alert>
                        )}
                        {preview.opening_source === 'balance_reset' && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            Opening comes from a saved balance restart. Later daily periods will
                            chain from closings after this.
                          </Alert>
                        )}
                      </Stack>
                    </Card>
                  )}

                  {preview?.requires_initial_opening && (
                    <TextField
                      label="Initial opening total (₦)"
                      value={initialOpening}
                      onChange={(e) => setInitialOpening(e.target.value)}
                      fullWidth
                      required={!editingId}
                    />
                  )}

                  <TextField
                    label="Closing cash (₦)"
                    value={cashBalance}
                    onChange={(e) => setCashBalance(e.target.value)}
                    fullWidth
                    required
                  />

                  <Typography variant="subtitle2">Bank accounts</Typography>
                  {lines.map((line, idx) => (
                    <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          alignItems={{ sm: 'center' }}
                        >
                          <TextField
                            select
                            label="Account"
                            value={line.bank_account_id}
                            onChange={(e) => updateLine(idx, 'bank_account_id', e.target.value)}
                            fullWidth
                            required
                          >
                            <MenuItem value="">
                              <em>Select bank</em>
                            </MenuItem>
                            {accounts.map((a) => (
                              <MenuItem
                                key={a.id}
                                value={a.id}
                                disabled={
                                  usedAccountIds.has(a.id) && String(line.bank_account_id) !== String(a.id)
                                }
                              >
                                {a.institution_name || 'Bank'} — {a.account_name}{' '}
                                {a.mask ? `(****${a.mask})` : ''}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            label="Closing balance (₦)"
                            value={line.balance}
                            onChange={(e) => updateLine(idx, 'balance', e.target.value)}
                            fullWidth
                            required
                          />
                        </Stack>
                        <TextField
                          select
                          label="Entry method"
                          value={line.entry_method}
                          onChange={(e) => updateLine(idx, 'entry_method', e.target.value)}
                          fullWidth
                        >
                          <MenuItem value="manual">Manual</MenuItem>
                          <MenuItem value="statement_upload">Statement upload</MenuItem>
                          <MenuItem value="mono" disabled>
                            Mono (coming soon)
                          </MenuItem>
                        </TextField>
                        {line.entry_method === 'statement_upload' && (
                          <Stack spacing={1}>
                            <Button component="label" variant="outlined" size="small">
                              Upload statement
                              <input
                                type="file"
                                hidden
                                onChange={(e) => handleUpload(idx, e.target.files?.[0])}
                              />
                            </Button>
                            {line.statement_file_url && (
                              <Typography variant="caption" color="text.secondary">
                                File: {line.statement_file_url}
                              </Typography>
                            )}
                          </Stack>
                        )}
                        {lines.length > 1 && (
                          <Button color="error" size="small" onClick={() => removeLine(idx)}>
                            Remove line
                          </Button>
                        )}
                      </Stack>
                    </Card>
                  ))}
                  <Button variant="outlined" onClick={addLine} startIcon={<Iconify icon="mingcute:add-line" />}>
                    Add bank line
                  </Button>

                  <TextField
                    label="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={saving || (editingId ? !canUpdateReports : !canCreateReports)}
                  >
                    {saving ? 'Saving…' : editingId ? 'Update end of period' : 'Save end of period'}
                  </Button>
                </Stack>
              </Box>
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Balance restart audit
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Immutable record of cash + bank opening restarts (who, when, previous → new).
              </Typography>
              {resetList.length === 0 ? (
                <Typography color="text.secondary">No balance restarts yet.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Effective</TableCell>
                      <TableCell>By</TableCell>
                      <TableCell align="right">Previous</TableCell>
                      <TableCell align="right">New</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell align="right"> </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resetList.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Typography variant="body2">{row.effective_date}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.created_at
                              ? new Date(row.created_at).toLocaleString()
                              : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.created_by_name || row.created_by_email || `User #${row.created_by}`}
                          </Typography>
                          {row.created_by_email && row.created_by_name && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {row.created_by_email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {row.previous_total != null ? fCurrency(row.previous_total) : '—'}
                        </TableCell>
                        <TableCell align="right">{fCurrency(row.new_total)}</TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" noWrap title={row.reason}>
                            {row.reason}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() =>
                              setExpandedResetId((id) => (id === row.id ? null : row.id))
                            }
                          >
                            {expandedResetId === row.id ? 'Hide' : 'Details'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {expandedResetId != null &&
                (() => {
                  const row = resetList.find((r) => r.id === expandedResetId);
                  if (!row) return null;
                  return (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Restart #{row.id} detail
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          Previous cash: {row.previous_cash_balance != null ? fCurrency(row.previous_cash_balance) : '—'}
                          {' · '}Previous banks:{' '}
                          {row.previous_bank_total != null ? fCurrency(row.previous_bank_total) : '—'}
                        </Typography>
                        <Typography variant="body2">
                          New cash: {fCurrency(row.new_cash_balance)} · New banks:{' '}
                          {fCurrency(row.new_bank_total)}
                        </Typography>
                        {(row.bank_lines || []).map((ln) => (
                          <Typography key={ln.bank_account_id} variant="caption" display="block">
                            {ln.account_label || `Account ${ln.bank_account_id}`}:{' '}
                            {fCurrency(ln.balance)}
                          </Typography>
                        ))}
                        {row.notes && (
                          <Typography variant="body2" color="text.secondary">
                            Notes: {row.notes}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  );
                })()}
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                History
              </Typography>
              {sortedList.length === 0 ? (
                <Typography color="text.secondary">No reports yet.</Typography>
              ) : (
                <Table size="small">
                    <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Closing</TableCell>
                      <TableCell align="right">Variance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right"> </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedList.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.period_type && row.period_type !== 'daily'
                            ? `${row.period_type} · `
                            : ''}
                          {`${row.period_start || row.report_date} to ${row.period_end || row.report_date}`}
                        </TableCell>
                        <TableCell align="right">{fCurrency(row.closing_total_snapshot)}</TableCell>
                        <TableCell align="right">{fCurrency(row.variance_amount)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.status}
                            color={statusColor(row.status)}
                            variant="soft"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {canUpdateReports && (
                              <Button size="small" onClick={() => loadReportForEdit(row.id)}>
                                Edit
                              </Button>
                            )}
                            {canDeleteReports && (
                              <Button
                                size="small"
                                color="error"
                                onClick={() => openDeleteConfirm(row)}
                              >
                                Delete
                              </Button>
                            )}
                            {!canUpdateReports && !canDeleteReports && (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </Stack>
        )}
      </DashboardContent>

      <Dialog open={resetOpen} onClose={closeResetDialog} fullWidth maxWidth="sm">
        <DialogTitle>Restart cash &amp; bank balances</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              This sets a new opening total for end-of-period from the effective date. Old sales and
              products stay. The restart is saved permanently for audit (who, when, previous → new).
            </Alert>

            {resetContext?.has_prior_position && (
              <Alert severity="info">
                Last recorded closing before restart:{' '}
                <strong>{fCurrency(resetContext.previous_total)}</strong>
                {resetContext.previous_period_end
                  ? ` (period ending ${resetContext.previous_period_end})`
                  : ''}
                . Cash {fCurrency(resetContext.previous_cash_balance)} · Banks{' '}
                {fCurrency(resetContext.previous_bank_total)}.
              </Alert>
            )}

            <TextField
              type="date"
              label="Effective date"
              value={resetEffectiveDate}
              onChange={(e) => setResetEffectiveDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              helperText="Next end-of-period starting on or after this date uses the new opening."
            />

            <TextField
              label="New cash balance (₦)"
              value={resetCash}
              onChange={(e) => setResetCash(e.target.value)}
              fullWidth
              required
            />

            {(accounts || [])
              .filter((a) => a?.is_active !== false)
              .map((acct) => (
                <TextField
                  key={acct.id}
                  label={`${acct.institution_name || ''} ${acct.account_name || `Account ${acct.id}`}`.trim()}
                  value={resetBankBalances[String(acct.id)] ?? ''}
                  onChange={(e) =>
                    setResetBankBalances((prev) => ({
                      ...prev,
                      [String(acct.id)]: e.target.value,
                    }))
                  }
                  fullWidth
                  helperText={acct.mask ? `****${acct.mask}` : 'Bank closing balance'}
                />
              ))}

            {accounts?.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No bank accounts linked — cash only will be restarted.
              </Typography>
            )}

            {resetNewTotal != null && (
              <Typography variant="subtitle2">
                New opening total: {fCurrency(resetNewTotal)}
              </Typography>
            )}

            <TextField
              label="Reason (required for audit)"
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              fullWidth
              required
              multiline
              minRows={2}
              placeholder="e.g. Store inactive for months; counted cash and banks to restart daily use"
            />

            <TextField
              label="Notes (optional)"
              value={resetNotes}
              onChange={(e) => setResetNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResetDialog} disabled={resetSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSaveReset}
            disabled={resetSaving || !canUpdateReports}
          >
            {resetSaving ? 'Saving…' : 'Save restart'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={() => {
          confirmDelete.onFalse();
          setReportToDelete(null);
        }}
        title="Delete end-of-period report?"
        content={
          reportToDelete ? (
            <>
              Remove the report for{' '}
              <strong>
                {reportToDelete.period_start || reportToDelete.report_date} to{' '}
                {reportToDelete.period_end || reportToDelete.report_date}
              </strong>
              ? Later reports will be recalculated from the previous period.
            </>
          ) : (
            'Remove this end-of-period report?'
          )
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleDeleteReport}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}
