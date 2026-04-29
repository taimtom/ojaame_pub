import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import DeleteIcon from '@mui/icons-material/Delete';
import { agentApi } from 'src/lib/agentApi';
import { useAgentAuth } from 'src/contexts/AgentAuthContext';

export default function AgentSettingsPage() {
  const { agent } = useAgentAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_number: '', account_name: '', is_default: false });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAccounts = () => {
    agentApi
      .get('/api/referral/bank-accounts')
      .then((r) => setAccounts(r.data))
      .catch(() => setError('Failed to load bank accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAccounts, []);

  const handleAdd = async () => {
    setFormError('');
    if (!form.bank_name || !form.account_number || !form.account_name) {
      setFormError('All fields are required');
      return;
    }
    if (form.account_number.length !== 10) {
      setFormError('Account number must be exactly 10 digits');
      return;
    }
    setSubmitting(true);
    try {
      await agentApi.post('/api/referral/bank-accounts', form);
      setDialogOpen(false);
      setForm({ bank_name: '', account_number: '', account_name: '', is_default: false });
      setSuccessMsg('Bank account added successfully');
      fetchAccounts();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to add bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await agentApi.delete(`/api/referral/bank-accounts/${id}`);
      setAccounts((p) => p.filter((a) => a.id !== id));
    } catch {
      setError('Failed to delete bank account');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Settings
      </Typography>

      {/* Agent Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Agent Profile
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>Name:</strong> {agent?.first_name} {agent?.last_name}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {agent?.email}
            </Typography>
            <Typography variant="body2">
              <strong>Agent Code:</strong>{' '}
              <code style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: 4 }}>
                {agent?.agent_code}
              </code>
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Bank Accounts */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Bank Accounts
            </Typography>
            <Button
              startIcon={<AddIcon fontSize="small" />}
              size="small"
              variant="outlined"
              onClick={() => setDialogOpen(true)}
            >
              Add Account
            </Button>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg('')}>
              {successMsg}
            </Alert>
          )}

          {loading ? (
            <CircularProgress size={24} />
          ) : accounts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No bank accounts yet. Add one to request withdrawals.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Bank</TableCell>
                  <TableCell>Account Number</TableCell>
                  <TableCell>Account Name</TableCell>
                  <TableCell>Default</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.bank_name}</TableCell>
                    <TableCell>{a.account_number}</TableCell>
                    <TableCell>{a.account_name}</TableCell>
                    <TableCell>
                      {a.is_default ? (
                        <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      ) : (
                        <StarBorderIcon fontSize="small" sx={{ color: 'action.disabled' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(a.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Account Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Bank Account</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField
              label="Bank Name"
              value={form.bank_name}
              onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Account Number"
              value={form.account_number}
              onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
              inputProps={{ maxLength: 10 }}
              fullWidth
            />
            <TextField
              label="Account Name"
              value={form.account_name}
              onChange={(e) => setForm((p) => ({ ...p, account_name: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Add Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
