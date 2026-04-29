import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { agentApi } from 'src/lib/agentApi';

function formatNaira(v) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export default function AgentEarningsPage() {
  const [data, setData] = useState({ total: 0, items: [] });
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
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No earnings yet. Start referring businesses!
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Chip
                            label={row.commission_type === 'signup_bonus' ? 'Signup Bonus' : 'Monthly Token'}
                            color={row.commission_type === 'signup_bonus' ? 'primary' : 'success'}
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
                            label={row.status}
                            color={row.status === 'credited' ? 'success' : 'warning'}
                            size="small"
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={data.total}
                page={page}
                onPageChange={(_, v) => setPage(v)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                rowsPerPageOptions={[15, 30, 60]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
