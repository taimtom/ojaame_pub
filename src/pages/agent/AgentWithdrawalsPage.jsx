import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { agentApi } from 'src/lib/agentApi';

function formatNaira(v) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

const STATUS_COLOR = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
};

export default function AgentWithdrawalsPage() {
  const [wData, setWData] = useState({ balance: 0, total: 0, items: [] });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', bank_account_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      agentApi.get('/api/referral/withdrawals', { params: { page: page + 1, page_size: rowsPerPage } }),
      agentApi.get('/api/referral/bank-accounts'),
    ])
      .then(([wRes, baRes]) => {
        setWData(wRes.data);
        setBankAccounts(baRes.data);
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, [page, rowsPerPage]);

  const handleWithdraw = async () => {
    setSubmitError('');
    if (!form.amount || !form.bank_account_id) {
      setSubmitError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await agentApi.post('/api/referral/withdrawals', {
        amount: parseFloat(form.amount),
        bank_account_id: parseInt(form.bank_account_id, 10),
      });
      setDialogOpen(false);
      setForm({ amount: '', bank_account_id: '' });
      setSuccessMsg('Withdrawal request submitted! Payment will be processed within 24-48 hours.');
      fetchData();
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Withdrawals
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:wallet-bold" width={20} />}
          onClick={() => setDialogOpen(true)}
          disabled={wData.balance <= 0}
        >
          Request Withdrawal
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}

      {/* Balance Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={4}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Available Balance
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {formatNaira(wData.balance)}
              </Typography>
            </Box>
          </Stack>
          {bankAccounts.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Add a bank account in Settings before requesting a withdrawal.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Processed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {wData.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No withdrawals yet
                  </TableCell>
                </TableRow>
              ) : (
                wData.items.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell sx={{ fontWeight: 600 }}>{formatNaira(w.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        label={w.status}
                        color={STATUS_COLOR[w.status] || 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{w.admin_note || '—'}</TableCell>
                    <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {w.processed_at ? new Date(w.processed_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={wData.total}
            page={page}
            onPageChange={(_, v) => setPage(v)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </CardContent>
      </Card>

      {/* Withdrawal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request Withdrawal</DialogTitle>
        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
          <Typography variant="body2" color="text.secondary" mb={2}>
            Available balance: <strong>{formatNaira(wData.balance)}</strong>
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Amount (₦)"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              inputProps={{ min: 1, max: wData.balance }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Bank Account</InputLabel>
              <Select
                value={form.bank_account_id}
                label="Bank Account"
                onChange={(e) => setForm((p) => ({ ...p, bank_account_id: e.target.value }))}
              >
                {bankAccounts.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.bank_name} — {a.account_number} ({a.account_name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            Your payment will be processed within 24-48 hours.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleWithdraw} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
