import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TextField from '@mui/material/TextField';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { useCustomerReport } from 'src/actions/reports';

function getStoreId(storeParam) {
  if (storeParam) return storeParam.split('-').pop();
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { storeName, id } = JSON.parse(raw);
      if (storeName && id) return `${paramCase(storeName)}-${id}`.split('-').pop();
    }
  } catch { /* ignore */ }
  return null;
}

function KpiCard({ icon, label, value, color = 'primary.main', loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 180 }}>
      <CardContent>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={24} sx={{ color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={16} sx={{ mt: 0.5 }} />
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const SORT_COLUMNS = [
  { id: 'name', label: 'Customer' },
  { id: 'total_purchased', label: 'Total Purchased' },
  { id: 'amount_owing', label: 'Amount Owing' },
  { id: 'transaction_count', label: 'Transactions' },
  { id: 'visits_per_month', label: 'Visits / Month' },
];

export default function StoreCustomerReportPage() {
  const navigate = useNavigate();
  const { storeParam } = useParams();
  const storeId = getStoreId(storeParam);
  const [periodState, setPeriodState] = useState({
    period: 'this_month',
    month: null,
    year: null,
    date: null,
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('amount_owing');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { period, month, year, date } = periodState;

  const { report, reportLoading, reportError } = useCustomerReport(
    storeId,
    period,
    month,
    year,
    date,
    { q: search || undefined, sort, order, page: page + 1, pageSize: rowsPerPage }
  );

  const summary = report?.summary;
  const items = report?.items || [];

  const handleSort = (columnId) => {
    if (sort === columnId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(columnId);
      setOrder('desc');
    }
    setPage(0);
  };

  const openDetail = (customerId) => {
    navigate(paths.dashboard.reports.customerDetail(storeParam, customerId));
  };

  return (
    <>
      <Helmet>
        <title>Customer Report | Dashboard</title>
      </Helmet>
      <DashboardContent maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Customer Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {report
                ? `${report.start_date?.slice(0, 10)} → ${report.end_date?.slice(0, 10)}`
                : 'Purchases, owing balances, and visit frequency'}
            </Typography>
          </Box>
          <ReportPeriodSelector period={period} onChange={setPeriodState} />
        </Stack>

        {reportError && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              Could not load report. {reportError?.message || 'Please try again.'}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <KpiCard
            icon="solar:users-group-rounded-bold"
            label="Customers"
            value={summary?.customer_count ?? 0}
            loading={reportLoading}
          />
          <KpiCard
            icon="solar:cart-large-2-bold"
            label="Total Purchased"
            value={fCurrency(summary?.total_purchased ?? 0)}
            color="info.main"
            loading={reportLoading}
          />
          <KpiCard
            icon="solar:wallet-money-bold"
            label="Total Owing"
            value={fCurrency(summary?.total_owing ?? 0)}
            color="warning.main"
            loading={reportLoading}
          />
          <KpiCard
            icon="solar:transfer-horizontal-bold"
            label="Transactions"
            value={summary?.total_transactions ?? 0}
            color="success.main"
            loading={reportLoading}
          />
        </Stack>

        <Card>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              size="small"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 360 }}
            />
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {SORT_COLUMNS.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.id === 'name' ? 'left' : 'right'}
                      sx={{ cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700 }}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                      {sort === col.id && (
                        <Iconify
                          icon={order === 'asc' ? 'eva:arrow-up-fill' : 'eva:arrow-down-fill'}
                          width={14}
                          sx={{ ml: 0.5, verticalAlign: 'middle' }}
                        />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reportLoading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}
                {!reportLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No customers found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!reportLoading &&
                  items.map((row) => (
                    <TableRow
                      key={row.customer_id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openDetail(row.customer_id)}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.phone_number}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{fCurrency(row.total_purchased)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={row.amount_owing > 0 ? 'warning.main' : 'text.primary'}
                          fontWeight={row.amount_owing > 0 ? 600 : 400}
                        >
                          {fCurrency(row.amount_owing)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{row.transaction_count}</TableCell>
                      <TableCell align="right">{row.visits_per_month.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Box>

          <TablePagination
            component="div"
            count={report?.total ?? 0}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Card>
      </DashboardContent>
    </>
  );
}
