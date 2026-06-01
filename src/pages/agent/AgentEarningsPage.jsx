import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { agentApi } from 'src/lib/agentApi';

const UNLOCK_DEFAULT = 5;

function formatNaira(v) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

function normalizeStatus(status) {
  if (status === 'credited') return 'available';
  if (status === 'pending') return 'pending_unlock';
  return status;
}

function statusChipProps(status) {
  const s = normalizeStatus(status);
  if (s === 'available') return { label: 'Available', color: 'success' };
  if (s === 'paid_out') return { label: 'Paid out', color: 'default' };
  if (s === 'pending_unlock') return { label: 'Pending unlock', color: 'warning' };
  return { label: status || '—', color: 'default' };
}

function commissionTypeLabel(t) {
  if (t === 'signup_bonus') return 'Signup Bonus';
  if (t === 'monthly_token') return 'Monthly Token';
  if (t === 'subscription_renewal') return 'Subscription Renewal';
  return t ? String(t).replace(/_/g, ' ') : '—';
}

function commissionTypeColor(t) {
  if (t === 'signup_bonus') return 'primary';
  if (t === 'monthly_token' || t === 'subscription_renewal') return 'success';
  return 'default';
}

export default function AgentEarningsPage() {
  const [data, setData] = useState({ total: 0, items: [], unlock_threshold: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);

  useEffect(() => {
    setLoading(true);
    agentApi
      .get('/api/referral/earnings', { params: { page: page + 1, page_size: rowsPerPage } })
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Earnings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Business</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Month</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>Unlock progress</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No earnings yet. Start referring businesses!
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((row) => {
                      const st = normalizeStatus(row.status);
                      const th = data.unlock_threshold ?? UNLOCK_DEFAULT;
                      const done = row.business_transaction_count ?? 0;
                      const showBar = st === 'pending_unlock';
                      const chip = statusChipProps(row.status);
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Chip
                              label={commissionTypeLabel(row.commission_type)}
                              color={commissionTypeColor(row.commission_type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{row.company_name || '—'}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {formatNaira(row.amount)}
                          </TableCell>
                          <TableCell>{row.month_number ?? '—'}</TableCell>
                          <TableCell>
                            <Chip
                              label={chip.label}
                              color={chip.color}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            {showBar ? (
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {done}/{th} transactions recorded
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, (done / th) * 100)}
                                  sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                                />
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">—</Typography>
                            )}
                          </TableCell>
                          <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={data.total}
                page={page}
                onPageChange={(_, v) => setPage(v)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[15, 30, 60]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
