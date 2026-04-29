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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactApexChart from 'react-apexcharts';
import { agentApi } from 'src/lib/agentApi';

function formatNaira(v) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

const COMMISSION_COLORS = {
  signup_bonus: 'primary',
  monthly_token: 'success',
};

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

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon fontSize="small" />}
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
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Commissions
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {formatNaira(
                  data.commissions.reduce((sum, c) => sum + (c.status === 'credited' ? c.amount : 0), 0)
                )}
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
      {data.commissions.length > 0 && (
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
                {data.commissions.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Chip
                        label={c.type === 'signup_bonus' ? 'Signup Bonus' : 'Monthly Token'}
                        color={COMMISSION_COLORS[c.type] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatNaira(c.amount)}</TableCell>
                    <TableCell>{c.month_number ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        color={c.status === 'credited' ? 'success' : 'warning'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{new Date(c.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
