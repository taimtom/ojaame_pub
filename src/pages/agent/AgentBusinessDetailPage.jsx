import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import ReactApexChart from 'react-apexcharts';
import { agentApi } from 'src/lib/agentApi';

function formatNaira(v) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

const COMMISSION_COLORS = {
  signup_bonus: 'primary',
  monthly_token: 'success',
  subscription_renewal: 'success',
};

function normStatus(s) {
  if (s === 'credited') return 'available';
  if (s === 'pending') return 'pending_unlock';
  return s;
}

function commissionTypeLabel(t) {
  if (t === 'signup_bonus') return 'Signup Bonus';
  if (t === 'monthly_token') return 'Monthly Token';
  if (t === 'subscription_renewal') return 'Subscription Renewal';
  return t ? String(t).replace(/_/g, ' ') : '—';
}

function statusChip(s) {
  const n = normStatus(s);
  if (n === 'available') return { label: 'Available', color: 'success' };
  if (n === 'paid_out') return { label: 'Paid out', color: 'default' };
  if (n === 'pending_unlock') return { label: 'Pending unlock', color: 'warning' };
  return { label: s || '—', color: 'default' };
}

export default function AgentBusinessDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    agentApi
      .get(`/api/referral/businesses/${id}`)
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load business details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  const th = data.unlock_threshold ?? 5;
  const cnt = data.referral_qualifying_sale_count ?? 0;
  const unlocked = data.referral_commission_unlocked;
  const commissions = data.commissions ?? [];
  const totalBooked = commissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const availableFromBiz = commissions.reduce(
    (sum, c) => sum + (normStatus(c.status) === 'available' ? Number(c.amount) || 0 : 0),
    0,
  );

  return (
    <Box>
      <Button
        startIcon={<Iconify icon="solar:arrow-left-bold" width={20} />}
        onClick={() => navigate('/agent/businesses')}
        sx={{ mb: 2 }}
      >
        Back to Businesses
      </Button>

      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          {data.company_name}
        </Typography>
        <Chip
          label={data.is_active ? 'Active' : 'Inactive'}
          color={data.is_active ? 'success' : 'warning'}
          size="small"
        />
        <Chip
          label={data.completed_signup ? 'Setup Complete' : 'Setup Incomplete'}
          color={data.completed_signup ? 'success' : 'default'}
          size="small"
        />
      </Stack>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Joined
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {data.joined ? new Date(data.joined).toLocaleDateString() : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Subscription
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                {data.subscription_status || '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Commission unlock
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {unlocked ? `${th}/${th}` : `${Math.min(cnt, th)}/${th}`}
                {unlocked ? ' Unlocked' : ''}
              </Typography>
              {!unlocked && (
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (cnt / th) * 100)}
                  sx={{ mt: 1, height: 6, borderRadius: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Commissions (booked)
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatNaira(totalBooked)}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                Available: {formatNaira(availableFromBiz)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Revenue Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Monthly Revenue (Last 12 Months)
          </Typography>
          <ReactApexChart
            type="line"
            height={260}
            series={[{ name: 'Revenue (₦)', data: data.monthly_data.map((d) => d.revenue) }]}
            options={{
              chart: { toolbar: { show: false }, zoom: { enabled: false } },
              xaxis: { categories: data.monthly_data.map((d) => d.month) },
              yaxis: { labels: { formatter: (v) => `₦${(v / 1000).toFixed(0)}k` } },
              stroke: { curve: 'smooth', width: 2 },
              tooltip: { y: { formatter: (v) => formatNaira(v) } },
            }}
          />
        </CardContent>
      </Card>

      {/* Transactions Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Monthly Transactions
          </Typography>
          <ReactApexChart
            type="bar"
            height={220}
            series={[{ name: 'Transactions', data: data.monthly_data.map((d) => d.transactions) }]}
            options={{
              chart: { toolbar: { show: false } },
              xaxis: { categories: data.monthly_data.map((d) => d.month) },
              colors: ['#2e7d32'],
              plotOptions: { bar: { borderRadius: 4 } },
            }}
          />
        </CardContent>
      </Card>

      {/* Commissions */}
      {commissions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Your Commissions from this Business
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Month #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commissions.map((c, i) => {
                  const sc = statusChip(c.status);
                  return (
                  <TableRow key={i}>
                    <TableCell>
                      <Chip
                        label={commissionTypeLabel(c.type)}
                        color={COMMISSION_COLORS[c.type] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatNaira(c.amount)}</TableCell>
                    <TableCell>{c.month_number ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={sc.label}
                        color={sc.color}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{new Date(c.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
