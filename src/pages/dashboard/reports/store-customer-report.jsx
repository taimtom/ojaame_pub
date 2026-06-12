import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';
import { paramCase } from 'src/utils/change-case';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { TableSelectedAction } from 'src/components/table/table-selected-action';
import { useCustomerReport, mergeCustomerAccounts } from 'src/actions/reports';
import { completeReportView, finishOnboarding } from 'src/actions/onboarding';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';
import { useOnboardingMode } from 'src/hooks/use-onboarding-mode';
import { getOnboardingRedirectPath } from 'src/utils/onboarding-routes';

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
  const onboarding = useOnboardingMode();
  const { storeParam } = useParams();
  const [finishing, setFinishing] = useState(false);
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
  const [selectedById, setSelectedById] = useState({});
  const [mergeOpen, setMergeOpen] = useState(false);
  const [primaryId, setPrimaryId] = useState(null);
  const [merging, setMerging] = useState(false);

  const { period, month, year, date } = periodState;

  const { report, reportLoading, reportError, refetchReport } = useCustomerReport(
    storeId,
    period,
    month,
    year,
    date,
    { q: search || undefined, sort, order, page: page + 1, pageSize: rowsPerPage }
  );

  const summary = report?.summary;
  const items = report?.items || [];

  useEffect(() => {
    if (!onboarding) return undefined;
    completeReportView().catch(() => {});
    return undefined;
  }, [onboarding]);

  const handleFinishSetup = async () => {
    try {
      setFinishing(true);
      const result = await finishOnboarding();
      navigate(getOnboardingRedirectPath(result));
    } catch (err) {
      toast.error(err?.message || 'Could not finish setup.');
    } finally {
      setFinishing(false);
    }
  };

  const selectedRows = useMemo(
    () => Object.values(selectedById),
    [selectedById]
  );
  const selectedIds = useMemo(
    () => selectedRows.map((row) => row.customer_id),
    [selectedRows]
  );
  const numSelected = selectedIds.length;

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

  const toggleRow = (row) => {
    setSelectedById((prev) => {
      const next = { ...prev };
      if (next[row.customer_id]) {
        delete next[row.customer_id];
      } else {
        next[row.customer_id] = row;
      }
      return next;
    });
  };

  const handleSelectAllPage = (checked) => {
    if (!checked) {
      setSelectedById((prev) => {
        const next = { ...prev };
        items.forEach((row) => {
          delete next[row.customer_id];
        });
        return next;
      });
      return;
    }
    setSelectedById((prev) => {
      const next = { ...prev };
      items.forEach((row) => {
        next[row.customer_id] = row;
      });
      return next;
    });
  };

  const pageAllSelected = items.length > 0 && items.every((row) => selectedById[row.customer_id]);
  const pageSomeSelected = items.some((row) => selectedById[row.customer_id]) && !pageAllSelected;

  const openMergeDialog = () => {
    if (selectedRows.length < 2) return;
    const defaultPrimary =
      [...selectedRows].sort((a, b) => b.transaction_count - a.transaction_count)[0];
    setPrimaryId(defaultPrimary.customer_id);
    setMergeOpen(true);
  };

  const mergePreview = useMemo(() => {
    if (!primaryId || selectedRows.length < 2) return null;
    const others = selectedRows.filter((r) => r.customer_id !== primaryId);
    return {
      totalPurchased: selectedRows.reduce((sum, r) => sum + (r.total_purchased || 0), 0),
      amountOwing: selectedRows.reduce((sum, r) => sum + (r.amount_owing || 0), 0),
      transactions: selectedRows.reduce((sum, r) => sum + (r.transaction_count || 0), 0),
      mergeCount: others.length,
    };
  }, [primaryId, selectedRows]);

  const handleMerge = async () => {
    if (!storeId || !primaryId || selectedIds.length < 2) return;
    const mergeIds = selectedIds.filter((id) => id !== primaryId);
    setMerging(true);
    try {
      const result = await mergeCustomerAccounts({
        store_id: Number(storeId),
        primary_customer_id: primaryId,
        merge_customer_ids: mergeIds,
      });
      toast.success(
        `Merged ${result.merged_customer_ids?.length ?? mergeIds.length} account(s) into ${result.name}.`
      );
      setSelectedById({});
      setMergeOpen(false);
      refetchReport();
    } catch (err) {
      toast.error(err.message || 'Could not merge customers.');
    } finally {
      setMerging(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Customer Report | Dashboard</title>
      </Helmet>
      <DashboardContent maxWidth="xl">
        <OnboardingSetupShell subtitle="Review your customer report — see purchases, balances, and visit frequency from the sales you recorded.">
          <span />
        </OnboardingSetupShell>

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

        {onboarding && (
          <Stack direction="row" justifyContent="flex-end" mb={3}>
            <Button
              variant="contained"
              color="success"
              size="large"
              disabled={finishing}
              onClick={handleFinishSetup}
              startIcon={<Iconify icon="solar:check-circle-bold" />}
            >
              {finishing ? 'Finishing...' : 'Finish setup'}
            </Button>
          </Stack>
        )}

        <Card>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
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
              {numSelected > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {numSelected} selected across pages
                </Typography>
              )}
            </Stack>
          </Box>

          <Box sx={{ overflowX: 'auto', position: 'relative' }}>
            <TableSelectedAction
              numSelected={numSelected}
              rowCount={items.length}
              onSelectAllRows={handleSelectAllPage}
              action={
                numSelected >= 2 ? (
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    startIcon={<Iconify icon="solar:users-group-two-rounded-bold" />}
                    onClick={openMergeDialog}
                  >
                    Merge accounts
                  </Button>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                    Select 2+ to merge
                  </Typography>
                )
              }
            />

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={pageSomeSelected}
                      checked={pageAllSelected}
                      onChange={(e) => handleSelectAllPage(e.target.checked)}
                      disabled={reportLoading || items.length === 0}
                    />
                  </TableCell>
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
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}
                {!reportLoading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">No customers found.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!reportLoading &&
                  items.map((row) => {
                    const selected = Boolean(selectedById[row.customer_id]);
                    return (
                      <TableRow
                        key={row.customer_id}
                        hover
                        selected={selected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selected}
                            onChange={() => toggleRow(row)}
                          />
                        </TableCell>
                        <TableCell onClick={() => openDetail(row.customer_id)}>
                          <Typography variant="subtitle2">{row.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.phone_number}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={() => openDetail(row.customer_id)}>
                          {fCurrency(row.total_purchased)}
                        </TableCell>
                        <TableCell align="right" onClick={() => openDetail(row.customer_id)}>
                          <Typography
                            variant="body2"
                            color={row.amount_owing > 0 ? 'warning.main' : 'text.primary'}
                            fontWeight={row.amount_owing > 0 ? 600 : 400}
                          >
                            {fCurrency(row.amount_owing)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={() => openDetail(row.customer_id)}>
                          {row.transaction_count}
                        </TableCell>
                        <TableCell align="right" onClick={() => openDetail(row.customer_id)}>
                          {row.visits_per_month.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      <Dialog open={mergeOpen} onClose={() => !merging && setMergeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Merge customer accounts</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All sales, owing balances, and service records from the other accounts will move to
            the primary account you choose below. The duplicate accounts will be removed.
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Primary account (keep this name &amp; profile)
          </Typography>
          <RadioGroup
            value={primaryId ?? ''}
            onChange={(e) => setPrimaryId(Number(e.target.value))}
          >
            {selectedRows.map((row) => (
              <FormControlLabel
                key={row.customer_id}
                value={row.customer_id}
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {row.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.phone_number} · {row.transaction_count} transactions ·{' '}
                      {fCurrency(row.amount_owing)} owing
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>

          {mergePreview && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                After merge
              </Typography>
              <Typography variant="body2">
                {mergePreview.mergeCount} duplicate account(s) removed ·{' '}
                {mergePreview.transactions} total transactions ·{' '}
                {fCurrency(mergePreview.totalPurchased)} purchased ·{' '}
                {fCurrency(mergePreview.amountOwing)} owing
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" color="inherit" onClick={() => setMergeOpen(false)} disabled={merging}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleMerge}
            disabled={merging || !primaryId || selectedIds.length < 2}
            startIcon={merging ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {merging ? 'Merging…' : 'Merge accounts'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
