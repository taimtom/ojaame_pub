import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Iconify } from 'src/components/iconify';
import { agentApi } from 'src/lib/agentApi';

function StatCard({ title, value, subtitle, color }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700} color={color || 'text.primary'}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export default function AgentDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    agentApi
      .get('/api/referral/dashboard')
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );

  if (error) return <Alert severity="error">{error}</Alert>;

  const referralLink = `${window.location.origin}/ref/${data.agent_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        Dashboard
      </Typography>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Businesses Referred" value={data.total_businesses} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Earned"
            value={formatNaira(data.total_earned)}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Paid Out" value={formatNaira(data.total_paid_out)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Balance"
            value={formatNaira(data.balance)}
            color="primary.main"
          />
        </Grid>
      </Grid>

      {/* Referral Link */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={600} mb={1}>
            Your Referral Link
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'action.hover',
                px: 2,
                py: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
                flexGrow: 1,
                overflowX: 'auto',
              }}
            >
              {referralLink}
            </Typography>
            <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                <IconButton onClick={handleCopy} size="small" color={copied ? 'success' : 'default'}>
                <Iconify icon="solar:copy-bold" width={18} />
              </IconButton>
            </Tooltip>
          </Stack>
          <Typography variant="caption" color="text.secondary" mt={1} display="block">
            Share this link with businesses — the referral code will be auto-filled when they sign
            up.
          </Typography>
        </CardContent>
      </Card>

      {/* Recent Businesses */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Recent Businesses
          </Typography>
          {data.recent_businesses.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No businesses referred yet. Share your referral link to get started.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Business</TableCell>
                  <TableCell>Setup Complete</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recent_businesses.map((biz) => (
                  <TableRow
                    key={biz.id}
                    hover
                    onClick={() => navigate(`/agent/businesses/${biz.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{biz.company_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={biz.completed_signup ? 'Yes' : 'No'}
                        color={biz.completed_signup ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={biz.is_active ? 'Active' : 'Inactive'}
                        color={biz.is_active ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {biz.joined ? new Date(biz.joined).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
