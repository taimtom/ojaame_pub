import { useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
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
import { Html5Qrcode } from 'html5-qrcode';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { useOfflineSync } from 'src/hooks/use-offline-sync';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';
import { enqueueSale } from 'src/utils/offlineQueue';
import { addPaymentToSale } from 'src/actions/sale';
import { addCustomer } from 'src/actions/customer';
import { useOnboardingProgress } from 'src/actions/onboarding';
import { useGetPaymentMethods } from 'src/actions/paymentmethod';
import { OnboardingSetupShell } from 'src/components/onboarding/onboarding-setup-shell';
import { useAdvanceOnboarding, useOnboardingMode } from 'src/hooks/use-onboarding-mode';
import {
  QuickDashboardPayments,
  sumPaymentLines,
} from 'src/sections/quick-dashboard/quick-dashboard-payments';
import { normalizeReceiptFromSale } from 'src/utils/escpos/receipt-from-sale';
import { getPreferredReceiptFormat } from 'src/utils/receipt-preferences';
import {
  autoPrintSaleReceipt,
  getPrintResultMessage,
  printReceipt,
} from 'src/utils/print-receipt';
import { ReceiptShareDialog } from 'src/components/receipt/receipt-share-dialog';
import { ReceiptOutputFlowDialogs } from 'src/components/receipt/receipt-output-flow-dialogs';
import { useReceiptOutputFlow } from 'src/hooks/use-receipt-output-flow';

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
  const spaceless = lower.replace(/\s+/g, '');        // "5 alive" → "5alive"
  const tokens = lower.split(/\s+/).filter(Boolean);  // ["5", "alive"]

  return cachedResults.filter((r) => {
    const name = r.name?.toLowerCase() || '';
    const sku  = r.sku?.toLowerCase()  || '';
    const code = r.code?.toLowerCase() || '';

    // Exact phrase match
    if (name.includes(lower) || sku.includes(lower) || code.includes(lower)) return true;
    // Spaceless variant: catches "5alive" ↔ "5 alive"
    const nameSpaceless = name.replace(/\s+/g, '');
    if (spaceless && nameSpaceless.includes(spaceless)) return true;
    // All tokens present anywhere in the name (order-independent partial match)
    if (tokens.length > 1 && tokens.every((t) => name.includes(t))) return true;
    return false;
  });
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

/** Variable price bounds for a cart line — scaled to whole-pack when selling by pack. */
function variablePriceBoundsForCartLine(c) {
  const { variable_price_min: min, variable_price_max: max } = c;
  const isPackSale = c.is_pack && c.pack_sale_mode === 'pack';
  const qpp = c.quantity_per_pack || 1;
  if (isPackSale) {
    return {
      min: min != null ? min * qpp : null,
      max: max != null ? max * qpp : null,
    };
  }
  return { min, max };
}

function isCartLineVariablePriceInvalid(c) {
  if (!c.allow_variable_price) return false;
  const { unit_price: p } = c;
  const { min, max } = variablePriceBoundsForCartLine(c);
  if (min != null && p < min) return true;
  if (max != null && p > max) return true;
  return false;
}

function isCartLinePackPriceBelowCost(c) {
  if (!c.is_pack || c.pack_sale_mode !== 'pack') return false;
  const cpp = c.cost_price_per_pack;
  return cpp != null && c.unit_price < cpp;
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

const LAGOS_TZ = 'Africa/Lagos';

function fTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: LAGOS_TZ,
  });
}

function fDateShort(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    timeZone: LAGOS_TZ,
  });
}

function defaultPaymentLine(cartTotal, paymentMethods) {
  return {
    payment_method_id: paymentMethods[0]?.id ?? '',
    amount: cartTotal,
  };
}

/** Map quick-dashboard or sales-detail line item into a cart row (null if not loadable). */
function mapSaleItemToCartLine(it) {
  const productId = it.product_id != null ? Number(it.product_id) : null;
  const serviceId = it.service_id != null ? Number(it.service_id) : null;
  let lineType = it.type;
  if (!lineType || lineType === 'other') {
    if (productId != null) lineType = 'product';
    else if (serviceId != null) lineType = 'service';
  }
  const entityId =
    productId
    ?? serviceId
    ?? (it.entity_id != null ? Number(it.entity_id) : null);
  if (lineType !== 'product' && lineType !== 'service') return null;
  if (entityId == null) return null;

  const qty = Number(it.quantity) || 1;
  const unitPrice = Number(it.unit_price ?? it.price) || 0;
  const st = Number(it.subtotal ?? it.total) || qty * unitPrice;
  const cartId = cartIdForSearchItem(
    { type: lineType, id: entityId, is_pack: false },
    'unit'
  );
  const name =
    it.name
    || it.product_name
    || it.service_name
    || it.description
    || 'Item';

  return {
    cartId,
    id: entityId,
    type: lineType,
    name,
    unit_price: unitPrice,
    quantity: qty,
    subtotal: st,
    stock: null,
    cost_price: null,
    allow_variable_price: false,
    variable_price_min: null,
    variable_price_max: null,
    is_pack: false,
    quantity_per_pack: null,
    cost_price_per_pack: null,
    pack_sell_price: null,
    pack_sale_mode: 'unit',
    base_unit_price: unitPrice,
  };
}

function maxAllowedQtyForCartLine(line) {
  if (!line || line.type !== 'product') return Infinity;
  const isPackSale = Boolean(line.is_pack && line.pack_sale_mode === 'pack');
  const qpp = Number(line.quantity_per_pack) || 1;
  const maxPacks =
    line.stock != null && qpp > 0 ? Math.floor(Number(line.stock) / qpp) : Infinity;
  return isPackSale
    ? maxPacks
    : line.stock != null
      ? Number(line.stock)
      : Infinity;
}

async function hydrateDraftCartLinesWithLiveStock(storeId, cartLines) {
  if (!storeId || !Array.isArray(cartLines) || !cartLines.length) return cartLines;
  const productLines = cartLines.filter((line) => line.type === 'product');
  if (!productLines.length) return cartLines;

  try {
    const hydratedById = new Map();
    await Promise.all(
      productLines.map(async (line) => {
        const query = String(line.name || '').trim();
        if (!query) return;
        const res = await axiosInstance.get('/api/quick-dashboard/search', {
          params: { store_id: storeId, query, limit: 20 },
        });
        const match = (res.data?.results || []).find(
          (r) => r?.type === 'product' && Number(r.id) === Number(line.id)
        );
        if (match) hydratedById.set(Number(line.id), normalizeQuickSearchProduct(match));
      })
    );

    return cartLines.map((line) => {
      if (line.type !== 'product') return line;
      const live = hydratedById.get(Number(line.id));
      if (!live) return line;
      return {
        ...line,
        stock: live.stock ?? line.stock,
        cost_price: live.cost_price ?? line.cost_price,
        allow_variable_price: live.allow_variable_price ?? line.allow_variable_price,
        variable_price_min: live.variable_price_min ?? line.variable_price_min,
        variable_price_max: live.variable_price_max ?? line.variable_price_max,
        is_pack: live.is_pack ?? line.is_pack,
        quantity_per_pack: live.quantity_per_pack ?? line.quantity_per_pack,
        cost_price_per_pack: live.cost_price_per_pack ?? line.cost_price_per_pack,
        pack_sell_price: live.pack_sell_price ?? line.pack_sell_price,
      };
    });
  } catch {
    return cartLines;
  }
}

async function fetchSaleItemsForQuickDashboard(storeId, saleId) {
  const res = await axiosInstance.get(`/api/quick-dashboard/sale/${saleId}/items`);
  const quickItems = res.data?.items || [];
  if (quickItems.length) return quickItems;

  if (!storeId) return [];

  try {
    const detailRes = await axiosInstance.get(`/api/sales/detail/${storeId}/${saleId}/`);
    const detail = detailRes.data;
    const detailItems = detail?.items || detail?.sales_items || [];
    return detailItems.map((item) => ({
    id: item.id,
    entity_id: item.product_id ?? item.service_id,
    product_id: item.product_id,
    service_id: item.service_id,
    type: item.product_id != null ? 'product' : item.service_id != null ? 'service' : 'other',
    name: item.product_name || item.service_name || item.description || 'Item',
    quantity: item.quantity,
    unit_price: item.price,
    price: item.price,
    subtotal: item.total,
    total: item.total,
    }));
  } catch {
    return [];
  }
}

function buildQuickReceiptFallback(sale, items = []) {
  return normalizeReceiptFromSale(sale, items);
}

function saleStatusColor(status) {
  const lowered = String(status || '').toLowerCase();
  if (lowered === 'paid' || lowered === 'completed') return 'success';
  if (lowered === 'credit' || lowered === 'pending') return 'warning';
  if (lowered === 'draft') return 'default';
  return 'default';
}

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
  const [qtyDraft, setQtyDraft] = useState(() => String(item.quantity ?? ''));
  const [qtyFocused, setQtyFocused] = useState(false);

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

  useEffect(() => {
    if (!qtyFocused) {
      setQtyDraft(String(item.quantity ?? ''));
    }
  }, [item.quantity, item.cartId, qtyFocused]);

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

  const packVariableBounds =
    isPackLine && item.allow_variable_price
      ? variablePriceBoundsForCartLine(item)
      : { min: null, max: null };

  const packPriceError =
    isPackLine &&
    (isCartLinePackPriceBelowCost(item) || isCartLineVariablePriceInvalid(item));

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
                value={qtyFocused ? qtyDraft : String(item.quantity ?? '')}
                onFocus={() => {
                  setQtyDraft(String(item.quantity ?? ''));
                  setQtyFocused(true);
                }}
                onChange={(e) => {
                  setQtyDraft(e.target.value);
                }}
                onBlur={() => {
                  setQtyFocused(false);
                  const raw = qtyDraft.trim();
                  if (raw !== '') onQtyInput?.(item.cartId, raw);
                }}
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
                    item.allow_variable_price &&
                    packVariableBounds.min != null &&
                    packVariableBounds.max != null
                      ? `${currencySymbol}${packVariableBounds.min.toLocaleString()}–${currencySymbol}${packVariableBounds.max.toLocaleString()}`
                      : item.cost_price_per_pack != null
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

// ----------------------------------------------------------------------
// Barcode / QR Scanner Dialog
// ----------------------------------------------------------------------

const SCANNER_ELEMENT_ID = 'qs-barcode-scanner-region';

function BarcodeScannerDialog({ open, onScan, onClose }) {
  const scannerRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!open) return undefined;

    let scanner;
    setCameraError('');

    const start = async () => {
      try {
        // Request permission explicitly first so the browser shows its native prompt
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
        setCameraError(
          isDenied
            ? 'Camera access was denied. Go to Chrome Settings → Privacy & Security → Site Settings → Camera and set localhost:3030 to Allow, then try again.'
            : `Camera unavailable: ${err?.message || err?.name || 'unknown error'}`
        );
        return;
      }

      try {
        scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
        scannerRef.current = scanner;

        // Get available cameras and pick the best one
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setCameraError('No camera found on this device.');
          return;
        }
        // Prefer rear camera on mobile; fall back to first available (e.g. MacBook webcam)
        const rearCamera = cameras.find(
          (c) => c.label?.toLowerCase().includes('back') || c.label?.toLowerCase().includes('rear') || c.label?.toLowerCase().includes('environment')
        );
        const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

        await scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setCameraError(
          `Failed to start scanner: ${err?.message || err?.name || 'unknown error'}`
        );
      }
    };

    start();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [open, onScan, retryKey]);

  const handleClose = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:qr-code-bold" width={22} />
          <span>Scan Barcode / QR Code</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {cameraError ? (
          <Stack spacing={2}>
            <Alert severity="error">{cameraError}</Alert>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setCameraError('');
                setRetryKey((k) => k + 1);
              }}
            >
              Retry
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Point the camera at a barcode or QR code. It will be detected automatically.
          </Typography>
        )}
        <Box
          id={SCANNER_ELEMENT_ID}
          sx={{ width: '100%', minHeight: cameraError ? 0 : 200, borderRadius: 1, overflow: 'hidden' }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function QuickDashboardView() {
  const { currencySymbol } = useCurrencyFormat();
  const searchRef = useRef(null);
  const onboarding = useOnboardingMode();
  const advanceOnboarding = useAdvanceOnboarding();
  const { mutateProgress } = useOnboardingProgress({ skip: !onboarding });

  const [storeId, setStoreId] = useState(() => getStoreIdFromStorage());
  const { runWithReceiptOutput, activeReceipt, dialogs } = useReceiptOutputFlow({ storeId });

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
  const [sharingSaleId, setSharingSaleId] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareReceipt, setShareReceipt] = useState(null);
  const [collectingSaleId, setCollectingSaleId] = useState(null);
  const [printingSaleId, setPrintingSaleId] = useState(null);

  // Search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Barcode / QR scanner
  const [scannerOpen, setScannerOpen] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [rowModes, setRowModes] = useState({}); // { [cartId]: 'qty' | 'amount' }
  const [paymentLines, setPaymentLines] = useState([{ payment_method_id: '', amount: 0 }]);
  const [creditCustomerName, setCreditCustomerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [collectSale, setCollectSale] = useState(null);
  const [collectLines, setCollectLines] = useState([]);
  const [collectSubmitting, setCollectSubmitting] = useState(false);
  const [editingDraftSale, setEditingDraftSale] = useState(null);
  const [loadingDraftEditId, setLoadingDraftEditId] = useState(null);
  const [completeDraftOpen, setCompleteDraftOpen] = useState(false);
  const [completeDraftSale, setCompleteDraftSale] = useState(null);
  const [completeDraftLines, setCompleteDraftLines] = useState([]);
  const [completeDraftSubmitting, setCompleteDraftSubmitting] = useState(false);
  const paymentsTouchedRef = useRef(false);

  const { paymentMethods, paymentMethodsLoading } = useGetPaymentMethods(storeId);
  /** Block checkout while a variable price field is focused (draft not yet committed). */
  const [variablePriceFocusCartId, setVariablePriceFocusCartId] = useState(null);

  // Optional customer (walk-in when unset — omit customer_id on submit)
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInput, setCustomerInput] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);

  // Default payment method when store methods load
  useEffect(() => {
    if (!paymentMethods?.length) return;
    setPaymentLines((prev) =>
      prev.map((line) =>
        line.payment_method_id
          ? line
          : { ...line, payment_method_id: paymentMethods[0].id }
      )
    );
  }, [paymentMethods]);

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
      const items = await fetchSaleItemsForQuickDashboard(storeId, saleId);
      setSaleItemsCache((prev) => ({ ...prev, [saleId]: items }));
    } catch {
      setSaleItemsCache((prev) => ({ ...prev, [saleId]: [] }));
    } finally {
      setLoadingSaleId(null);
    }
  }, [expandedSaleId, saleItemsCache, storeId]);

  const fetchSaleReceipt = useCallback(
    async (sale) => {
      try {
        const detailRes = await axiosInstance.get(`/api/sales/detail/${storeId}/${sale.id}/`);
        return normalizeReceiptFromSale(detailRes.data);
      } catch {
        let fallbackItems = saleItemsCache[sale.id];
        if (!fallbackItems) {
          const itemRes = await axiosInstance.get(`/api/quick-dashboard/sale/${sale.id}/items`);
          fallbackItems = itemRes.data?.items || [];
          setSaleItemsCache((prev) => ({ ...prev, [sale.id]: fallbackItems }));
        }
        return buildQuickReceiptFallback(sale, fallbackItems || []);
      }
    },
    [saleItemsCache, storeId]
  );

  const handleShareSale = useCallback(
    async (sale) => {
      if (!sale?.id || sharingSaleId != null) return;
      setSharingSaleId(sale.id);

      try {
        const receipt = await fetchSaleReceipt(sale);
        runWithReceiptOutput(
          receipt,
          (outputReceipt) => {
            setShareReceipt(outputReceipt);
            setShareDialogOpen(true);
            setSharingSaleId(null);
          },
          () => {
            setSharingSaleId(null);
          }
        );
      } catch (error) {
        setSharingSaleId(null);
        toast.error('Could not load receipt for sharing.');
      }
    },
    [fetchSaleReceipt, runWithReceiptOutput, sharingSaleId]
  );

  const handleCloseShareDialog = useCallback(() => {
    setShareDialogOpen(false);
    setShareReceipt(null);
  }, []);

  const openCollectBalance = useCallback(
    (sale) => {
      const balance =
        sale.balance_due ??
        Math.max(0, Number(sale.total_amount || 0) - Number(sale.amount_paid || 0));
      if (!sale?.id || balance <= 0) return;
      setCollectSale(sale);
      setCollectLines([defaultPaymentLine(balance, paymentMethods)]);
      setCollectOpen(true);
    },
    [paymentMethods]
  );

  const handleSubmitCollectBalance = useCallback(async () => {
    if (!collectSale?.id) return;
    const balanceDue =
      collectSale.balance_due
      ?? Math.max(
        0,
        Number(collectSale.total_amount || 0) - Number(collectSale.amount_paid || 0)
      );
    const collectPaid = sumPaymentLines(collectLines);
    const validLines = collectLines.filter(
      (p) => Number(p.amount) > 0 && p.payment_method_id
    );
    if (!validLines.length) {
      toast.error('Enter at least one payment with a method.');
      return;
    }
    if (validLines.some((p) => !p.payment_method_id)) {
      toast.error('Select a payment method for each line.');
      return;
    }
    if (collectPaid > balanceDue + 0.02) {
      toast.error(
        `Total payments (${fCurrency(collectPaid)}) cannot exceed balance due (${fCurrency(balanceDue)}).`
      );
      return;
    }
    try {
      setCollectSubmitting(true);
      setCollectingSaleId(collectSale.id);
      await Promise.all(
        validLines.map((line) =>
          addPaymentToSale(collectSale.id, {
            payment_method_id: Number(line.payment_method_id),
            amount: Number(line.amount),
          })
        )
      );
      toast.success('Payment recorded.');
      setCollectOpen(false);
      setCollectSale(null);
      await Promise.all([fetchStats(), fetchRecent()]);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to record payment.');
    } finally {
      setCollectSubmitting(false);
      setCollectingSaleId(null);
    }
  }, [collectLines, collectSale, fetchRecent, fetchStats]);

  const handlePrintSale = useCallback(
    async (sale) => {
      if (!sale?.id || printingSaleId != null) return;
      setPrintingSaleId(sale.id);

      try {
        const receipt = await fetchSaleReceipt(sale);

        runWithReceiptOutput(
          receipt,
          async (outputReceipt) => {
            try {
              const receiptFormat = getPreferredReceiptFormat();
              const fileName = `${outputReceipt?.invoice_number || sale.invoice_number || `sale-${sale.id}`}.pdf`;
              const result = await printReceipt({
                receipt: outputReceipt,
                fileName,
                receiptFormat,
                pdfFlavor: 'pos',
                preferBluetooth: receiptFormat === 'thermal',
              });

              const message = getPrintResultMessage(result);
              if (message) {
                toast.info(message);
              }
            } catch (error) {
              if (error?.name !== 'AbortError') {
                toast.error('Could not prepare receipt for printing.');
              }
            } finally {
              setPrintingSaleId(null);
            }
          },
          () => setPrintingSaleId(null)
        );

      } catch (error) {
        setPrintingSaleId(null);
        toast.error('Could not prepare receipt for printing.');
      }
    },
    [fetchSaleReceipt, printingSaleId, runWithReceiptOutput]
  );

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
    if (rawValue == null || String(rawValue).trim() === '') return;
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0.01) return;
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        const maxQty = maxAllowedQtyForCartLine(c);
        if (value > maxQty && Number.isFinite(maxQty)) {
          toast.error(`Quantity cannot exceed available stock of ${maxQty}.`);
        }
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

  // ── Immediate search (barcode scanner + physical scanner Enter key) ──

  const handleImmediateSearch = useCallback(async (value) => {
    const trimmed = value.trim();
    if (!trimmed || !storeId) return;

    if (!isOnline) {
      const cached = loadSearchCache();
      const filtered = filterCacheByQuery(cached, trimmed);
      const normalized = filtered.map(normalizeQuickSearchProduct);
      setSearchResults(normalized);
      if (normalized.length === 1) {
        const item = normalized[0];
        const isExact =
          item.code?.toLowerCase() === trimmed.toLowerCase() ||
          item.sku?.toLowerCase() === trimmed.toLowerCase();
        if (isExact) addToCart(item);
      }
      return;
    }

    try {
      setSearching(true);
      const res = await axiosInstance.get('/api/quick-dashboard/search', {
        params: { query: trimmed, store_id: storeId, limit: 20 },
      });
      const raw = res.data?.results || [];
      const normalized = raw.map(normalizeQuickSearchProduct);
      const existingCache = loadSearchCache();
      const existingMap = new Map(existingCache.map((r) => [`${r.type}-${r.id}`, r]));
      raw.forEach((r) => existingMap.set(`${r.type}-${r.id}`, r));
      saveSearchCache(Array.from(existingMap.values()));
      setSearchResults(normalized);

      if (normalized.length === 1) {
        const item = normalized[0];
        const isExact =
          item.code?.toLowerCase() === trimmed.toLowerCase() ||
          item.sku?.toLowerCase() === trimmed.toLowerCase();
        if (isExact) addToCart(item);
      }
    } catch {
      const cached = loadSearchCache();
      const filtered = filterCacheByQuery(cached, trimmed);
      setSearchResults(filtered.map(normalizeQuickSearchProduct));
    } finally {
      setSearching(false);
    }
  }, [storeId, isOnline, addToCart]);

  const handleScanResult = useCallback((scannedValue) => {
    setScannerOpen(false);
    setQuery(scannedValue);
    handleImmediateSearch(scannedValue);
  }, [handleImmediateSearch]);

  // ── Cart totals ────────────────────────────────────────────────

  const cartTotal = cart.reduce((s, c) => s + c.subtotal, 0);
  const paidSum = sumPaymentLines(paymentLines);
  const balanceDue = Math.max(0, cartTotal - paidSum);
  const hasCreditIdentity =
    Boolean(selectedCustomer?.id) || Boolean(creditCustomerName.trim());
  const needsCustomer =
    cartTotal > 0 && (balanceDue > 0.02 || paidSum <= 0);
  const paymentOverpaid = paidSum > cartTotal + 0.02;

  // Keep single payment line matched to cart total until cashier edits amounts
  useEffect(() => {
    if (paymentsTouchedRef.current) return;
    setPaymentLines((prev) => {
      if (prev.length !== 1) return prev;
      if (prev[0].amount === cartTotal) return prev;
      return [{ ...prev[0], amount: cartTotal }];
    });
  }, [cartTotal]);

  useEffect(() => {
    if (!cart.length) {
      paymentsTouchedRef.current = false;
    }
  }, [cart.length]);

  const cartHasInvalidVariablePrice = cart.some(isCartLineVariablePriceInvalid);

  const cartHasInvalidPackPrice = cart.some(isCartLinePackPriceBelowCost);
  const outOfStockLines = cart.filter(
    (line) => line.type === 'product' && line.stock != null && Number(line.stock) <= 0
  );
  const outOfStockItemNames = Array.from(
    new Set(outOfStockLines.map((line) => line.name).filter(Boolean))
  );
  const outOfStockSummary = outOfStockItemNames.slice(0, 4).join(', ');
  const outOfStockRemainingCount = Math.max(0, outOfStockItemNames.length - 4);
  const cartHasOutOfStockItems = cart.some(
    (line) => line.type === 'product' && line.stock != null && Number(line.stock) <= 0
  );
  const cartHasInsufficientStock = cart.some((line) => {
    if (line.type !== 'product') return false;
    const maxQty = maxAllowedQtyForCartLine(line);
    return Number.isFinite(maxQty) && Number(line.quantity) > maxQty;
  });

  const checkoutBlockedByVariablePrice =
    cartHasInvalidVariablePrice || cartHasInvalidPackPrice || variablePriceFocusCartId != null;

  // ── Checkout ───────────────────────────────────────────────────

  const mapCartToPayloadItems = () =>
    cart.map((c) => {
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
    });

  const buildSalePayload = (options = {}) => {
    const { asDraft = false, asCredit = false } = options;
    const currencyCode = localStorage.getItem('current_currency') || 'NGN';
    const payload = {
      store_id: storeId,
      items: mapCartToPayloadItems(),
      currency_code: currencyCode,
      status: asDraft ? 'draft' : asCredit ? 'credit' : 'paid',
    };
    if (!asDraft && !asCredit) {
      const validLines = paymentLines.filter(
        (p) => Number(p.amount) > 0 && p.payment_method_id
      );
      payload.payments = validLines.map((p) => ({
        payment_method_id: Number(p.payment_method_id),
        amount: Number(p.amount),
      }));
    }
    if (selectedCustomer?.id) {
      payload.customer_id = selectedCustomer.id;
    } else if ((balanceDue > 0 || asCredit) && creditCustomerName.trim()) {
      payload.customer_name = creditCustomerName.trim();
    }
    return payload;
  };

  const buildDraftUpdatePayload = () => {
    const currencyCode = localStorage.getItem('current_currency') || 'NGN';
    const payload = {
      store_id: storeId,
      items: mapCartToPayloadItems(),
      currency_code: currencyCode,
    };
    if (selectedCustomer?.id) {
      payload.customer_id = selectedCustomer.id;
    } else if (creditCustomerName.trim()) {
      payload.customer_name = creditCustomerName.trim();
    }
    return payload;
  };

  const cancelEditDraft = () => {
    setEditingDraftSale(null);
    paymentsTouchedRef.current = false;
    setCart([]);
    setPaymentLines([defaultPaymentLine(0, paymentMethods)]);
    setCreditCustomerName('');
    setSelectedCustomer(null);
    setCustomerInput('');
  };

  const finalizeSaleSuccess = useCallback(() => {
    paymentsTouchedRef.current = false;
    setEditingDraftSale(null);
    setCart([]);
    setVariablePriceFocusCartId(null);
    setRowModes({});
    setQuery('');
    setSearchResults([]);
    setCreditCustomerName('');
    setSelectedCustomer(null);
    setCustomerInput('');
    setCustomerOptions([]);
    setPaymentLines([defaultPaymentLine(0, paymentMethods)]);
  }, [paymentMethods]);

  const checkOnboardingSalesProgress = useCallback(async () => {
    if (!onboarding) return;
    const updated = await mutateProgress();
    if (updated?.steps?.sales?.done) {
      await advanceOnboarding(updated);
    }
  }, [advanceOnboarding, mutateProgress, onboarding]);

  const tryAutoPrintAfterSale = useCallback(
    async ({ saleMeta, cartLines = [], paymentLinesSnapshot = [] }) => {
      if (!isOnline || !storeId || !saleMeta?.sale_id) return;

      const fallbackItems = cartLines.map((line) => ({
        description: line.name,
        name: line.name,
        product_name: line.name,
        quantity: line.quantity,
        price: line.unitPrice ?? line.price,
        total: line.subtotal,
      }));

      const outcome = await autoPrintSaleReceipt({
        storeId,
        saleId: saleMeta.sale_id,
        fallbackSale: {
          ...saleMeta,
          payments: paymentLinesSnapshot,
        },
        fallbackItems,
      });

      if (!outcome.skipped && outcome.error) {
        toast.warning('Sale saved but the receipt could not be sent to the printer.');
      }
    },
    [isOnline, storeId]
  );

  const loadDraftForEdit = useCallback(
    async (sale) => {
      if (!storeId || !sale?.id) return;
      try {
        setLoadingDraftEditId(sale.id);
        const rawItems = await fetchSaleItemsForQuickDashboard(storeId, sale.id);
        const cartLines = rawItems
          .map((it) => mapSaleItemToCartLine(it))
          .filter(Boolean);
        if (!cartLines.length) {
          toast.error(
            rawItems.length
              ? 'Draft lines could not be loaded into the cart. Try completing the sale from the invoice screen.'
              : 'This draft has no line items. Add products and use Update draft to save.'
          );
          return;
        }
        const draftTotal = cartLines.reduce((s, c) => s + c.subtotal, 0);
        const hydratedCartLines = await hydrateDraftCartLinesWithLiveStock(storeId, cartLines);
        paymentsTouchedRef.current = false;
        setEditingDraftSale({
          id: sale.id,
          invoice_number: sale.invoice_number,
        });
        setCart(hydratedCartLines);
        setPaymentLines([defaultPaymentLine(draftTotal, paymentMethods)]);
        setQuery('');
        setSearchResults([]);
        toast.info(`Editing draft ${sale.invoice_number}`);
      } catch (error) {
        toast.error(error?.response?.data?.detail || 'Failed to load draft.');
      } finally {
        setLoadingDraftEditId(null);
      }
    },
    [storeId, paymentMethods]
  );

  const openCompleteDraft = useCallback(
    (sale) => {
      const total = Number(sale.total_amount) || 0;
      if (!sale?.id || total <= 0) return;
      setCompleteDraftSale(sale);
      setCompleteDraftLines([defaultPaymentLine(total, paymentMethods)]);
      setCompleteDraftOpen(true);
    },
    [paymentMethods]
  );

  const handleSubmitCompleteDraft = useCallback(async () => {
    if (!completeDraftSale?.id || !storeId) return;
    const draftTotal = Number(completeDraftSale.total_amount) || 0;
    const paid = sumPaymentLines(completeDraftLines);
    const validLines = completeDraftLines.filter(
      (p) => Number(p.amount) > 0 && p.payment_method_id
    );
    if (!validLines.length) {
      toast.error('Enter at least one payment with a method.');
      return;
    }
    if (paid > draftTotal + 0.02) {
      toast.error(
        `Total payments (${fCurrency(paid)}) cannot exceed draft total (${fCurrency(draftTotal)}).`
      );
      return;
    }
    try {
      setCompleteDraftSubmitting(true);
      const { data: completedSale } = await axiosInstance.post(
        `/api/quick-dashboard/sale/${completeDraftSale.id}/complete`,
        {
          store_id: storeId,
          payments: validLines.map((p) => ({
            payment_method_id: Number(p.payment_method_id),
            amount: Number(p.amount),
          })),
        }
      );
      toast.success(`Draft ${completeDraftSale.invoice_number} completed.`);
      if (editingDraftSale?.id === completeDraftSale.id) {
        setEditingDraftSale(null);
      }
      setCompleteDraftOpen(false);
      setCompleteDraftSale(null);
      finalizeSaleSuccess();
      await checkOnboardingSalesProgress();
      await Promise.all([fetchStats(), fetchRecent()]);
      await tryAutoPrintAfterSale({
        saleMeta: completedSale,
        paymentLinesSnapshot: validLines,
      });
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to complete draft.');
    } finally {
      setCompleteDraftSubmitting(false);
    }
  }, [
    checkOnboardingSalesProgress,
    completeDraftLines,
    completeDraftSale,
    editingDraftSale,
    fetchRecent,
    fetchStats,
    finalizeSaleSuccess,
    storeId,
    tryAutoPrintAfterSale,
  ]);

  const submitSalePayload = async (payload, successMessage) => {
    if (!isOnline) {
      await enqueueSale(payload);
      await refreshOfflineCount();
      toast.warning(`${successMessage} saved offline — will sync when connected.`);
      return null;
    }
    try {
      const { data } = await axiosInstance.post('/api/quick-dashboard/sale', payload);
      toast.success(successMessage);
      await Promise.all([fetchStats(), fetchRecent()]);
      return data;
    } catch (networkErr) {
      const isNetworkFailure =
        !networkErr?.response
        || networkErr?.code === 'ERR_NETWORK'
        || networkErr?.code === 'ECONNABORTED';
      if (isNetworkFailure) {
        await enqueueSale(payload);
        await refreshOfflineCount();
        toast.warning(
          `Couldn't reach server. ${successMessage} saved offline — will sync when connected.`
        );
        return null;
      }
      throw networkErr;
    }
  };

  const handleCheckout = async () => {
    if (!cart.length) { toast.warning('Cart is empty.'); return; }
    if (cartHasOutOfStockItems) {
      const names = outOfStockSummary || 'One or more items';
      const more = outOfStockRemainingCount > 0 ? ` (+${outOfStockRemainingCount} more)` : '';
      toast.error(`${names}${more} out of stock. Save as draft or restock before completing sale.`);
      return;
    }
    if (cartHasInsufficientStock) {
      toast.error('One or more item quantities exceed available stock. Reduce quantity or restock.');
      return;
    }
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

    const validLines = paymentLines.filter(
      (p) => Number(p.amount) > 0 && p.payment_method_id
    );
    const isFullCredit = paidSum <= 0 && cartTotal > 0;

    if (!validLines.length && !isFullCredit) {
      toast.error('Enter at least one payment amount.');
      return;
    }
    if (paymentLines.some((p) => Number(p.amount) > 0 && !p.payment_method_id)) {
      toast.error('Select a payment method for each payment line.');
      return;
    }
    if ((balanceDue > 0 || isFullCredit) && !hasCreditIdentity) {
      toast.error('Select or add a customer when recording a balance due.');
      return;
    }
    if (paymentOverpaid) {
      toast.error(
        `Total payments (${fCurrency(paidSum)}) cannot exceed sale total (${fCurrency(cartTotal)}).`
      );
      return;
    }

    const successMessage = isFullCredit
      ? `Credit sale of ${fCurrency(cartTotal)} recorded`
      : balanceDue > 0
        ? `Sale recorded — ${fCurrency(paidSum)} paid, ${fCurrency(balanceDue)} balance`
        : `Sale of ${fCurrency(cartTotal)} completed`;

    try {
      setSubmitting(true);
      if (editingDraftSale) {
        await axiosInstance.put(
          `/api/quick-dashboard/sale/${editingDraftSale.id}/draft`,
          buildDraftUpdatePayload()
        );
        const completePayload = {
          store_id: storeId,
          payments: validLines.map((p) => ({
            payment_method_id: Number(p.payment_method_id),
            amount: Number(p.amount),
          })),
          status: isFullCredit ? 'credit' : 'paid',
        };
        if (selectedCustomer?.id) {
          completePayload.customer_id = selectedCustomer.id;
        } else if ((balanceDue > 0 || isFullCredit) && creditCustomerName.trim()) {
          completePayload.customer_name = creditCustomerName.trim();
        }
        const cartSnapshot = [...cart];
        const paymentSnapshot = [...validLines];
        const { data: completedSale } = await axiosInstance.post(
          `/api/quick-dashboard/sale/${editingDraftSale.id}/complete`,
          completePayload
        );
        toast.success(successMessage);
        finalizeSaleSuccess();
        await checkOnboardingSalesProgress();
        await Promise.all([fetchStats(), fetchRecent()]);
        await tryAutoPrintAfterSale({
          saleMeta: completedSale,
          cartLines: cartSnapshot,
          paymentLinesSnapshot: paymentSnapshot,
        });
      } else {
        const cartSnapshot = [...cart];
        const paymentSnapshot = [...validLines];
        const payload = buildSalePayload({ asCredit: isFullCredit });
        const saleResult = await submitSalePayload(payload, successMessage);
        finalizeSaleSuccess();
        await checkOnboardingSalesProgress();
        if (saleResult?.sale_id) {
          await tryAutoPrintAfterSale({
            saleMeta: saleResult,
            cartLines: cartSnapshot,
            paymentLinesSnapshot: paymentSnapshot,
          });
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Sale failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!cart.length) { toast.warning('Cart is empty.'); return; }
    if (!storeId) { toast.error('No active store selected.'); return; }
    try {
      setSubmitting(true);
      if (editingDraftSale) {
        await axiosInstance.put(
          `/api/quick-dashboard/sale/${editingDraftSale.id}/draft`,
          buildDraftUpdatePayload()
        );
        toast.success(`Draft ${editingDraftSale.invoice_number} updated · ${fCurrency(cartTotal)}`);
        finalizeSaleSuccess();
        await fetchRecent();
      } else {
        const payload = buildSalePayload({ asDraft: true });
        await submitSalePayload(payload, `Draft saved · ${fCurrency(cartTotal)}`);
        finalizeSaleSuccess();
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async () => {
    const name = newCustomerName.trim();
    const phone = newCustomerPhone.trim();

    if (!name || !phone) {
      toast.error('Enter both customer name and phone number.');
      return;
    }
    if (!storeId) {
      toast.error('No active store selected.');
      return;
    }

    try {
      setCreatingCustomer(true);
      const payload = {
        name,
        phone_number: phone,
        // Required by backend schema for create; use neutral placeholders.
        address: 'N/A',
        city: 'N/A',
        state: 'N/A',
        country: 'Nigeria',
        zip_code: '000000',
        primary: 1,
        address_type: 'Home',
        store_id: Number(storeId),
      };
      const created = await addCustomer(payload);
      const option = {
        id: created.id,
        name: created.name || name,
        phone_number: created.phone_number || phone,
      };

      setCustomerOptions((prev) => {
        const exists = prev.some((item) => item.id === option.id);
        return exists ? prev : [option, ...prev];
      });
      setSelectedCustomer(option);
      setCustomerInput(`${option.name}${option.phone_number ? ` · ${option.phone_number}` : ''}`);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerOpen(false);
      toast.success('Customer added successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Could not add customer.');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const canPickContact =
    typeof navigator !== 'undefined'
    && navigator.contacts
    && typeof navigator.contacts.select === 'function';

  const handlePickContact = async () => {
    if (!canPickContact) {
      toast.info('Contact picker is not supported on this device/browser. Enter details manually.');
      return;
    }
    try {
      setPickingContact(true);
      const contacts = await navigator.contacts.select(['name', 'tel'], {
        multiple: false,
      });
      if (!contacts?.length) return;
      const selected = contacts[0] || {};
      const pickedName = Array.isArray(selected.name) ? selected.name[0] : selected.name;
      const pickedTel = Array.isArray(selected.tel) ? selected.tel[0] : selected.tel;
      if (pickedName) setNewCustomerName(String(pickedName));
      if (pickedTel) setNewCustomerPhone(String(pickedTel));
    } catch (error) {
      if (error?.name === 'AbortError') return;
      toast.error('Could not read contacts from this device.');
    } finally {
      setPickingContact(false);
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
      <OnboardingSetupShell subtitle="Record your first five sales using quick checkout. Each completed sale counts toward setup.">
        <span />
      </OnboardingSetupShell>
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
            Record a sale in under 30 seconds · {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', timeZone: LAGOS_TZ })}
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
                placeholder="Type name, SKU or barcode…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    handleImmediateSearch(query);
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searching
                        ? <CircularProgress size={16} />
                        : <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                      }
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {query && (
                        <IconButton size="small" onClick={() => { setQuery(''); setSearchResults([]); }}>
                          <Iconify icon="eva:close-fill" width={16} />
                        </IconButton>
                      )}
                      <Tooltip title="Scan barcode / QR code">
                        <IconButton size="small" onClick={() => setScannerOpen(true)}>
                          <Iconify icon="solar:qr-code-bold" width={20} />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />

              <BarcodeScannerDialog
                open={scannerOpen}
                onScan={handleScanResult}
                onClose={() => setScannerOpen(false)}
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

            {editingDraftSale && (
              <Alert
                severity="info"
                sx={{ mx: 2, mt: 2, mb: 0 }}
                action={(
                  <Button color="inherit" size="small" onClick={cancelEditDraft}>
                    Cancel
                  </Button>
                )}
              >
                Editing draft {editingDraftSale.invoice_number}
              </Alert>
            )}

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
              <Button
                size="small"
                variant="text"
                sx={{ mb: 1.25, px: 0, minWidth: 0, justifyContent: 'flex-start' }}
                startIcon={<Iconify icon="eva:plus-fill" width={16} />}
                onClick={() => setNewCustomerOpen(true)}
              >
                Add new customer
              </Button>

              <QuickDashboardPayments
                lines={paymentLines}
                onChange={setPaymentLines}
                onPaymentsTouched={() => {
                  paymentsTouchedRef.current = true;
                }}
                cartTotal={cartTotal}
                paymentMethods={paymentMethods}
                paymentMethodsLoading={paymentMethodsLoading}
                disabled={submitting}
                showSummary
              />

              {needsCustomer && !selectedCustomer?.id && (
                <TextField
                  fullWidth
                  size="small"
                  label="Customer name *"
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
                  helperText="Required for balance due. Or pick a customer above."
                />
              )}

              {cartHasOutOfStockItems && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  <strong>Out of stock:</strong> {outOfStockSummary}
                  {outOfStockRemainingCount > 0 ? ` (+${outOfStockRemainingCount} more)` : ''}. You
                  can save this transaction as draft, but you cannot complete the sale until stock
                  is added.
                </Alert>
              )}
              {cartHasInsufficientStock && !cartHasOutOfStockItems && (
                <Alert severity="warning" sx={{ mb: 1.5 }}>
                  One or more item quantities exceed available stock. Reduce quantity or restock
                  before completing sale.
                </Alert>
              )}

              <Button
                fullWidth
                size="large"
                variant="contained"
                color={balanceDue > 0 ? 'warning' : 'primary'}
                disabled={
                  !cart.length
                  || submitting
                  || checkoutBlockedByVariablePrice
                  || cartHasOutOfStockItems
                  || cartHasInsufficientStock
                  || paymentMethodsLoading
                  || (paidSum > 0 && !paymentMethods.length)
                  || (needsCustomer && !hasCreditIdentity)
                  || paymentOverpaid
                }
                onClick={handleCheckout}
                startIcon={
                  submitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify
                      icon={
                        balanceDue > 0
                          ? 'solar:clock-circle-bold'
                          : 'solar:card-recive-bold'
                      }
                    />
                  )
                }
                sx={{ fontWeight: 700, py: 1.5, fontSize: '1rem' }}
              >
                {submitting
                  ? 'Processing…'
                  : paidSum <= 0 && cartTotal > 0
                    ? `Record credit · ${fCurrency(cartTotal)}`
                    : balanceDue > 0
                      ? `Record sale · ${fCurrency(paidSum)} paid · ${fCurrency(balanceDue)} balance`
                      : `Complete sale · ${fCurrency(cartTotal)}`}
              </Button>

              {cart.length > 0 && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="inherit"
                  disabled={submitting || checkoutBlockedByVariablePrice}
                  onClick={handleSaveDraft}
                  sx={{ mt: 1 }}
                >
                  {editingDraftSale ? 'Update draft' : 'Save as draft'} · {fCurrency(cartTotal)}
                </Button>
              )}

              {cart.length > 0 && (
                <Button
                  fullWidth
                  size="small"
                  color="inherit"
                  onClick={() => {
                    setEditingDraftSale(null);
                    setCart([]);
                    setVariablePriceFocusCartId(null);
                    setRowModes({});
                    setSelectedCustomer(null);
                    setCustomerInput('');
                    paymentsTouchedRef.current = false;
                    setPaymentLines([defaultPaymentLine(0, paymentMethods)]);
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
                const amountPaid = Number(sale.amount_paid ?? 0);
                const saleBalance =
                  sale.balance_due ??
                  Math.max(0, Number(sale.total_amount || 0) - amountPaid);
                const showCollectBalance =
                  saleBalance > 0.01
                  && String(sale.status || '').toLowerCase() !== 'draft';
                const isDraft = String(sale.status || '').toLowerCase() === 'draft';
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
                        {isDraft ? (
                          <Typography variant="caption" color="text.secondary">
                            Saved as draft
                          </Typography>
                        ) : saleBalance > 0.01 ? (
                          <Typography variant="caption" color="warning.main" fontWeight={600}>
                            {fCurrency(amountPaid)} paid · {fCurrency(saleBalance)} due
                          </Typography>
                        ) : null}
                        <Chip
                          size="small"
                          label={sale.status}
                          color={saleStatusColor(sale.status)}
                          sx={{ height: 18, fontSize: 10 }}
                        />
                        <Stack direction="row" spacing={0.25}>
                          <Tooltip title="Print receipt">
                            <span>
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handlePrintSale(sale);
                                }}
                                disabled={printingSaleId === sale.id}
                                sx={{ p: 0.35 }}
                              >
                                {printingSaleId === sale.id ? (
                                  <CircularProgress size={13} color="inherit" />
                                ) : (
                                  <Iconify icon="solar:printer-minimalistic-bold" width={13} />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Share receipt">
                            <span>
                              <IconButton
                                size="small"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleShareSale(sale);
                                }}
                                disabled={sharingSaleId === sale.id}
                                sx={{ p: 0.35 }}
                              >
                                {sharingSaleId === sale.id ? (
                                  <CircularProgress size={13} color="inherit" />
                                ) : (
                                  <Iconify icon="solar:share-bold" width={13} />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>

                          {isDraft && (
                            <>
                              <Tooltip title="Edit draft">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      loadDraftForEdit(sale);
                                    }}
                                    disabled={loadingDraftEditId === sale.id}
                                    sx={{ p: 0.35 }}
                                  >
                                    {loadingDraftEditId === sale.id ? (
                                      <CircularProgress size={13} color="inherit" />
                                    ) : (
                                      <Iconify icon="eva:edit-fill" width={13} />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Complete sale">
                                <span>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openCompleteDraft(sale);
                                    }}
                                    sx={{ p: 0.35 }}
                                  >
                                    <Iconify icon="solar:card-recive-bold" width={13} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}
                          {showCollectBalance && (
                            <Tooltip title="Collect balance">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openCollectBalance(sale);
                                  }}
                                  disabled={collectingSaleId === sale.id}
                                  sx={{ p: 0.35 }}
                                >
                                  {collectingSaleId === sale.id ? (
                                    <CircularProgress size={13} color="inherit" />
                                  ) : (
                                    <Iconify icon="solar:wallet-money-bold" width={13} />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
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

      <Dialog
        open={completeDraftOpen}
        onClose={() => !completeDraftSubmitting && setCompleteDraftOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Complete draft sale</DialogTitle>
        <DialogContent>
          {completeDraftSale && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {completeDraftSale.invoice_number} — total{' '}
              {fCurrency(completeDraftSale.total_amount)}
            </Typography>
          )}
          <QuickDashboardPayments
            lines={completeDraftLines}
            onChange={setCompleteDraftLines}
            cartTotal={Number(completeDraftSale?.total_amount) || 0}
            paymentMethods={paymentMethods}
            paymentMethodsLoading={paymentMethodsLoading}
            disabled={completeDraftSubmitting}
            showSummary
            compact
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCompleteDraftOpen(false)}
            disabled={completeDraftSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCompleteDraft}
            disabled={
              completeDraftSubmitting
              || paymentMethodsLoading
              || sumPaymentLines(completeDraftLines)
                > (Number(completeDraftSale?.total_amount) || 0) + 0.02
            }
          >
            {completeDraftSubmitting ? 'Completing…' : 'Complete sale'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={collectOpen}
        onClose={() => !collectSubmitting && setCollectOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Collect balance</DialogTitle>
        <DialogContent>
          {collectSale && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {collectSale.invoice_number} — balance{' '}
              {fCurrency(
                collectSale.balance_due
                  ?? Math.max(
                    0,
                    Number(collectSale.total_amount || 0)
                      - Number(collectSale.amount_paid || 0)
                  )
              )}
            </Typography>
          )}
          <QuickDashboardPayments
            lines={collectLines}
            onChange={setCollectLines}
            cartTotal={
              collectSale?.balance_due
              ?? Math.max(
                0,
                Number(collectSale?.total_amount || 0)
                  - Number(collectSale?.amount_paid || 0)
              )
            }
            paymentMethods={paymentMethods}
            paymentMethodsLoading={paymentMethodsLoading}
            disabled={collectSubmitting}
            showSummary
            compact
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCollectOpen(false)}
            disabled={collectSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCollectBalance}
            disabled={
              collectSubmitting
              || paymentMethodsLoading
              || sumPaymentLines(collectLines)
                > (collectSale?.balance_due
                  ?? Math.max(
                    0,
                    Number(collectSale?.total_amount || 0)
                      - Number(collectSale?.amount_paid || 0)
                  ))
                + 0.02
            }
          >
            {collectSubmitting ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newCustomerOpen} onClose={() => !creatingCustomer && setNewCustomerOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add New Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Customer Name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
            <TextField
              label="Phone Number"
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              fullWidth
              size="small"
            />
            <Button
              variant="outlined"
              color="inherit"
              onClick={handlePickContact}
              disabled={creatingCustomer || pickingContact}
              startIcon={pickingContact ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:user-plus-bold" width={16} />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {pickingContact ? 'Opening contacts...' : 'Pick from contacts'}
            </Button>
            {!canPickContact && (
              <Typography variant="caption" color="text.secondary">
                Contact picker is not supported here. Enter name and phone manually.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={() => {
              if (creatingCustomer) return;
              setNewCustomerOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateCustomer} disabled={creatingCustomer}>
            {creatingCustomer ? 'Adding...' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>

      <ReceiptShareDialog
        open={shareDialogOpen}
        onClose={handleCloseShareDialog}
        receipt={shareReceipt}
        loading={sharingSaleId != null && !shareReceipt}
        receiptFormat={getPreferredReceiptFormat()}
        pdfFlavor="pos"
      />

      <ReceiptOutputFlowDialogs
        receipt={activeReceipt}
        storeId={storeId}
        dialogs={dialogs}
      />
    </DashboardContent>
  );
}
