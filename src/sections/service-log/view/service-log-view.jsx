import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { useStaffDirectory } from 'src/hooks/use-staff-directory';

import axiosInstance from 'src/utils/axios';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import {
  billServiceLog,
  createServiceLog,
  fetchServiceLogs,
  fetchServiceLogTodayStats,
  fetchServiceConsumableTemplates,
} from 'src/actions/service-log';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { NonLoginStaffDialog } from 'src/components/staff/non-login-staff-dialog';
import { CustomerQuickAddDialog } from 'src/components/customer/customer-quick-add-dialog';

import { QuickDashboardPayments } from 'src/sections/quick-dashboard/quick-dashboard-payments';

import { useAuthContext } from 'src/auth/hooks';

import { ServiceLogExpenses } from '../service-log-expenses';
import { ServiceLogServices } from '../service-log-services';
import { ServiceLogConsumables } from '../service-log-consumables';
import { ServiceLogDetailDialog } from '../service-log-detail-dialog';

function getStoreIdFromStorage() {
  try {
    const raw = localStorage.getItem('activeWorkspace');
    if (raw) {
      const { id } = JSON.parse(raw);
      return id ? Number(id) : null;
    }
  } catch {
    // ignore
  }
  return null;
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function ServiceLogView() {
  const { currencySymbol } = useCurrencyFormat();
  const { user } = useAuthContext();
  const [storeId, setStoreId] = useState(() => getStoreIdFromStorage());

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [selectedServices, setSelectedServices] = useState([
    { service_id: null, service_name: '', unit_price: '' },
  ]);

  const [customers, setCustomers] = useState([]);
  const [customerInput, setCustomerInput] = useState(null);
  const [customerName, setCustomerName] = useState('');

  const [staffKeys, setStaffKeys] = useState([]);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [consumables, setConsumables] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [billLater, setBillLater] = useState(false);
  const [paymentLines, setPaymentLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [productSearching, setProductSearching] = useState(false);

  const [billDialogLog, setBillDialogLog] = useState(null);
  const [billPaymentLines, setBillPaymentLines] = useState([]);
  const [billing, setBilling] = useState(false);
  const [paymentManuallyEdited, setPaymentManuallyEdited] = useState(false);

  const [detailLogId, setDetailLogId] = useState(null);
  const [detailInitialLog, setDetailInitialLog] = useState(null);
  const [detailOpenShare, setDetailOpenShare] = useState(false);

  const { paymentMethods, paymentMethodsLoading } = useGetPaymentMethods(storeId);
  const { options: staffOptions, loading: staffLoading, reloadEmployees } = useStaffDirectory();

  useEffect(() => {
    const sync = () => setStoreId(getStoreIdFromStorage());
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    const interval = setInterval(sync, 2500);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (user?.user_id && !staffKeys.length) {
      setStaffKeys([`user:${user.user_id}`]);
    }
  }, [user, staffKeys.length]);

  const loadStats = useCallback(async () => {
    if (!storeId) {
      setStatsLoading(false);
      return;
    }
    setStatsLoading(true);
    try {
      const data = await fetchServiceLogTodayStats(storeId);
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [storeId]);

  const loadRecent = useCallback(async () => {
    if (!storeId) {
      setRecentLoading(false);
      return;
    }
    setRecentLoading(true);
    try {
      const data = await fetchServiceLogs({ store_id: storeId, limit: 10 });
      setRecentLogs(data.items || []);
    } catch {
      setRecentLogs([]);
    } finally {
      setRecentLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadStats();
    loadRecent();
  }, [loadStats, loadRecent]);

  useEffect(() => {
    if (!storeId) return undefined;
    let active = true;
    (async () => {
      try {
        const res = await axiosInstance.get('/api/quick-dashboard/customers', {
          params: { store_id: storeId, q: customerName || undefined },
        });
        if (active) setCustomers(res.data || []);
      } catch {
        if (active) setCustomers([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [storeId, customerName]);

  useEffect(() => {
    if (!storeId || !productDialogOpen) {
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setProductSearching(true);
      try {
        const res = await axiosInstance.get('/api/quick-dashboard/search', {
          params: {
            query: productQuery.trim(),
            store_id: storeId,
            item_type: 'product',
            limit: productQuery.trim() ? 20 : 5,
          },
        });
        const products = (res.data?.results || []).filter((r) => r.type === 'product');
        if (active) setProductResults(products);
      } catch {
        if (active) setProductResults([]);
      } finally {
        if (active) setProductSearching(false);
      }
    }, productQuery.trim() ? 300 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productQuery, storeId, productDialogOpen]);

  const filledServices = (selectedServices || []).filter((row) => row.service_id);
  const servicesTotal = filledServices.reduce(
    (sum, row) => sum + (Number(row.unit_price) || 0),
    0
  );
  const productsTotal = (consumables || []).reduce(
    (sum, row) => sum + (Number(row.quantity_used) || 0) * (Number(row.unit_price) || 0),
    0
  );
  const expensesTotal = (expenses || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );
  const suggestedFinalPrice = servicesTotal + productsTotal;

  useEffect(() => {
    if (priceManuallyEdited) return;
    setServicePrice(String(suggestedFinalPrice));
  }, [suggestedFinalPrice, priceManuallyEdited]);

  useEffect(() => {
    const finalPrice = Number(servicePrice) || 0;
    if (billLater || finalPrice <= 0) {
      setPaymentLines([]);
      setPaymentManuallyEdited(false);
      return;
    }
    if (!paymentMethods.length) return;
    if (paymentManuallyEdited) return;

    const methodId = paymentLines[0]?.payment_method_id || paymentMethods[0].id;
    setPaymentLines([{ payment_method_id: methodId, amount: finalPrice }]);
  }, [servicePrice, billLater, paymentMethods, paymentLines, paymentManuallyEdited]);

  const resetForm = () => {
    setSelectedServices([{ service_id: null, service_name: '', unit_price: '' }]);
    setCustomerInput(null);
    setCustomerName('');
    setStaffKeys(user?.user_id ? [`user:${user.user_id}`] : []);
    setDurationHours('');
    setDurationMinutes('');
    setServicePrice('');
    setPriceManuallyEdited(false);
    setNotes('');
    setConsumables([]);
    setExpenses([]);
    setBillLater(false);
    setPaymentLines([]);
    setPaymentManuallyEdited(false);
  };

  const buildDurationMinutes = () => {
    const h = Number(durationHours) || 0;
    const m = Number(durationMinutes) || 0;
    const total = h * 60 + m;
    return total > 0 ? total : null;
  };

  const buildPayload = (extra = {}) => {
    const price = Number(servicePrice) || 0;
    const payments = billLater
      ? []
      : paymentLines
          .filter((p) => Number(p.amount) > 0 && p.payment_method_id)
          .map((p) => ({
            payment_method_id: Number(p.payment_method_id),
            amount: Number(p.amount),
          }));

    return {
      store_id: storeId,
      customer_id: customerInput?.id || null,
      customer_name: !customerInput?.id && customerName.trim() ? customerName.trim() : null,
      service_id: filledServices[0]?.service_id || null,
      services: filledServices.map((s) => ({
        service_id: s.service_id,
        unit_price: Number(s.unit_price) || 0,
        quantity: 1,
      })),
      performed_by_user_ids: staffOptions
        .filter((o) => staffKeys.includes(o.key) && o.kind === 'user')
        .map((o) => Number(o.userId || o.id)),
      performed_by_employee_ids: staffOptions
        .filter((o) => staffKeys.includes(o.key) && o.kind === 'employee')
        .map((o) => Number(o.employeeId || o.id)),
      duration_minutes: buildDurationMinutes(),
      service_price: price,
      notes: notes.trim() || null,
      consumables: consumables
        .filter((c) => c.product_id && Number(c.quantity_used) > 0)
        .map((c) => ({
          product_id: c.product_id,
          quantity_used: Number(c.quantity_used),
          unit_price: Number(c.unit_price) || 0,
        })),
      expenses: expenses
        .filter((e) => Number(e.amount) > 0)
        .map((e) => ({
          amount: Number(e.amount),
          description: e.description || null,
          category: e.category || 'Service delivery',
        })),
      payments,
      bill_later: billLater,
      status: extra.status || 'logged',
      currency_code: 'NGN',
      ...extra,
    };
  };

  const handleSubmit = async (asDraft = false) => {
    if (!storeId) {
      toast.error('Select a store first.');
      return;
    }
    if (!filledServices.length) {
      toast.error('Select at least one service.');
      return;
    }
    if (!staffKeys.length) {
      toast.error('Select at least one staff member who performed the service.');
      return;
    }
    const price = Number(servicePrice);
    if (!asDraft && (!price || price <= 0)) {
      toast.error('Enter the service price.');
      return;
    }

    setSubmitting(true);
    try {
      await createServiceLog(
        buildPayload({ status: asDraft ? 'draft' : 'logged' })
      );
      toast.success(asDraft ? 'Draft saved.' : 'Service logged.');
      resetForm();
      loadStats();
      loadRecent();
    } catch (error) {
      toast.error(error.message || 'Failed to save service log.');
    } finally {
      setSubmitting(false);
    }
  };

  const openLogDetail = (log, share = false) => {
    setDetailInitialLog(log);
    setDetailLogId(log.id);
    setDetailOpenShare(share);
  };

  const closeLogDetail = () => {
    setDetailLogId(null);
    setDetailInitialLog(null);
    setDetailOpenShare(false);
  };

  const openBillDialog = (log) => {
    setBillDialogLog(log);
    const defaultMethodId = paymentMethods[0]?.id ?? '';
    setBillPaymentLines([
      {
        payment_method_id: defaultMethodId,
        amount: log.balance_due || log.service_price,
      },
    ]);
  };

  const handleBillNow = async () => {
    if (!billDialogLog || !storeId) return;
    setBilling(true);
    try {
      await billServiceLog(billDialogLog.id, {
        store_id: storeId,
        payments: billPaymentLines
          .filter((p) => Number(p.amount) > 0 && p.payment_method_id)
          .map((p) => ({
            payment_method_id: Number(p.payment_method_id),
            amount: Number(p.amount),
          })),
        status: 'paid',
        currency_code: 'NGN',
      });
      toast.success('Service billed.');
      setBillDialogLog(null);
      loadStats();
      loadRecent();
    } catch (error) {
      toast.error(error.message || 'Failed to bill service.');
    } finally {
      setBilling(false);
    }
  };

  const handleServiceSelected = async (service) => {
    setPriceManuallyEdited(false);
    if (service?.duration && !durationMinutes && !durationHours) {
      setDurationMinutes(String(service.duration));
    }

    // Merge templates into products — do not wipe existing products
    if (!storeId || !service?.id) return;
    try {
      const templates = await fetchServiceConsumableTemplates(service.id, storeId);
      if (templates?.length) {
        setConsumables((prev) => {
          const next = [...prev];
          templates.forEach((t) => {
            const idx = next.findIndex((c) => c.product_id === t.product_id);
            if (idx >= 0) return;
            next.push({
              product_id: t.product_id,
              product_name: t.product_name,
              quantity_used: t.default_quantity,
              unit_price: Number(t.product_price) || 0,
            });
          });
          return next;
        });
      }
    } catch {
      // ignore template errors
    }
  };

  const addProductToConsumables = (product) => {
    const existing = consumables.find((c) => c.product_id === product.id);
    if (existing) {
      setConsumables(
        consumables.map((c) =>
          c.product_id === product.id
            ? { ...c, quantity_used: Number(c.quantity_used) + 1 }
            : c
        )
      );
    } else {
      setConsumables([
        ...consumables,
        {
          product_id: product.id,
          product_name: product.name,
          quantity_used: 1,
          unit_price: Number(product.price) || 0,
        },
      ]);
    }
    setProductDialogOpen(false);
    setProductQuery('');
  };

  if (!storeId) {
    return (
      <DashboardContent maxWidth="xl">
        <Alert severity="warning">Select a store from the workspace switcher to use Service Log.</Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Service Log</Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid xs={12} md={6}>
                  <Stack spacing={1}>
                    <Autocomplete
                      options={customers}
                      getOptionLabel={(opt) =>
                        opt?.name
                          ? `${opt.name}${opt.phone_number ? ` · ${opt.phone_number}` : ''}`
                          : ''
                      }
                      value={customerInput}
                      onChange={(_, val) => {
                        setCustomerInput(val);
                        setCustomerName(val?.name || '');
                      }}
                      inputValue={customerName}
                      onInputChange={(_, val) => setCustomerName(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Customer"
                          placeholder="Search or leave blank for walk-in"
                        />
                      )}
                    />
                    <Button
                      size="small"
                      startIcon={<Iconify icon="mingcute:add-line" width={16} />}
                      onClick={() => setCustomerDialogOpen(true)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Add customer
                    </Button>
                  </Stack>
                </Grid>
                <Grid xs={12} md={6}>
                  <Stack spacing={1}>
                    <Autocomplete
                      multiple
                      options={staffOptions}
                      loading={staffLoading}
                      value={staffOptions.filter((o) => staffKeys.includes(o.key))}
                      onChange={(_, values) => {
                        setStaffKeys(values.map((v) => v.key));
                      }}
                      getOptionLabel={(opt) =>
                        opt.secondary ? `${opt.label} (${opt.secondary})` : opt.label
                      }
                      isOptionEqualToValue={(opt, val) => opt.key === val.key}
                      renderOption={(props, opt) => (
                        <li {...props} key={opt.key}>
                          <Stack>
                            <Typography variant="body2">{opt.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {opt.secondary}
                            </Typography>
                          </Stack>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Performing staff"
                          placeholder="Login or non-login staff"
                        />
                      )}
                    />
                    <Button
                      size="small"
                      startIcon={<Iconify icon="mingcute:add-line" width={16} />}
                      onClick={() => setStaffDialogOpen(true)}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      Add staff without login
                    </Button>
                  </Stack>
                </Grid>
                <Grid xs={12}>
                  <ServiceLogServices
                    items={selectedServices}
                    onChange={(next) => {
                      setSelectedServices(next);
                      setPriceManuallyEdited(false);
                    }}
                    onServiceSelected={handleServiceSelected}
                    storeId={storeId}
                    currencySymbol={currencySymbol}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Services total: <strong>{fCurrency(servicesTotal)}</strong>
                  </Typography>
                </Grid>
                <Grid xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Hours"
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Minutes"
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    inputProps={{ min: 0, max: 59 }}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <ServiceLogConsumables
                items={consumables}
                onChange={setConsumables}
                onAddClick={() => setProductDialogOpen(true)}
                currencySymbol={currencySymbol}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Products total: <strong>{fCurrency(productsTotal)}</strong>
              </Typography>

              <Divider sx={{ my: 2 }} />

              <ServiceLogExpenses items={expenses} onChange={setExpenses} />

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Expenses total: <strong>{fCurrency(expensesTotal)}</strong>
                {' '}(internal cost — not added to customer invoice)
              </Typography>

              <Divider sx={{ my: 2 }} />

              <TextField
                fullWidth
                label="Final price"
                type="number"
                value={servicePrice}
                onChange={(e) => {
                  setServicePrice(e.target.value);
                  setPriceManuallyEdited(true);
                }}
                helperText={
                  priceManuallyEdited
                    ? 'Manual override enabled (editable)'
                    : 'Auto = services + products used (expenses are internal costs only)'
                }
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1, color: 'text.disabled' }}>
                      {currencySymbol}
                    </Typography>
                  ),
                }}
              />

              {Number(servicePrice) < suggestedFinalPrice && suggestedFinalPrice > 0 && (
                <Alert severity="warning" sx={{ mt: 1.5 }}>
                  Price reduced by {fCurrency(suggestedFinalPrice - Number(servicePrice || 0))} (
                  {(((suggestedFinalPrice - Number(servicePrice || 0)) / suggestedFinalPrice) * 100).toFixed(2)}%).
                  This will be logged as entered.
                </Alert>
              )}

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch checked={billLater} onChange={(e) => setBillLater(e.target.checked)} />
                }
                label="Bill later (log without payment)"
              />

              {!billLater && (
                <QuickDashboardPayments
                  lines={paymentLines}
                  onChange={setPaymentLines}
                  cartTotal={Number(servicePrice) || 0}
                  paymentMethods={paymentMethods}
                  paymentMethodsLoading={paymentMethodsLoading}
                  disabled={submitting}
                  onPaymentsTouched={() => setPaymentManuallyEdited(true)}
                />
              )}

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  disabled={submitting}
                  onClick={() => handleSubmit(true)}
                >
                  Save draft
                </Button>
                <Button
                  variant="contained"
                  disabled={submitting}
                  onClick={() => handleSubmit(false)}
                  startIcon={submitting ? <CircularProgress size={18} /> : null}
                >
                  Log service
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Today
              </Typography>
              {statsLoading ? (
                <CircularProgress size={24} />
              ) : (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Services logged: <strong>{stats?.total_logs ?? 0}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Revenue: <strong>{fCurrency(stats?.total_revenue ?? 0)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Materials cost: <strong>{fCurrency(stats?.total_material_cost ?? 0)}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Service expenses: <strong>{fCurrency(stats?.total_expenses ?? 0)}</strong>
                  </Typography>
                </Stack>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent logs
              </Typography>
              {recentLoading ? (
                <CircularProgress size={24} />
              ) : !recentLogs.length ? (
                <Typography variant="body2" color="text.disabled">
                  No service logs yet.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {recentLogs.map((log) => (
                    <Box
                      key={log.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'background.neutral',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => openLogDetail(log)}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle2">
                            {log.customer_name} · {log.service_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.performed_by_name || 'Staff'} · {formatDuration(log.duration_minutes)} ·{' '}
                            {fCurrency(log.service_price)}
                          </Typography>
                          {(log.consumables?.length > 0 || log.expenses?.length > 0) && (
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                              {log.consumables?.length || 0} product(s) · {log.expenses?.length || 0} expense(s)
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          size="small"
                          label={log.status}
                          color={
                            log.status === 'billed'
                              ? 'success'
                              : log.status === 'logged'
                                ? 'warning'
                                : 'default'
                          }
                        />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }} onClick={(e) => e.stopPropagation()}>
                        <Button size="small" onClick={() => openLogDetail(log)}>
                          View breakdown
                        </Button>
                        {log.status === 'logged' && (
                          <Button size="small" onClick={() => openBillDialog(log)}>
                            Bill now
                          </Button>
                        )}
                        {(log.status === 'billed' || log.status === 'logged') && (
                          <Button
                            size="small"
                            startIcon={<Iconify icon="solar:share-bold" width={16} />}
                            onClick={() => openLogDetail(log, true)}
                          >
                            Share
                          </Button>
                        )}
                      </Stack>
                      {log.status === 'billed' && log.balance_due > 0.02 && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                          Owes {fCurrency(log.balance_due)}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add product used</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Search products"
            placeholder="Type to filter, or pick from suggestions"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          {!productQuery.trim() && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Top products
            </Typography>
          )}
          {productSearching ? (
            <CircularProgress size={24} />
          ) : !productResults.length ? (
            <Typography variant="body2" color="text.disabled">
              No products found.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {productResults.map((p) => (
                <Button
                  key={p.id}
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'space-between' }}
                  onClick={() => addProductToConsumables(p)}
                >
                  <span>
                    {p.name}
                    {p.stock != null ? ` · stock: ${p.stock}` : ''}
                  </span>
                  <span>{fCurrency(p.price || 0)}</span>
                </Button>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(billDialogLog)} onClose={() => setBillDialogLog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Bill service</DialogTitle>
        <DialogContent>
          {billDialogLog && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {billDialogLog.customer_name} · {billDialogLog.service_name} ·{' '}
                {fCurrency(billDialogLog.service_price)}
              </Typography>
              <QuickDashboardPayments
                lines={billPaymentLines}
                onChange={setBillPaymentLines}
                cartTotal={billDialogLog.service_price}
                paymentMethods={paymentMethods}
                paymentMethodsLoading={paymentMethodsLoading}
                disabled={billing}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBillDialogLog(null)}>Cancel</Button>
          <Button variant="contained" disabled={billing} onClick={handleBillNow}>
            {billing ? 'Billing…' : 'Bill now'}
          </Button>
        </DialogActions>
      </Dialog>

      <CustomerQuickAddDialog
        open={customerDialogOpen}
        storeId={storeId}
        onClose={() => setCustomerDialogOpen(false)}
        onCreated={(option) => {
          setCustomers((prev) => {
            const exists = prev.some((c) => c.id === option.id);
            return exists ? prev : [option, ...prev];
          });
          setCustomerInput(option);
          setCustomerName(option.name || '');
        }}
      />

      <NonLoginStaffDialog
        open={staffDialogOpen}
        companyId={user?.company_id}
        onClose={() => setStaffDialogOpen(false)}
        onCreated={(emp) => {
          reloadEmployees().then(() => {
            setStaffKeys((prev) => {
              const key = `employee:${emp.id}`;
              return prev.includes(key) ? prev : [...prev, key];
            });
          });
        }}
      />

      <ServiceLogDetailDialog
        open={Boolean(detailLogId)}
        logId={detailLogId}
        storeId={storeId}
        initialLog={detailInitialLog}
        openShareOnLoad={detailOpenShare}
        onClose={closeLogDetail}
      />
    </DashboardContent>
  );
}
