import { useMemo, useState } from 'react';
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
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { usePartnerReport } from 'src/actions/reports';

function KpiCard({ icon, label, value, color = 'primary.main', loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
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
            }}
          >
            <Iconify icon={icon} width={24} sx={{ color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
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

const COLUMNS = [
  { id: 'name', label: 'Partner', align: 'left' },
  { id: 'amount_you_owe', label: 'You owe', align: 'right' },
  { id: 'amount_partner_owes', label: 'Owes you', align: 'right' },
  { id: 'items_borrowed', label: 'Borrowed', align: 'right' },
  { id: 'items_lent', label: 'Lent', align: 'right' },
  { id: 'consignment_count', label: 'Consignments', align: 'right' },
];

export default function StorePartnerReportPage() {
  const navigate = useNavigate();
  const { storeParam } = useParams();
  const [periodState, setPeriodState] = useState({
    period: 'this_month',
    month: null,
    year: null,
    date: null,
  });
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('amount_you_owe');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const storeId = storeParam ? storeParam.split('-').pop() : null;
  const { period, month, year, date } = periodState;

  const { report, reportLoading, reportError } = usePartnerReport(
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

  const openDetail = (partnerId) => {
    navigate(paths.dashboard.reports.partnerDetail(storeParam, partnerId));
  };

  const sortableColumns = useMemo(() => COLUMNS, []);

  return (
    <>
      <Helmet>
        <title>Partner Report | Dashboard</title>
      </Helmet>
      <DashboardContent maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Partner Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {report
                ? `${report.start_date?.slice(0, 10)} → ${report.end_date?.slice(0, 10)}`
                : 'Consignment balances and items per partner'}
            </Typography>
          </Box>
          <ReportPeriodSelector period={period} onChange={setPeriodState} />
        </Stack>

        {reportError && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              Could not load partner report. {reportError?.message || 'Please try again.'}
            </Typography>
          </Box>
        )}

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <KpiCard
            icon="solar:users-group-rounded-bold"
            label="Active partners"
            value={summary?.partner_count ?? 0}
            loading={reportLoading}
          />
          <KpiCard
            icon="solar:wallet-money-bold"
            label="Total you owe"
            value={fCurrency(summary?.total_you_owe ?? 0)}
            color="warning.main"
            loading={reportLoading}
          />
          <KpiCard
            icon="solar:hand-money-bold"
            label="Total owed to you"
            value={fCurrency(summary?.total_owed_to_you ?? 0)}
            color="success.main"
            loading={reportLoading}
          />
          <KpiCard
            icon="solar:bill-list-bold"
            label="Unpaid bills"
            value={summary?.unpaid_bill_count ?? 0}
            color="info.main"
            loading={reportLoading}
          />
        </Stack>

        <Card>
          <Box sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder="Search partner name or phone"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" />
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
                  {sortableColumns.map((col) => (
                    <TableCell
                      key={col.id}
                      align={col.align}
                      sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}
                {!reportLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No partners found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!reportLoading &&
                  items.map((row) => (
                    <TableRow
                      key={row.partner_id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => openDetail(row.partner_id)}
                    >
                      <TableCell>
                        <Typography variant="subtitle2">{row.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.phone}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={row.amount_you_owe > 0 ? 'warning.main' : 'text.primary'}
                          fontWeight={row.amount_you_owe > 0 ? 600 : 400}
                        >
                          {fCurrency(row.amount_you_owe)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={row.amount_partner_owes > 0 ? 'success.main' : 'text.primary'}
                          fontWeight={row.amount_partner_owes > 0 ? 600 : 400}
                        >
                          {fCurrency(row.amount_partner_owes)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{row.items_borrowed}</TableCell>
                      <TableCell align="right">{row.items_lent}</TableCell>
                      <TableCell align="right">{row.consignment_count}</TableCell>
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
