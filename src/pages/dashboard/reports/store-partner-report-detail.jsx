import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ReportPeriodSelector } from 'src/components/report-period-selector';
import { usePermissions } from 'src/hooks/use-permissions';
import {
  usePartnerReportDetail,
  payPartner,
  collectPartnerPayment,
} from 'src/actions/reports';

const AMOUNT_EPS = 0.02;

function getStoreId(storeParam) {
  return storeParam ? storeParam.split('-').pop() : null;
}

function KpiCard({ label, value, loading }) {
  return (
    <Card sx={{ flex: 1, minWidth: 140 }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <CircularProgress size={16} sx={{ mt: 0.5 }} />
        ) : (
          <Typography variant="h6" fontWeight={700}>
            {value}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function StorePartnerReportDetailPage() {
  const navigate = useNavigate();
  const { storeParam, partnerId } = useParams();
  const storeId = getStoreId(storeParam);
  const numericPartnerId = Number(partnerId);
  const { hasPermission } = usePermissions();
  const canPay = hasPermission('inventory.update') || hasPermission('sales.update');

  const [periodState, setPeriodState] = useState({
    period: 'this_month',
    month: null,
    year: null,
    date: null,
  });
  const [tab, setTab] = useState('payables');
  const [payOpen, setPayOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [payMode, setPayMode] = useState('pay_all');
  const [collectMode, setCollectMode] = useState('pay_all');
  const [partialAmount, setPartialAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { period, month, year, date } = periodState;

  const { detail, detailLoading, detailError, refetchDetail } = usePartnerReportDetail(
    storeId,
    numericPartnerId,
    period,
    month,
    year,
    date
  );

  const partner = detail?.partner;
  const metrics = detail?.metrics;
  const payables = detail?.outstanding_payables || [];
  const receivables = detail?.outstanding_receivables || [];

  const youOwe = metrics?.amount_you_owe ?? 0;
  const owesYou = metrics?.amount_partner_owes ?? 0;

  const payTarget = useMemo(() => {
    if (payMode === 'pay_all') return youOwe;
    return Number(partialAmount) || 0;
  }, [payMode, partialAmount, youOwe]);

  const collectTarget = useMemo(() => {
    if (collectMode === 'pay_all') return owesYou;
    return Number(partialAmount) || 0;
  }, [collectMode, partialAmount, owesYou]);

  const handlePay = async () => {
    if (!storeId) return;
    setSubmitting(true);
    try {
      await payPartner(numericPartnerId, {
        store_id: Number(storeId),
        mode: payMode,
        amount: payMode === 'partial' ? payTarget : undefined,
      });
      toast.success('Payment recorded');
      setPayOpen(false);
      setPartialAmount('');
      await refetchDetail();
    } catch (err) {
      toast.error(err?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openConsignment = (consignmentId) => {
    if (!storeParam || !consignmentId) return;
    navigate(paths.dashboard.consignment.details(storeParam, consignmentId));
  };

  const handleCollect = async () => {
    if (!storeId) return;
    setSubmitting(true);
    try {
      await collectPartnerPayment(numericPartnerId, {
        store_id: Number(storeId),
        mode: collectMode,
        amount: collectMode === 'partial' ? collectTarget : undefined,
      });
      toast.success('Collection recorded');
      setCollectOpen(false);
      setPartialAmount('');
      await refetchDetail();
    } catch (err) {
      toast.error(err?.message || 'Collection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>{partner?.name ? `${partner.name} | Partner Report` : 'Partner Report'}</title>
      </Helmet>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading={partner?.name || 'Partner Report'}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Partner Report', href: paths.dashboard.reports.partners(storeParam) },
            { name: partner?.name || 'Detail' },
          ]}
          sx={{ mb: 3 }}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            {partner && (
              <Typography variant="body2" color="text.secondary">
                {partner.phone}
                {partner.email ? ` · ${partner.email}` : ''}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {canPay && youOwe > AMOUNT_EPS && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:wallet-money-bold" />}
                onClick={() => {
                  setPayMode('pay_all');
                  setPartialAmount('');
                  setPayOpen(true);
                }}
              >
                Pay partner
              </Button>
            )}
            {canPay && owesYou > AMOUNT_EPS && (
              <Button
                variant="contained"
                color="success"
                startIcon={<Iconify icon="solar:hand-money-bold" />}
                onClick={() => {
                  setCollectMode('pay_all');
                  setPartialAmount('');
                  setCollectOpen(true);
                }}
              >
                Collect payment
              </Button>
            )}
            <ReportPeriodSelector period={period} onChange={setPeriodState} />
          </Stack>
        </Stack>

        {detailError && (
          <Typography color="error" sx={{ mb: 2 }}>
            Could not load partner detail.
          </Typography>
        )}

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <KpiCard label="You owe" value={fCurrency(youOwe)} loading={detailLoading} />
          <KpiCard label="Owes you" value={fCurrency(owesYou)} loading={detailLoading} />
          <KpiCard label="Items borrowed" value={metrics?.items_borrowed ?? 0} loading={detailLoading} />
          <KpiCard label="Items lent" value={metrics?.items_lent ?? 0} loading={detailLoading} />
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="payables" label={`You owe (${payables.length})`} />
          <Tab value="receivables" label={`Owes you (${receivables.length})`} />
          <Tab value="top_received" label="Top received" />
          <Tab value="top_lent" label="Top lent" />
          <Tab value="consignments" label="Recent consignments" />
        </Tabs>

        {tab === 'payables' && (
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payables.map((row) => (
                  <TableRow key={row.bill_id}>
                    <TableCell>{row.description || `Bill #${row.bill_id}`}</TableCell>
                    <TableCell align="right">{fCurrency(row.total_amount)}</TableCell>
                    <TableCell align="right">{fCurrency(row.amount_paid)}</TableCell>
                    <TableCell align="right">{fCurrency(row.balance_due)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {!detailLoading && !payables.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Nothing owed to this partner.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === 'receivables' && (
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Collected</TableCell>
                  <TableCell align="right">Balance</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receivables.map((row) => (
                  <TableRow key={row.receivable_id}>
                    <TableCell>{row.description || `Receivable #${row.receivable_id}`}</TableCell>
                    <TableCell align="right">{fCurrency(row.total_amount)}</TableCell>
                    <TableCell align="right">{fCurrency(row.amount_paid)}</TableCell>
                    <TableCell align="right">{fCurrency(row.balance_due)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {!detailLoading && !receivables.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      Partner owes you nothing outstanding.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === 'top_received' && (
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty received</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detail?.top_items_received || []).map((row) => (
                  <TableRow key={row.product_name}>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell align="right">{row.total_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === 'top_lent' && (
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="right">Qty lent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detail?.top_items_lent || []).map((row) => (
                  <TableRow key={row.product_name}>
                    <TableCell>{row.product_name}</TableCell>
                    <TableCell align="right">{row.total_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {tab === 'consignments' && (
          <Card>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Number</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Items</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(detail?.recent_consignments || []).map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openConsignment(row.id)}
                  >
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {row.consignment_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.direction}</TableCell>
                    <TableCell>
                      <Chip size="small" label={row.status} />
                    </TableCell>
                    <TableCell>{row.items_summary}</TableCell>
                  </TableRow>
                ))}
                {!detailLoading && !(detail?.recent_consignments || []).length && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No consignments in this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </DashboardContent>

      <Dialog open={payOpen} onClose={() => !submitting && setPayOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Pay partner</DialogTitle>
        <DialogContent>
          <RadioGroup value={payMode} onChange={(e) => setPayMode(e.target.value)}>
            <FormControlLabel value="pay_all" control={<Radio />} label={`Pay all (${fCurrency(youOwe)})`} />
            <FormControlLabel value="partial" control={<Radio />} label="Partial amount" />
          </RadioGroup>
          {payMode === 'partial' && (
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handlePay} disabled={submitting}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={collectOpen} onClose={() => !submitting && setCollectOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Collect from partner</DialogTitle>
        <DialogContent>
          <RadioGroup value={collectMode} onChange={(e) => setCollectMode(e.target.value)}>
            <FormControlLabel value="pay_all" control={<Radio />} label={`Collect all (${fCurrency(owesYou)})`} />
            <FormControlLabel value="partial" control={<Radio />} label="Partial amount" />
          </RadioGroup>
          {collectMode === 'partial' && (
            <TextField
              fullWidth
              type="number"
              label="Amount"
              value={partialAmount}
              onChange={(e) => setPartialAmount(e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCollectOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleCollect} disabled={submitting}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
