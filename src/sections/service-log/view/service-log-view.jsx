import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Unstable_Grid2';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';
import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import { useGetUsers } from 'src/actions/user';
import { useAuthContext } from 'src/auth/hooks';
import {
  QuickDashboardPayments,
  sumPaymentLines,
} from 'src/sections/quick-dashboard/quick-dashboard-payments';
import {
  createServiceLog,
  billServiceLog,
  fetchServiceLogs,
  fetchServiceLogTodayStats,
  fetchServiceConsumableTemplates,
} from 'src/actions/service-log';
import { ServiceLogConsumables } from '../service-log-consumables';
import { ServiceLogExpenses } from '../service-log-expenses';

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

  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceResults, setServiceResults] = useState([]);
  const [serviceSearching, setServiceSearching] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [customerInput, setCustomerInput] = useState(null);
  const [customerName, setCustomerName] = useState('');

  const [staffIds, setStaffIds] = useState([]);
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [baseServicePrice, setBaseServicePrice] = useState('');
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

  const { paymentMethods, paymentMethodsLoading } = useGetPaymentMethods(storeId);
  const { users, usersLoading } = useGetUsers();

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
    if (user?.user_id && !staffIds.length) {
      setStaffIds([String(user.user_id)]);
    }
  }, [user, staffIds.length]);

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
    if (!serviceQuery.trim() || !storeId) {
      setServiceResults([]);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setServiceSearching(true);
      try {
        const res = await axiosInstance.get('/api/quick-dashboard/search', {
          params: { query: serviceQuery.trim(), store_id: storeId, limit: 20 },
        });
        const services = (res.data?.results || []).filter((r) => r.type === 'service');
        if (active) setServiceResults(services);
      } catch {
        if (active) setServiceResults([]);
      } finally {
        if (active) setServiceSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [serviceQuery, storeId]);

  useEffect(() => {
    if (!selectedService) return;
    const selectedBasePrice = Number(selectedService.price) || 0;
    setBaseServicePrice(String(selectedBasePrice));
    setPriceManuallyEdited(false);
    setServicePrice(String(selectedBasePrice));
    if (selectedService.duration) {
      setDurationMinutes(String(selectedService.duration));
      setDurationHours('');
    }
    if (!storeId) return;
    (async () => {
      try {
        const templates = await fetchServiceConsumableTemplates(selectedService.id, storeId);
        setConsumables(
          (templates || []).map((t) => ({
            product_id: t.product_id,
            product_name: t.product_name,
            quantity_used: t.default_quantity,
            unit_price: Number(t.product_price) || 0,
          }))
        );
      } catch {
        // no templates
      }
    })();
  }, [selectedService, storeId]);

  const productsTotal = (consumables || []).reduce(
    (sum, row) => sum + (Number(row.quantity_used) || 0) * (Number(row.unit_price) || 0),
    0
  );
  const expensesTotal = (expenses || []).reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );
  const suggestedFinalPrice = (Number(baseServicePrice) || 0) + productsTotal + expensesTotal;

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

  useEffect(() => {
    if (!productQuery.trim() || !storeId || !productDialogOpen) {
      setProductResults([]);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setProductSearching(true);
      try {
        const res = await axiosInstance.get('/api/quick-dashboard/search', {
          params: { query: productQuery.trim(), store_id: storeId, limit: 20 },
        });
        const products = (res.data?.results || []).filter((r) => r.type === 'product');
        if (active) setProductResults(products);
      } catch {
        if (active) setProductResults([]);
      } finally {
        if (active) setProductSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productQuery, storeId, productDialogOpen]);

  const resetForm = () => {
    setSelectedService(null);
    setServiceQuery('');
    setCustomerInput(null);
    setCustomerName('');
    setStaffIds(user?.user_id ? [String(user.user_id)] : []);
    setDurationHours('');
    setDurationMinutes('');
    setBaseServicePrice('');
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
      service_id: selectedService.id,
      performed_by_user_ids: staffIds.map((id) => Number(id)),
      duration_minutes: buildDurationMinutes(),
      service_price: price,
      notes: notes.trim() || null,
      consumables: consumables
        .filter((c) => c.product_id && Number(c.quantity_used) > 0)
        .map((c) => ({
          product_id: c.product_id,
          quantity_used: Number(c.quantity_used),
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
    if (!selectedService) {
      toast.error('Select a service.');
      return;
    }
    if (!staffIds.length) {
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
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(opt) => opt.name || ''}
                    value={customerInput}
                    onChange={(_, val) => {
                      setCustomerInput(val);
                      setCustomerName(val?.name || '');
                    }}
                    inputValue={customerName}
                    onInputChange={(_, val) => setCustomerName(val)}
                    renderInput={(params) => (
                      <TextField {...params} label="Customer" placeholder="Search or leave blank for walk-in" />
                    )}
                  />
                </Grid>
                <Grid xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={users || []}
                    loading={usersLoading}
                    value={(users || []).filter((u) => staffIds.includes(String(u.user_id)))}
                    onChange={(_, values) => {
                      setStaffIds(values.map((v) => String(v.user_id)));
                    }}
                    getOptionLabel={(opt) =>
                      [opt.firstName, opt.lastName].filter(Boolean).join(' ') || opt.email
                    }
                    isOptionEqualToValue={(opt, val) => opt.user_id === val.user_id}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Performing staff"
                        placeholder="Select one or more staff"
                      />
                    )}
                  />
                </Grid>
                <Grid xs={12}>
                  <Autocomplete
                    options={serviceResults}
                    getOptionLabel={(opt) => opt.name || ''}
                    loading={serviceSearching}
                    value={selectedService}
                    onChange={(_, val) => setSelectedService(val)}
                    inputValue={serviceQuery}
                    onInputChange={(_, val) => setServiceQuery(val)}
                    renderInput={(params) => (
                      <TextField {...params} label="Service" placeholder="Search services..." />
                    )}
                  />
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
                    label="Base service price"
                    type="number"
                    value={baseServicePrice}
                    onChange={(e) => {
                      setBaseServicePrice(e.target.value);
                      setPriceManuallyEdited(false);
                    }}
                    InputProps={{
                      startAdornment: (
                        <Typography sx={{ mr: 1, color: 'text.disabled' }}>
                          {currencySymbol}
                        </Typography>
                      ),
                    }}
                  />
                </Grid>
                <Grid xs={12}>
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
                    : 'Auto = base service + products used + expenses'
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
                      }}
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
                      {log.status === 'logged' && (
                        <Button
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={() => openBillDialog(log)}
                        >
                          Bill now
                        </Button>
                      )}
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
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          {productSearching ? (
            <CircularProgress size={24} />
          ) : (
            <Stack spacing={1}>
              {productResults.map((p) => (
                <Button
                  key={p.id}
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                  onClick={() => addProductToConsumables(p)}
                >
                  {p.name}
                  {p.stock != null ? ` · stock: ${p.stock}` : ''}
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
    </DashboardContent>
  );
}
