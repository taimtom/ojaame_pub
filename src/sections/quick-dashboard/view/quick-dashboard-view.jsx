import { useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Grid from '@mui/material/Unstable_Grid2';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useAuthContext } from 'src/auth/hooks';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

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

function fTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fDateShort(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const PAYMENT_METHODS = ['cash', 'card', 'transfer', 'pos'];

// ----------------------------------------------------------------------
// Stat Card
// ----------------------------------------------------------------------

function StatCard({ icon, label, value, color = 'primary.main', loading }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 1.5,
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={26} sx={{ color }} />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            {loading ? (
              <CircularProgress size={18} sx={{ mt: 0.5 }} />
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

// ----------------------------------------------------------------------
// Search result row / card
// ----------------------------------------------------------------------

function ItemCard({ item, onAdd }) {
  return (
    <Card
      onClick={() => onAdd(item)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.main', boxShadow: 2, transform: 'translateY(-1px)' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: item.type === 'product' ? 'info.lighter' : 'warning.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify
            icon={item.type === 'product' ? 'solar:box-bold' : 'solar:hand-stars-bold'}
            width={20}
            sx={{ color: item.type === 'product' ? 'info.dark' : 'warning.dark' }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {item.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {fCurrency(item.price)}
            </Typography>
            {item.stock != null && (
              <Chip
                size="small"
                label={`Qty: ${item.stock}`}
                color={item.stock > 5 ? 'success' : item.stock > 0 ? 'warning' : 'error'}
                sx={{ height: 18, fontSize: 10 }}
              />
            )}
          </Stack>
        </Box>
        <Iconify icon="eva:plus-fill" width={18} sx={{ color: 'primary.main', flexShrink: 0 }} />
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Cart row
// ----------------------------------------------------------------------

function CartRow({ item, onQtyChange, onQtyInput, onPriceChange, onRemove, inputMode, onToggleMode, onAmountInput }) {
  const { currencySymbol } = useCurrencyFormat();
  const isAmountMode = inputMode === 'amount';

  return (
    <TableRow>
      <TableCell sx={{ py: 1, pl: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
          {item.name}
        </Typography>
        {item.allow_variable_price ? (
          <TextField
            value={item.unit_price}
            onChange={(e) => onPriceChange?.(item.cartId, e.target.value)}
            type="number"
            variant="outlined"
            size="small"
            sx={{ mt: 0.25, maxWidth: 120 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ typography: 'caption', color: 'text.disabled' }}>{currencySymbol}</Box>
                </InputAdornment>
              ),
            }}
            inputProps={{ step: 0.01 }}
            helperText={
              item.variable_price_min != null && item.variable_price_max != null
                ? `Var: ${currencySymbol}${item.variable_price_min}–${currencySymbol}${item.variable_price_max}`
                : 'Variable price'
            }
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            {currencySymbol}{item.unit_price.toLocaleString()}
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ py: 1 }} align="center">
        {isAmountMode ? (
          /* ── Amount mode: user enters the total they want to pay ── */
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <TextField
              value={item.subtotal || ''}
              onChange={(e) => onAmountInput?.(item.cartId, e.target.value)}
              type="number"
              variant="outlined"
              size="small"
              placeholder="0"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ typography: 'caption', color: 'text.disabled' }}>{currencySymbol}</Box>
                  </InputAdornment>
                ),
              }}
              inputProps={{ step: 1, min: 0, style: { textAlign: 'center', width: 60 } }}
            />
            <Tooltip title="Switch to quantity mode">
              <IconButton
                size="small"
                onClick={() => onToggleMode?.(item.cartId)}
                sx={{ p: 0.25, color: 'primary.main' }}
              >
                <Iconify icon="solar:hashtag-bold" width={14} />
              </IconButton>
            </Tooltip>
          </Stack>
        ) : (
          /* ── Qty mode: default +/- stepper ── */
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" onClick={() => onQtyChange(item.cartId, -1)} sx={{ p: 0.25 }}>
              <Iconify icon="eva:minus-fill" width={14} />
            </IconButton>
            <TextField
              value={item.quantity}
              onChange={(e) => onQtyInput?.(item.cartId, e.target.value)}
              type="number"
              variant="outlined"
              size="small"
              inputProps={{ step: 0.01, min: 0.01, style: { textAlign: 'center', width: 56 } }}
            />
            <IconButton size="small" onClick={() => onQtyChange(item.cartId, 1)} sx={{ p: 0.25 }}>
              <Iconify icon="eva:plus-fill" width={14} />
            </IconButton>
            <Tooltip title="Enter total amount instead of quantity">
              <IconButton
                size="small"
                onClick={() => onToggleMode?.(item.cartId)}
                sx={{ p: 0.25, color: 'text.secondary' }}
              >
                <Iconify icon="solar:dollar-minimalistic-bold" width={14} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </TableCell>

      <TableCell sx={{ py: 1, pr: 0 }} align="right">
        <Typography variant="body2" fontWeight={600}>
          {fCurrency(item.subtotal)}
        </Typography>
        {isAmountMode && (
          <Typography variant="caption" color="text.disabled" display="block">
            qty: {Number(item.quantity).toFixed(4)}
          </Typography>
        )}
      </TableCell>

      <TableCell sx={{ py: 1, pr: 0, pl: 0.5 }} align="right">
        <IconButton size="small" color="error" onClick={() => onRemove(item.cartId)} sx={{ p: 0.5 }}>
          <Iconify icon="eva:trash-2-outline" width={16} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// ----------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------

export function QuickDashboardView() {
  const { user } = useAuthContext();
  const { currencySymbol } = useCurrencyFormat();
  const searchRef = useRef(null);

  const storeId = getStoreIdFromStorage();

  // Today stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Recent sales
  const [recentSales, setRecentSales] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [expandedSaleId, setExpandedSaleId] = useState(null);
  const [saleItemsCache, setSaleItemsCache] = useState({});
  const [loadingSaleId, setLoadingSaleId] = useState(null);

  // Search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [rowModes, setRowModes] = useState({}); // { [cartId]: 'qty' | 'amount' }
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saleStatus, setSaleStatus] = useState('paid');
  const [creditCustomerName, setCreditCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    if (!storeId) { setStatsLoading(false); return; }
    try {
      setStatsLoading(true);
      const res = await axiosInstance.get('/api/quick-dashboard/today-stats', {
        params: { store_id: storeId },
      });
      setStats(res.data);
    } catch {
      // silently show zeros
    } finally {
      setStatsLoading(false);
    }
  }, [storeId]);

  const fetchRecent = useCallback(async () => {
    if (!storeId) { setRecentLoading(false); return; }
    try {
      setRecentLoading(true);
      const res = await axiosInstance.get('/api/quick-dashboard/recent-sales', {
        params: { store_id: storeId, limit: 8 },
      });
      setRecentSales(res.data?.sales || []);
    } catch {
      // silent
    } finally {
      setRecentLoading(false);
    }
  }, [storeId]);

  const handleSaleClick = useCallback(async (saleId) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }
    setExpandedSaleId(saleId);
    if (saleItemsCache[saleId]) return;
    try {
      setLoadingSaleId(saleId);
      const res = await axiosInstance.get(`/api/quick-dashboard/sale/${saleId}/items`);
      setSaleItemsCache((prev) => ({ ...prev, [saleId]: res.data?.items || [] }));
    } catch {
      setSaleItemsCache((prev) => ({ ...prev, [saleId]: [] }));
    } finally {
      setLoadingSaleId(null);
    }
  }, [expandedSaleId, saleItemsCache]);

  useEffect(() => {
    fetchStats();
    fetchRecent();
    // Auto-focus search on mount
    setTimeout(() => searchRef.current?.focus(), 300);
  }, [fetchStats, fetchRecent]);

  // ── Search (debounced) ─────────────────────────────────────────

  useEffect(() => {
    let timer;
    if (!query.trim() || !storeId) {
      setSearchResults([]);
    } else {
      timer = setTimeout(async () => {
        try {
          setSearching(true);
          const res = await axiosInstance.get('/api/quick-dashboard/search', {
            params: { query: query.trim(), store_id: storeId, limit: 20 },
          });
          setSearchResults(res.data?.results || []);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [query, storeId]);

  // ── Cart logic ─────────────────────────────────────────────────

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.cartId === `${item.type}-${item.id}`);
      if (existing) {
        return prev.map((c) =>
          c.cartId === existing.cartId
            ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.unit_price }
            : c
        );
      }
      return [
        ...prev,
        {
          cartId: `${item.type}-${item.id}`,
          id: item.id,
          type: item.type,
          name: item.name,
          unit_price: item.price,
          quantity: 1,
          subtotal: item.price,
          allow_variable_price: item.allow_variable_price ?? false,
          variable_price_min: item.variable_price_min ?? null,
          variable_price_max: item.variable_price_max ?? null,
        },
      ];
    });
  }, []);

  const changeQty = useCallback((cartId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.cartId !== cartId) return c;
          const newQty = c.quantity + delta;
          if (newQty < 0.01) return null;
          return { ...c, quantity: newQty, subtotal: newQty * c.unit_price };
        })
        .filter(Boolean)
    );
  }, []);

  const setQtyExact = useCallback((cartId, rawValue) => {
    const value = Number(rawValue);
    if (!value || value < 0.01) return;
    setCart((prev) =>
      prev.map((c) =>
        c.cartId === cartId ? { ...c, quantity: value, subtotal: value * c.unit_price } : c
      )
    );
  }, []);

  const changeUnitPrice = useCallback((cartId, rawValue) => {
    const input = Number(rawValue);
    if (Number.isNaN(input) || input < 0) return;
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        let price = input;
        if (c.allow_variable_price) {
          const min = c.variable_price_min;
          const max = c.variable_price_max;
          if (min != null && price < min) price = min;
          if (max != null && price > max) price = max;
        } else {
          // If variable pricing not enabled, keep original price
          price = c.unit_price;
        }
        return { ...c, unit_price: price, subtotal: price * c.quantity };
      })
    );
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
    setRowModes((prev) => {
      const next = { ...prev };
      delete next[cartId];
      return next;
    });
  }, []);

  const toggleRowMode = useCallback((cartId) => {
    setRowModes((prev) => ({
      ...prev,
      [cartId]: prev[cartId] === 'amount' ? 'qty' : 'amount',
    }));
  }, []);

  // When in 'amount' mode the user types a total; qty is back-calculated
  const setAmountExact = useCallback((cartId, rawValue) => {
    const amount = Number(rawValue);
    if (Number.isNaN(amount) || amount < 0) return;
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        if (c.unit_price <= 0) return c;
        const newQty = amount / c.unit_price;
        // Store entered amount directly so floating-point doesn't corrupt the display
        return { ...c, quantity: newQty, subtotal: amount };
      })
    );
  }, []);

  const cartTotal = cart.reduce((s, c) => s + c.subtotal, 0);

  // ── Checkout ───────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!cart.length) { toast.warning('Cart is empty.'); return; }
    if (!storeId) { toast.error('No active store selected.'); return; }
    if (saleStatus === 'credit' && !creditCustomerName.trim()) {
      toast.error('Please enter the customer name for a credit sale.');
      return;
    }
    try {
      setSubmitting(true);
      const currencyCode = localStorage.getItem('current_currency') || 'NGN';
      await axiosInstance.post('/api/quick-dashboard/sale', {
        store_id: storeId,
        items: cart.map(({ id, type, name, quantity, unit_price, subtotal }) => ({
          id, type, name, quantity, unit_price, subtotal,
        })),
        payment_method: paymentMethod,
        status: saleStatus,
        customer_name: saleStatus === 'credit' ? creditCustomerName.trim() : undefined,
        currency_code: currencyCode,
      });
      const label = saleStatus === 'credit' ? `Credit sale of ${fCurrency(cartTotal)} recorded!` : `Sale of ${fCurrency(cartTotal)} completed!`;
      toast.success(label);
      setCart([]);
      setRowModes({});
      setQuery('');
      setSearchResults([]);
      setCreditCustomerName('');
      await Promise.all([fetchStats(), fetchRecent()]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Sale failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── No store guard ─────────────────────────────────────────────

  if (!storeId) {
    return (
      <DashboardContent>
        <Alert severity="warning" sx={{ mt: 3 }}>
          No store selected. Please select an active store from the Store Dashboard first.
        </Alert>
      </DashboardContent>
    );
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <DashboardContent maxWidth="xl">
      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            ⚡ Quick Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Record a sale in under 30 seconds · {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Tooltip title="Refresh stats">
          <IconButton onClick={() => { fetchStats(); fetchRecent(); }}>
            <Iconify icon="eva:refresh-fill" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── TODAY STATS ROW ── */}
      <Grid container spacing={2} mb={3}>
        <Grid xs={6} sm={3}>
          <StatCard
            icon="solar:dollar-minimalistic-bold"
            label="Today's Revenue"
            value={fCurrency(stats?.total_revenue ?? 0)}
            color="success.main"
            loading={statsLoading}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <StatCard
            icon="solar:cart-large-bold"
            label="Transactions"
            value={stats?.total_transactions ?? 0}
            color="info.main"
            loading={statsLoading}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <StatCard
            icon="solar:star-bold"
            label="Top Item"
            value={stats?.top_item?.name ?? '—'}
            color="warning.main"
            loading={statsLoading}
          />
        </Grid>
        <Grid xs={6} sm={3}>
          <StatCard
            icon="solar:clock-circle-bold"
            label="Peak Hour"
            value={stats?.peak_hour ?? '—'}
            color="primary.main"
            loading={statsLoading}
          />
        </Grid>
      </Grid>

      {/* ── QUICK SALE + RECENT SALES ROW ── */}
      <Grid container spacing={2} alignItems="flex-start">

        {/* ── LEFT: Search & Results ── */}
        <Grid xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                Search Products &amp; Services
              </Typography>
              <TextField
                inputRef={searchRef}
                fullWidth
                size="small"
                placeholder="Type name or SKU…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searching
                        ? <CircularProgress size={16} />
                        : <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                      }
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => { setQuery(''); setSearchResults([]); }}>
                        <Iconify icon="eva:close-fill" width={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>

            <Box sx={{ p: 2, maxHeight: 420, overflowY: 'auto' }}>
              {searchResults.length === 0 && !searching && query && (
                <Box textAlign="center" py={4}>
                  <Iconify icon="eva:search-fill" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary" variant="body2">No results for &quot;{query}&quot;</Typography>
                </Box>
              )}
              {searchResults.length === 0 && !query && (
                <Box textAlign="center" py={5}>
                  <Iconify icon="solar:keyboard-bold" width={48} sx={{ color: 'text.disabled', mb: 1.5 }} />
                  <Typography color="text.secondary">
                    Start typing to search products &amp; services
                  </Typography>
                </Box>
              )}
              <Stack spacing={1}>
                {searchResults.map((item) => (
                  <ItemCard key={`${item.type}-${item.id}`} item={item} onAdd={addToCart} />
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* ── CENTER: Cart ── */}
        <Grid xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={700}>
                  Cart
                </Typography>
                <Badge badgeContent={cart.length} color="primary">
                  <Iconify icon="solar:cart-large-bold" width={22} />
                </Badge>
              </Stack>
            </Box>

            <Box sx={{ p: 2, minHeight: 200, maxHeight: 340, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <Box textAlign="center" py={5}>
                  <Iconify icon="solar:cart-plus-bold" width={48} sx={{ color: 'text.disabled', mb: 1.5 }} />
                  <Typography color="text.secondary" variant="body2">
                    Click an item to add it here
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 0, py: 0.5, fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="center" sx={{ py: 0.5, fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ pr: 0, py: 0.5, fontWeight: 700 }}>Total</TableCell>
                      <TableCell sx={{ p: 0 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <CartRow
                        key={item.cartId}
                        item={item}
                        onQtyChange={changeQty}
                        onQtyInput={setQtyExact}
                        onPriceChange={changeUnitPrice}
                        onRemove={removeFromCart}
                        inputMode={rowModes[item.cartId] || 'qty'}
                        onToggleMode={toggleRowMode}
                        onAmountInput={setAmountExact}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              {/* Total */}
              <Stack direction="row" justifyContent="space-between" mb={1.5}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="subtitle1" fontWeight={700}>{fCurrency(cartTotal)}</Typography>
              </Stack>

              {/* Payment method */}
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <MenuItem key={m} value={m} sx={{ textTransform: 'capitalize' }}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Sale status */}
              <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={saleStatus}
                  label="Status"
                  onChange={(e) => {
                    setSaleStatus(e.target.value);
                    if (e.target.value !== 'credit') setCreditCustomerName('');
                  }}
                >
                  <MenuItem value="paid">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:check-circle-bold" width={16} sx={{ color: 'success.main' }} />
                      <span>Paid</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="credit">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:clock-circle-bold" width={16} sx={{ color: 'warning.main' }} />
                      <span>Credit</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="draft">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Iconify icon="solar:document-bold" width={16} sx={{ color: 'text.secondary' }} />
                      <span>Draft</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Credit buyer name — shown only when status = credit */}
              {saleStatus === 'credit' && (
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Name *"
                  placeholder="Enter buyer's name"
                  value={creditCustomerName}
                  onChange={(e) => setCreditCustomerName(e.target.value)}
                  sx={{ mb: 1.5 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:user-bold" width={16} sx={{ color: 'warning.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  helperText="A customer record will be created or matched automatically"
                />
              )}

              {/* Checkout button */}
              <Button
                fullWidth
                size="large"
                variant="contained"
                color={saleStatus === 'credit' ? 'warning' : saleStatus === 'draft' ? 'inherit' : 'primary'}
                disabled={!cart.length || submitting || (saleStatus === 'credit' && !creditCustomerName.trim())}
                onClick={handleCheckout}
                startIcon={submitting
                  ? <CircularProgress size={16} color="inherit" />
                  : <Iconify icon={saleStatus === 'credit' ? 'solar:clock-circle-bold' : 'solar:card-recive-bold'} />
                }
                sx={{ fontWeight: 700, py: 1.5, fontSize: '1rem' }}
              >
                {submitting
                  ? 'Processing…'
                  : saleStatus === 'credit'
                    ? `Record Credit · ${fCurrency(cartTotal)}`
                    : saleStatus === 'draft'
                      ? `Save Draft · ${fCurrency(cartTotal)}`
                      : `Complete Sale · ${fCurrency(cartTotal)}`
                }
              </Button>

              {cart.length > 0 && (
                <Button
                  fullWidth
                  size="small"
                  color="inherit"
                  onClick={() => { setCart([]); setRowModes({}); }}
                  sx={{ mt: 1, color: 'text.secondary' }}
                >
                  Clear cart
                </Button>
              )}
            </Box>
          </Card>
        </Grid>

        {/* ── RIGHT: Recent Sales ── */}
        <Grid xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Recent Sales
              </Typography>
            </Box>

            <Box sx={{ maxHeight: 520, overflowY: 'auto' }}>
              {recentLoading && (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress size={28} />
                </Box>
              )}
              {!recentLoading && recentSales.length === 0 && (
                <Box textAlign="center" py={5}>
                  <Iconify icon="solar:clipboard-list-bold" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary" variant="body2">No sales yet today</Typography>
                </Box>
              )}
              {recentSales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const items = saleItemsCache[sale.id] || [];
                const isLoadingItems = loadingSaleId === sale.id;
                return (
                  <Box
                    key={sale.id}
                    sx={{
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      onClick={() => handleSaleClick(sale.id)}
                      sx={{
                        px: 2,
                        py: 1.25,
                        cursor: 'pointer',
                        userSelect: 'none',
                        '&:hover': { bgcolor: 'action.hover' },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <Stack direction="row" alignItems="flex-start" spacing={0.75}>
                        <Iconify
                          icon={isExpanded ? 'eva:chevron-down-fill' : 'eva:chevron-right-fill'}
                          width={16}
                          sx={{ mt: 0.25, color: 'text.secondary', flexShrink: 0 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
                            {sale.invoice_number}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fDateShort(sale.create_date)} · {fTime(sale.create_date)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack alignItems="flex-end" spacing={0.25}>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {fCurrency(sale.total_amount)}
                        </Typography>
                        <Chip
                          size="small"
                          label={sale.status}
                          color={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'default'}
                          sx={{ height: 18, fontSize: 10 }}
                        />
                      </Stack>
                    </Stack>

                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ px: 2, pb: 1.5, bgcolor: 'background.neutral' }}>
                        {isLoadingItems ? (
                          <Box display="flex" justifyContent="center" py={1.5}>
                            <CircularProgress size={18} />
                          </Box>
                        ) : items.length === 0 ? (
                          <Typography variant="caption" color="text.disabled" sx={{ pl: 2.5 }}>
                            No items found
                          </Typography>
                        ) : (
                          <Stack spacing={0.5} pt={0.75}>
                            {items.map((item) => (
                              <Stack
                                key={item.id}
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography variant="caption" sx={{ flex: 1 }} noWrap>
                                  {item.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mx: 1, flexShrink: 0 }}>
                                  ×{item.quantity}
                                </Typography>
                                <Typography variant="caption" fontWeight={600} sx={{ flexShrink: 0 }}>
                                  {fCurrency(item.total)}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}
            </Box>
          </Card>
        </Grid>

      </Grid>
    </DashboardContent>
  );
}
