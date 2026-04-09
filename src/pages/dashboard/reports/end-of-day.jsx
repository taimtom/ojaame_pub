import { useCallback, useEffect, useMemo, useState } from 'react';
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

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { useAuthContext } from 'src/auth/hooks';
import axiosInstance from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';
import { toast } from 'src/components/snackbar';

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

// ----------------------------------------------------------------------

export default function EndOfDayReportPage() {
  const { storeParam } = useParams();
  const { user } = useAuthContext();
  const storeId = getStoreId(storeParam);
  const companyId = user?.company_id;

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [list, setList] = useState([]);
  const [preview, setPreview] = useState(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [reportDate, setReportDate] = useState(today);
  const [cashBalance, setCashBalance] = useState('');
  const [initialOpening, setInitialOpening] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([
    { bank_account_id: '', balance: '', entry_method: 'manual', statement_file_url: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

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
      toast.error('Could not load end-of-day history.');
    }
  }, [storeId]);

  const fetchPreview = useCallback(async () => {
    if (!storeId || !reportDate) return;
    try {
      const res = await axiosInstance.get(`/api/end-of-day/stores/${storeId}/preview`, {
        params: { date: reportDate },
      });
      setPreview(res.data);
    } catch {
      setPreview(null);
    }
  }, [storeId, reportDate]);

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
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

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

  const handleUpload = async (idx, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', `eod-statement-${reportDate}-${idx}`);
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

    const payload = {
      report_date: reportDate,
      cash_balance: cash,
      bank_lines,
      notes: notes || null,
    };
    if (preview?.requires_initial_opening) {
      const io = parseFloat(initialOpening, 10);
      if (Number.isNaN(io)) {
        throw new Error('Initial opening total is required for the first end-of-day.');
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
    return {
      cash_balance: cash,
      bank_lines: buildBankLines(),
      notes: notes || null,
    };
  };

  const loadReportForEdit = async (reportId) => {
    if (!storeId) return;
    try {
      const { data } = await axiosInstance.get(
        `/api/end-of-day/stores/${storeId}/reports/${reportId}`
      );
      setEditingId(reportId);
      setReportDate(data.report_date);
      setCashBalance(String(data.cash_balance));
      setNotes(data.notes || '');
      setInitialOpening('');
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
    setReportDate(today);
    setCashBalance('');
    setNotes('');
    setInitialOpening('');
    setLines([{ bank_account_id: '', balance: '', entry_method: 'manual', statement_file_url: '' }]);
    fetchPreview();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!storeId) return;
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
        toast.success('End-of-day updated.');
        clearEdit();
      } else {
        await axiosInstance.post(`/api/end-of-day/stores/${storeId}/reports`, payload);
        toast.success('End-of-day saved.');
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
        <Alert severity="warning">Select a store workspace to use end-of-day reports.</Alert>
      </DashboardContent>
    );
  }

  return (
    <>
      <Helmet>
        <title>End of day report</title>
      </Helmet>
      <DashboardContent maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Iconify icon="solar:wallet-money-bold-duotone" width={32} />
          <Typography variant="h4">End of day report</Typography>
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
              Closing cash and bank balances are compared to sales and expenses for the day. Bank
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
                  <TextField
                    type="date"
                    label="Report date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    disabled={Boolean(editingId)}
                    helperText={editingId ? 'Date cannot be changed. Use cancel and create a new report if needed.' : ''}
                  />

                  {preview && (
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Preview (from system)
                      </Typography>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          Opening total (from previous EOD):{' '}
                          <strong>{fCurrency(preview.opening_total)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Revenue (day): <strong>{fCurrency(preview.revenue_day)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Expenses (day): <strong>{fCurrency(preview.expenses_day)}</strong>
                        </Typography>
                        <Typography variant="body2">
                          Net operations: <strong>{fCurrency(preview.net_operations)}</strong>
                        </Typography>
                        {preview.requires_initial_opening && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            First end-of-day for this store: enter the opening total (cash + all
                            banks at start of day).
                          </Alert>
                        )}
                      </Stack>
                    </Card>
                  )}

                  {preview?.requires_initial_opening && !editingId && (
                    <TextField
                      label="Initial opening total (₦)"
                      value={initialOpening}
                      onChange={(e) => setInitialOpening(e.target.value)}
                      fullWidth
                      required
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

                  <Button type="submit" variant="contained" size="large" disabled={saving}>
                    {saving ? 'Saving…' : editingId ? 'Update end of day' : 'Save end of day'}
                  </Button>
                </Stack>
              </Box>
            </Card>

            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                History
              </Typography>
              {list.length === 0 ? (
                <Typography color="text.secondary">No reports yet.</Typography>
              ) : (
                <Table size="small">
                    <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Closing</TableCell>
                      <TableCell align="right">Variance</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right"> </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {list.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.report_date}</TableCell>
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
                          <Button size="small" onClick={() => loadReportForEdit(row.id)}>
                            Edit
                          </Button>
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
    </>
  );
}
