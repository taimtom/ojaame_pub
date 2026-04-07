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
import Autocomplete from '@mui/material/Autocomplete';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { useOfflineSync } from 'src/hooks/use-offline-sync';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';
import { enqueueSale } from 'src/utils/offlineQueue';

// ── Offline product search cache (localStorage) ────────────────────────────
const SEARCH_CACHE_KEY = 'qs_search_cache';
const SEARCH_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 h

function saveSearchCache(results) {
  try {
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify({ results, ts: Date.now() }));
  } catch {
    // storage quota exceeded — skip
  }
}

function loadSearchCache() {
  try {
    const raw = localStorage.getItem(SEARCH_CACHE_KEY);
    if (!raw) return [];
    const { results, ts } = JSON.parse(raw);
    if (Date.now() - ts > SEARCH_CACHE_MAX_AGE_MS) return [];
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  }
}

function filterCacheByQuery(cachedResults, q) {
  const lower = q.toLowerCase();
  return cachedResults.filter((r) => r.name?.toLowerCase().includes(lower));
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

/** Cart line id: pack products split unit vs pack mode so lines do not merge incorrectly. */
function cartIdForSearchItem(item, packMode = 'unit') {
  if (item.type === 'product' && item.is_pack) {
    return `${item.type}-${item.id}-${packMode}`;
  }
  return `${item.type}-${item.id}`;
}

/** Normalize API fields (snake_case vs camelCase) so pack UI always works. */
function normalizeQuickSearchProduct(item) {
  if (!item || item.type !== 'product') return item;
  const isPack = Boolean(item.is_pack ?? item.isPack);
  const qpp = item.quantity_per_pack ?? item.quantityPerPack ?? null;
  return {
    ...item,
    is_pack: isPack,
    quantity_per_pack: qpp,
    cost_price_per_pack: item.cost_price_per_pack ?? item.costPricePerPack ?? null,
    pack_sell_price: item.pack_sell_price ?? item.packSellPrice ?? null,
  };
}

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
            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                {fCurrency(item.price)}
                {item.is_pack && item.quantity_per_pack ? ` /item` : ''}
              </Typography>
              {item.is_pack && (
                <Chip
                  size="small"
                  label={`Pack ×${item.quantity_per_pack}`}
                  variant="outlined"
                  sx={{ height: 18, fontSize: 10 }}
                />
              )}
              {item.is_pack && item.pack_sell_price != null && (
                <Typography variant="caption" sx={{ color: 'primary.main' }} noWrap>
                  Pack {fCurrency(item.pack_sell_price)}
                </Typography>
              )}
            </Stack>
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

function CartRow({
  item,
  onQtyChange,
  onQtyInput,
  onVariablePriceCommit,
  onVariablePriceFocus,
  onVariablePriceBlur,
  onRemove,
  inputMode,
  onToggleMode,
  onAmountInput,
  onTogglePackSaleMode,
  onPackPriceCommit,
}) {
  const { currencySymbol } = useCurrencyFormat();
  const isAmountMode = inputMode === 'amount';
  const isPackLine = Boolean(item.is_pack && item.pack_sale_mode === 'pack');

  // Variable price: keep a draft while typing so we don't clamp min/max on every keystroke.
  const [priceDraft, setPriceDraft] = useState(() => String(item.unit_price ?? ''));
  const [priceFocused, setPriceFocused] = useState(false);

  // Pack price (per whole pack) draft when in pack sale mode
  const [packPriceDraft, setPackPriceDraft] = useState(() => String(item.unit_price ?? ''));
  const [packPriceFocused, setPackPriceFocused] = useState(false);

  // Keep a raw string for the amount field while the user is actively typing.
  // This prevents React from replacing the input with float-precision noise
  // (e.g. "30.000000000000004") on every keystroke.
  const [amountDraft, setAmountDraft] = useState('');
  const [amountFocused, setAmountFocused] = useState(false);

  useEffect(() => {
    if (!priceFocused) {
      setPriceDraft(String(item.unit_price ?? ''));
    }
  }, [item.unit_price, item.cartId, priceFocused]);

  useEffect(() => {
    if (!packPriceFocused) {
      setPackPriceDraft(String(item.unit_price ?? ''));
    }
  }, [item.unit_price, item.cartId, packPriceFocused]);

  const handleAmountFocus = () => {
    const clean = item.subtotal != null ? parseFloat(item.subtotal.toFixed(2)) : 0;
    setAmountDraft(clean === 0 ? '' : String(clean));
    setAmountFocused(true);
  };

  const handleAmountChange = (e) => {
    setAmountDraft(e.target.value);
    onAmountInput?.(item.cartId, e.target.value);
  };

  const handleAmountBlur = () => {
    setAmountFocused(false);
  };

  const packPriceError =
    isPackLine &&
    item.cost_price_per_pack != null &&
    item.unit_price < item.cost_price_per_pack;

  return (
    <>
      {/* ── Main row: name | qty stepper | total | delete ── */}
      <TableRow>
        <TableCell sx={{ py: 0.5, pl: 0, pr: 0.5, verticalAlign: 'middle' }}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 120 }}>
            {item.name}
          </Typography>
          {/* Fixed price caption (non-variable, non-pack-mode) */}
          {!item.allow_variable_price && !isPackLine && (
            <Typography variant="caption" color="text.secondary">
              {currencySymbol}{item.unit_price.toLocaleString()}
              {item.is_pack ? ' /item' : ''}
            </Typography>
          )}
          {/* Variable price input */}
          {item.allow_variable_price && !isPackLine && (
            <TextField
              value={priceFocused ? priceDraft : String(item.unit_price ?? '')}
              onFocus={() => {
                setPriceDraft(String(item.unit_price ?? ''));
                setPriceFocused(true);
                onVariablePriceFocus?.(item.cartId);
              }}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={() => {
                setPriceFocused(false);
                const raw = priceDraft.trim();
                if (raw !== '') onVariablePriceCommit?.(item.cartId, raw);
                onVariablePriceBlur?.();
              }}
              type="text"
              inputMode="decimal"
              variant="outlined"
              size="small"
              sx={{ mt: 0.25, width: 100 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ typography: 'caption', color: 'text.disabled' }}>{currencySymbol}</Box>
                  </InputAdornment>
                ),
              }}
              error={
                (item.variable_price_min != null && item.unit_price < item.variable_price_min) ||
                (item.variable_price_max != null && item.unit_price > item.variable_price_max)
              }
              helperText={
                item.variable_price_min != null && item.variable_price_max != null
                  ? `${currencySymbol}${item.variable_price_min}–${currencySymbol}${item.variable_price_max}`
                  : 'Variable'
              }
            />
          )}
        </TableCell>

        <TableCell sx={{ py: 0.5 }} align="center">
          {isAmountMode ? (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <TextField
                value={amountFocused ? amountDraft : (item.subtotal ? parseFloat(item.subtotal.toFixed(2)) : '')}
                onFocus={handleAmountFocus}
                onBlur={handleAmountBlur}
                onChange={handleAmountChange}
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
                inputProps={{ step: 1, min: 0, style: { textAlign: 'center', width: 56 } }}
              />
              <Tooltip title="Switch to quantity mode">
                <IconButton size="small" onClick={() => onToggleMode?.(item.cartId)} sx={{ p: 0.25, color: 'primary.main' }}>
                  <Iconify icon="solar:hashtag-bold" width={14} />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <IconButton size="small" onClick={() => onQtyChange(item.cartId, -1)} sx={{ p: 0.25 }}>
                <Iconify icon="eva:minus-fill" width={14} />
              </IconButton>
              <TextField
                value={item.quantity}
                onChange={(e) => onQtyInput?.(item.cartId, e.target.value)}
                type="number"
                variant="outlined"
                size="small"
                inputProps={{ step: 0.01, min: 0.01, style: { textAlign: 'center', width: 38 } }}
              />
              <IconButton size="small" onClick={() => onQtyChange(item.cartId, 1)} sx={{ p: 0.25 }}>
                <Iconify icon="eva:plus-fill" width={14} />
              </IconButton>
              <Tooltip title="Enter total amount instead">
                <IconButton size="small" onClick={() => onToggleMode?.(item.cartId)} sx={{ p: 0.25, color: 'text.secondary' }}>
                  <Iconify icon="solar:dollar-minimalistic-bold" width={14} />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
          {isPackLine && (
            <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', textAlign: 'center' }}>
              {item.quantity} pack{item.quantity !== 1 ? 's' : ''}
            </Typography>
          )}
        </TableCell>

        <TableCell sx={{ py: 0.5, pr: 0 }} align="right">
          <Typography variant="body2" fontWeight={600}>
            {fCurrency(item.subtotal)}
          </Typography>
          {isAmountMode && (
            <Typography variant="caption" color="text.disabled" display="block">
              qty: {Number(item.quantity).toFixed(2)}
            </Typography>
          )}
        </TableCell>

        <TableCell sx={{ py: 0.5, pr: 0, pl: 0.25 }} align="right">
          <IconButton size="small" color="error" onClick={() => onRemove(item.cartId)} sx={{ p: 0.5 }}>
            <Iconify icon="eva:trash-2-outline" width={16} />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* ── Pack toggle row — only for pack products ── */}
      {item.is_pack && (
        <TableRow sx={{ '& td': { border: 0, pt: 0, pb: 0.75 } }}>
          <TableCell colSpan={4} sx={{ pl: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              {/* Single ↔ Pack toggle */}
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={isPackLine}
                    onChange={() => onTogglePackSaleMode?.(item.cartId)}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="caption" sx={{ color: isPackLine ? 'primary.main' : 'text.secondary' }}>
                    {isPackLine ? `Sell by pack (×${item.quantity_per_pack})` : 'Sell by item'}
                  </Typography>
                }
              />

              {/* Pack price input — visible only in pack mode */}
              {isPackLine && (
                <TextField
                  value={packPriceFocused ? packPriceDraft : String(item.unit_price ?? '')}
                  onFocus={() => {
                    setPackPriceDraft(String(item.unit_price ?? ''));
                    setPackPriceFocused(true);
                    onVariablePriceFocus?.(item.cartId);
                  }}
                  onChange={(e) => setPackPriceDraft(e.target.value)}
                  onBlur={() => {
                    setPackPriceFocused(false);
                    const raw = packPriceDraft.trim();
                    if (raw !== '') onPackPriceCommit?.(item.cartId, raw);
                    onVariablePriceBlur?.();
                  }}
                  type="text"
                  inputMode="decimal"
                  variant="outlined"
                  size="small"
                  placeholder="Pack price"
                  sx={{ width: 150 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ typography: 'caption', color: 'text.disabled' }}>{currencySymbol}</Box>
                      </InputAdornment>
                    ),
                  }}
                  error={packPriceError}
                  helperText={
                    item.cost_price_per_pack != null
                      ? `Min ${currencySymbol}${item.cost_price_per_pack}`
                      : 'Whole pack price'
                  }
                />
              )}
            </Stack>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// Main view
// ----------------------------------------------------------------------

export function QuickDashboardView() {
  const { currencySymbol } = useCurrencyFormat();
  const searchRef = useRef(null);

  const [storeId, setStoreId] = useState(() => getStoreIdFromStorage());

  // ── Offline sync ───────────────────────────────────────────────
  const {
    isOnline,
    pendingCount,
    isSyncing,
    syncErrors,
    discardError,
    refreshCount: refreshOfflineCount,
  } = useOfflineSync({
    onSyncComplete: (count) => {
      toast.success(`${count} offline sale${count === 1 ? '' : 's'} synced successfully!`);
    },
  });

  const [showSyncErrors, setShowSyncErrors] = useState(false);

  // Keep store in sync when workspace changes (other tabs, focus, or same-tab localStorage updates)
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
  /** Block checkout while a variable price field is focused (draft not yet committed). */
  const [variablePriceFocusCartId, setVariablePriceFocusCartId] = useState(null);

  // Optional customer (walk-in when unset — omit customer_id on submit)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInput, setCustomerInput] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

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

  // Clear picked customer when active store changes
  useEffect(() => {
    setSelectedCustomer(null);
    setCustomerInput('');
    setCustomerOptions([]);
  }, [storeId]);

  // Customer picker — debounced search (empty q loads up to limit for dropdown)
  useEffect(() => {
    if (!storeId) return undefined;
    const t = setTimeout(async () => {
      try {
        setCustomerSearchLoading(true);
        const res = await axiosInstance.get('/api/quick-dashboard/customers', {
          params: {
            store_id: storeId,
            ...(customerInput.trim() ? { q: customerInput.trim() } : {}),
            limit: 50,
          },
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        setCustomerOptions(rows);
      } catch {
        setCustomerOptions([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerInput, storeId]);

  // ── Search (debounced, with offline cache fallback) ────────────

  useEffect(() => {
    let timer;
    if (!query.trim() || !storeId) {
      setSearchResults([]);
    } else if (!isOnline) {
      // Offline — filter cached products locally
      const cached = loadSearchCache();
      const filtered = filterCacheByQuery(cached, query.trim());
      setSearchResults(filtered.map(normalizeQuickSearchProduct));
    } else {
      timer = setTimeout(async () => {
        try {
          setSearching(true);
          const res = await axiosInstance.get('/api/quick-dashboard/search', {
            params: { query: query.trim(), store_id: storeId, limit: 20 },
          });
          const raw = res.data?.results || [];
          const normalized = raw.map(normalizeQuickSearchProduct);
          // Merge new results into cache (deduplicate by type+id)
          const existing = loadSearchCache();
          const existingMap = new Map(existing.map((r) => [`${r.type}-${r.id}`, r]));
          raw.forEach((r) => existingMap.set(`${r.type}-${r.id}`, r));
          saveSearchCache(Array.from(existingMap.values()));
          setSearchResults(normalized);
        } catch {
          // On network error, fall back to cached results
          const cached = loadSearchCache();
          const filtered = filterCacheByQuery(cached, query.trim());
          setSearchResults(filtered.map(normalizeQuickSearchProduct));
        } finally {
          setSearching(false);
        }
      }, 300);
    }
    return () => clearTimeout(timer);
  }, [query, storeId, isOnline]);

  // ── Cart logic ─────────────────────────────────────────────────

  const addToCart = useCallback((item) => {
    const row = normalizeQuickSearchProduct(item);
    setCart((prev) => {
      const lineId = cartIdForSearchItem(row, 'unit');
      const existing = prev.find((c) => c.cartId === lineId);
      if (existing) {
        const isPackSale = existing.is_pack && existing.pack_sale_mode === 'pack';
        const qpp = existing.quantity_per_pack || 1;
        const maxPacks =
          existing.stock != null && qpp > 0 ? Math.floor(existing.stock / qpp) : Infinity;
        const maxQty = isPackSale
          ? maxPacks
          : existing.stock != null
            ? existing.stock
            : Infinity;
        if (existing.quantity >= maxQty) return prev;
        const newQty = Math.min(existing.quantity + 1, maxQty);
        return prev.map((c) =>
          c.cartId === existing.cartId
            ? { ...c, quantity: newQty, subtotal: newQty * c.unit_price }
            : c
        );
      }
      return [
        ...prev,
        {
          cartId: lineId,
          id: row.id,
          type: row.type,
          name: row.name,
          unit_price: row.price,
          quantity: 1,
          subtotal: row.price,
          stock: row.stock ?? null,
          cost_price: row.cost_price ?? null,
          allow_variable_price: row.allow_variable_price ?? false,
          variable_price_min: row.variable_price_min ?? null,
          variable_price_max: row.variable_price_max ?? null,
          is_pack: Boolean(row.is_pack),
          quantity_per_pack: row.quantity_per_pack ?? null,
          cost_price_per_pack: row.cost_price_per_pack ?? null,
          pack_sell_price: row.pack_sell_price ?? null,
          pack_sale_mode: 'unit',
          base_unit_price: row.price,
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
          const isPackSale = c.is_pack && c.pack_sale_mode === 'pack';
          const qpp = c.quantity_per_pack || 1;
          const maxPacks =
            c.stock != null && qpp > 0 ? Math.floor(c.stock / qpp) : Infinity;
          const maxQty = isPackSale
            ? maxPacks
            : c.stock != null
              ? c.stock
              : Infinity;
          const clampedQty = Math.min(newQty, maxQty);
          return { ...c, quantity: clampedQty, subtotal: clampedQty * c.unit_price };
        })
        .filter(Boolean)
    );
  }, []);

  const setQtyExact = useCallback((cartId, rawValue) => {
    const value = Number(rawValue);
    if (!value || value < 0.01) return;
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        const isPackSale = c.is_pack && c.pack_sale_mode === 'pack';
        const qpp = c.quantity_per_pack || 1;
        const maxPacks =
          c.stock != null && qpp > 0 ? Math.floor(c.stock / qpp) : Infinity;
        const maxQty = isPackSale
          ? maxPacks
          : c.stock != null
            ? c.stock
            : Infinity;
        const clampedQty = Math.min(value, maxQty);
        return { ...c, quantity: clampedQty, subtotal: clampedQty * c.unit_price };
      })
    );
  }, []);

  /** Committed on blur for variable-priced lines — does not clamp to min/max (validation disables checkout). */
  const commitPackPriceCommit = useCallback(
    (cartId, rawValue) => {
      const input = Number.parseFloat(String(rawValue).replace(',', '.'));
      if (!Number.isFinite(input) || input < 0) {
        toast.error('Enter a valid pack price.');
        return;
      }
      setCart((prev) =>
        prev.map((c) => {
          if (c.cartId !== cartId) return c;
          if (c.pack_sale_mode !== 'pack') return c;
          const cpp = Number(c.cost_price_per_pack ?? 0);
          if (cpp > 0 && input < cpp) {
            toast.error(
              `Pack price cannot be lower than cost per pack (${currencySymbol}${cpp}).`
            );
            return c;
          }
          const rounded = Math.round(input * 100) / 100;
          return { ...c, unit_price: rounded, subtotal: rounded * c.quantity };
        })
      );
    },
    [currencySymbol]
  );

  const togglePackSaleMode = useCallback((cartId) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        if (!c.is_pack || !c.quantity_per_pack) return c;
        if (c.pack_sale_mode === 'unit') {
          const qpp = c.quantity_per_pack;
          const raw =
            c.pack_sell_price != null && String(c.pack_sell_price).trim() !== ''
              ? Number(c.pack_sell_price)
              : NaN;
          const defaultPack =
            Number.isFinite(raw) && raw > 0 ? raw : qpp * c.base_unit_price;
          const packPrice = Math.round(defaultPack * 100) / 100;
          const packs = Math.max(1, Math.floor(Number(c.quantity) / qpp) || 1);
          const maxPacks = c.stock != null ? Math.floor(c.stock / qpp) : Infinity;
          const clampedPacks = Math.min(packs, maxPacks);
          return {
            ...c,
            cartId: `${c.type}-${c.id}-pack`,
            pack_sale_mode: 'pack',
            quantity: clampedPacks,
            unit_price: packPrice,
            subtotal: clampedPacks * packPrice,
          };
        }
        const qpp = c.quantity_per_pack;
        const units = Math.min(
          Math.round(c.quantity) * qpp,
          c.stock != null ? c.stock : Infinity
        );
        const up = Math.round(c.base_unit_price * 100) / 100;
        const u = Math.max(1, units);
        return {
          ...c,
          cartId: `${c.type}-${c.id}-unit`,
          pack_sale_mode: 'unit',
          quantity: u,
          unit_price: up,
          subtotal: u * up,
        };
      })
    );
    setRowModes((prev) => {
      const next = { ...prev };
      delete next[cartId];
      return next;
    });
  }, []);

  const commitVariableUnitPrice = useCallback((cartId, rawValue) => {
    const input = Number.parseFloat(String(rawValue).replace(',', '.'));
    if (!Number.isFinite(input) || input < 0) {
      toast.error('Enter a valid price.');
      return;
    }
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        if (!c.allow_variable_price) return c;
        const price = input;
        const cp = Number(c.cost_price ?? 0);
        if (cp > 0 && price < cp) {
          toast.error(
            `Price cannot be lower than cost (${currencySymbol}${cp}). Keeping previous price.`
          );
          return c;
        }
        const rounded = Math.round(price * 100) / 100;
        return { ...c, unit_price: rounded, subtotal: rounded * c.quantity };
      })
    );
  }, [currencySymbol]);

  const removeFromCart = useCallback((cartId) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
    setVariablePriceFocusCartId((id) => (id === cartId ? null : id));
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
        const isPackSale = c.is_pack && c.pack_sale_mode === 'pack';
        const qpp = c.quantity_per_pack || 1;
        const maxPacks =
          c.stock != null && qpp > 0 ? Math.floor(c.stock / qpp) : Infinity;
        const maxQty = isPackSale
          ? maxPacks
          : c.stock != null
            ? c.stock
            : Infinity;
        const clampedQty = Math.min(newQty, maxQty);
        // Round to 2 decimal places to prevent IEEE-754 noise (e.g. 30.000000000000004)
        const clampedAmount = parseFloat((clampedQty * c.unit_price).toFixed(2));
        const roundedQty = parseFloat(clampedQty.toFixed(6));
        return { ...c, quantity: roundedQty, subtotal: clampedAmount };
      })
    );
  }, []);

  const cartTotal = cart.reduce((s, c) => s + c.subtotal, 0);

  const cartHasInvalidVariablePrice = cart.some((c) => {
    if (!c.allow_variable_price) return false;
    const { unit_price: p, variable_price_min: min, variable_price_max: max } = c;
    if (min != null && p < min) return true;
    if (max != null && p > max) return true;
    return false;
  });

  const cartHasInvalidPackPrice = cart.some((c) => {
    if (!c.is_pack || c.pack_sale_mode !== 'pack') return false;
    const cpp = c.cost_price_per_pack;
    return cpp != null && c.unit_price < cpp;
  });

  const checkoutBlockedByVariablePrice =
    cartHasInvalidVariablePrice || cartHasInvalidPackPrice || variablePriceFocusCartId != null;

  // ── Checkout ───────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (!cart.length) { toast.warning('Cart is empty.'); return; }
    if (checkoutBlockedByVariablePrice) {
      if (variablePriceFocusCartId != null) {
        toast.error('Finish editing the price field (click outside or press Tab) before completing the sale.');
      } else if (cartHasInvalidPackPrice) {
        toast.error('Set every pack price at or above cost per pack before completing the sale.');
      } else {
        toast.error('Set every variable price within its allowed range before completing the sale.');
      }
      return;
    }
    if (!storeId) { toast.error('No active store selected.'); return; }
    const hasCreditIdentity = Boolean(selectedCustomer?.id) || Boolean(creditCustomerName.trim());
    if (saleStatus === 'credit' && !hasCreditIdentity) {
      toast.error('Select a customer or enter a customer name for a credit sale.');
      return;
    }
    try {
      setSubmitting(true);
      const currencyCode = localStorage.getItem('current_currency') || 'NGN';
      const payload = {
        store_id: storeId,
        items: cart.map((c) => {
          const {
            id,
            type,
            name,
            quantity,
            unit_price: up,
            subtotal: st,
            is_pack: isPack,
            pack_sale_mode: psm,
            quantity_per_pack: qpp,
          } = c;
          if (type === 'product' && isPack && psm === 'pack' && qpp > 0) {
            const unitQty = quantity * qpp;
            const effective = unitQty > 0 ? st / unitQty : 0;
            const round6 = Math.round(effective * 1e6) / 1e6;
            return {
              id,
              type,
              name,
              quantity: unitQty,
              unit_price: round6,
              subtotal: st,
            };
          }
          return {
            id,
            type,
            name,
            quantity,
            unit_price: up,
            subtotal: st,
          };
        }),
        payment_method: paymentMethod,
        status: saleStatus,
        currency_code: currencyCode,
      };
      if (selectedCustomer?.id) {
        payload.customer_id = selectedCustomer.id;
      } else if (saleStatus === 'credit' && creditCustomerName.trim()) {
        payload.customer_name = creditCustomerName.trim();
      }

      if (!isOnline) {
        // Network is down — save to offline queue
        await enqueueSale(payload);
        await refreshOfflineCount();
        const offlineLabel =
          saleStatus === 'credit'
            ? `Credit sale of ${fCurrency(cartTotal)} saved offline — will sync when connected.`
            : `Sale of ${fCurrency(cartTotal)} saved offline — will sync when connected.`;
        toast.warning(offlineLabel);
      } else {
        try {
          await axiosInstance.post('/api/quick-dashboard/sale', payload);
          const label =
            saleStatus === 'credit'
              ? `Credit sale of ${fCurrency(cartTotal)} recorded!`
              : `Sale of ${fCurrency(cartTotal)} completed!`;
          toast.success(label);
          await Promise.all([fetchStats(), fetchRecent()]);
        } catch (networkErr) {
          // Request failed despite navigator.onLine — could be server issue or spotty signal
          const isNetworkFailure =
            !networkErr?.response || networkErr?.code === 'ERR_NETWORK' || networkErr?.code === 'ECONNABORTED';
          if (isNetworkFailure) {
            await enqueueSale(payload);
            await refreshOfflineCount();
            toast.warning(
              `Couldn't reach server. Sale of ${fCurrency(cartTotal)} saved offline — will sync when connected.`
            );
          } else {
            toast.error(networkErr?.response?.data?.detail || 'Sale failed. Please try again.');
            setSubmitting(false);
            return;
          }
        }
      }

      // Clear cart regardless of online/offline path
      setCart([]);
      setVariablePriceFocusCartId(null);
      setRowModes({});
      setQuery('');
      setSearchResults([]);
      setCreditCustomerName('');
      setSelectedCustomer(null);
      setCustomerInput('');
      setCustomerOptions([]);
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
      {/* ── Offline / sync status banner ── */}
      {(!isOnline || pendingCount > 0 || syncErrors.length > 0) && (
        <Box mb={2}>
          {!isOnline && (
            <Alert
              severity="warning"
              icon={<Iconify icon="solar:wifi-router-bold" width={20} />}
              sx={{ mb: pendingCount > 0 || syncErrors.length > 0 ? 1 : 0 }}
            >
              You are offline. Sales will be saved on this device and synced automatically when you reconnect.
              {pendingCount > 0 && (
                <Typography component="span" variant="body2" fontWeight={700} sx={{ ml: 0.5 }}>
                  ({pendingCount} waiting)
                </Typography>
              )}
            </Alert>
          )}

          {isOnline && isSyncing && (
            <Alert
              severity="info"
              icon={<CircularProgress size={16} color="inherit" />}
              sx={{ mb: pendingCount > 0 ? 1 : 0 }}
            >
              Syncing {pendingCount} offline sale{pendingCount === 1 ? '' : 's'}…
            </Alert>
          )}

          {isOnline && !isSyncing && pendingCount > 0 && (
            <Alert severity="info" sx={{ mb: syncErrors.length > 0 ? 1 : 0 }}>
              {pendingCount} sale{pendingCount === 1 ? '' : 's'} pending sync.
            </Alert>
          )}

          {syncErrors.length > 0 && (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => setShowSyncErrors((p) => !p)}
                >
                  {showSyncErrors ? 'Hide' : 'Show'} ({syncErrors.length})
                </Button>
              }
            >
              {syncErrors.length} sale{syncErrors.length === 1 ? '' : 's'} could not sync after multiple attempts.
            </Alert>
          )}

          {showSyncErrors && syncErrors.length > 0 && (
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.neutral',
                border: '1px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography variant="subtitle2" mb={1}>
                Failed sales — review and discard if needed
              </Typography>
              <Stack spacing={1}>
                {syncErrors.map((rec) => (
                  <Stack
                    key={rec.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1, borderRadius: 1, bgcolor: 'background.paper' }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {rec.payload?.items?.length ?? 0} item(s) · {fCurrency(
                          rec.payload?.items?.reduce((s, it) => s + (it.subtotal || 0), 0) ?? 0
                        )}
                      </Typography>
                      <Typography variant="caption" color="error">
                        {rec.lastError}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Saved {new Date(rec.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Tooltip title="Discard this sale from the queue">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => discardError(rec.id)}
                      >
                        <Iconify icon="eva:trash-2-fill" width={16} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}

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

            <Box sx={{ p: 2, minHeight: 200, maxHeight: 400, overflowY: 'auto' }}>
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
                      <TableCell sx={{ pl: 0, py: 0.5, fontWeight: 700, width: '35%' }}>Item</TableCell>
                      <TableCell align="center" sx={{ py: 0.5, fontWeight: 700, width: '35%' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ pr: 0, py: 0.5, fontWeight: 700, width: '22%' }}>Total</TableCell>
                      <TableCell sx={{ p: 0, width: '8%' }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.map((item) => (
                      <CartRow
                        key={item.cartId}
                        item={item}
                        onQtyChange={changeQty}
                        onQtyInput={setQtyExact}
                        onVariablePriceCommit={commitVariableUnitPrice}
                        onVariablePriceFocus={setVariablePriceFocusCartId}
                        onVariablePriceBlur={() => setVariablePriceFocusCartId(null)}
                        onRemove={removeFromCart}
                        inputMode={rowModes[item.cartId] || 'qty'}
                        onToggleMode={toggleRowMode}
                        onAmountInput={setAmountExact}
                        onTogglePackSaleMode={togglePackSaleMode}
                        onPackPriceCommit={commitPackPriceCommit}
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

              {/* Customer (optional) — walk-in when cleared */}
              <Autocomplete
                fullWidth
                size="small"
                sx={{ mb: 1.5 }}
                options={customerOptions}
                loading={customerSearchLoading}
                value={selectedCustomer}
                onChange={(e, newValue) => {
                  setSelectedCustomer(newValue);
                  setCustomerInput(
                    newValue
                      ? `${newValue.name}${newValue.phone_number ? ` · ${newValue.phone_number}` : ''}`
                      : ''
                  );
                }}
                inputValue={customerInput}
                onInputChange={(e, newInputValue, reason) => {
                  if (reason === 'clear') {
                    setSelectedCustomer(null);
                    setCustomerInput('');
                    return;
                  }
                  if (reason === 'input') {
                    setCustomerInput(newInputValue);
                    if (selectedCustomer) {
                      const label = `${selectedCustomer.name}${
                        selectedCustomer.phone_number ? ` · ${selectedCustomer.phone_number}` : ''
                      }`;
                      if (newInputValue !== label) {
                        setSelectedCustomer(null);
                      }
                    }
                  } else if (reason === 'reset') {
                    setCustomerInput(newInputValue);
                  }
                }}
                getOptionLabel={(option) =>
                  option ? `${option.name}${option.phone_number ? ` · ${option.phone_number}` : ''}` : ''
                }
                isOptionEqualToValue={(a, b) => a?.id === b?.id}
                filterOptions={(opts) => opts}
                noOptionsText={customerSearchLoading ? 'Searching…' : 'No customers'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Customer"
                    placeholder="Walk-in — search to attach a customer"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {customerSearchLoading ? (
                            <CircularProgress color="inherit" size={16} sx={{ mr: 0.5 }} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

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

              {/* Credit buyer name — when not using customer picker above */}
              {saleStatus === 'credit' && !selectedCustomer?.id && (
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
                  helperText="Or pick a customer above. A new name will be matched or created."
                />
              )}

              {/* Checkout button */}
              <Button
                fullWidth
                size="large"
                variant="contained"
                color={saleStatus === 'credit' ? 'warning' : saleStatus === 'draft' ? 'inherit' : 'primary'}
                disabled={
                  !cart.length
                  || submitting
                  || checkoutBlockedByVariablePrice
                  || (saleStatus === 'credit'
                    && !selectedCustomer?.id
                    && !creditCustomerName.trim())
                }
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
                  onClick={() => {
                    setCart([]);
                    setVariablePriceFocusCartId(null);
                    setRowModes({});
                    setSelectedCustomer(null);
                    setCustomerInput('');
                  }}
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
