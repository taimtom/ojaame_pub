import { useState, useCallback, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Grid from '@mui/material/Unstable_Grid2';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';
import { bulkRestockProducts } from 'src/actions/product';
import { ProductQuickAddDialog } from 'src/sections/product/product-quick-add-dialog';
import { usePermissions } from 'src/hooks/use-permissions';
import {
  SupplierSelect,
  buildSupplierPayload,
  isSupplierValid,
} from 'src/components/supplier';
import { VoiceInputBar } from 'src/sections/voice';

// ---------------------------------------------------------------------------

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

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeQuickSearchProduct(item) {
  if (!item || item.type !== 'product') return item;
  const isPack = Boolean(item.is_pack ?? item.isPack);
  const quantityPerPack = Number(item.quantity_per_pack ?? item.quantityPerPack ?? 0) || null;
  const costPricePerPack = item.cost_price_per_pack ?? item.costPricePerPack ?? null;
  return {
    ...item,
    is_pack: isPack,
    quantity_per_pack: quantityPerPack,
    cost_price_per_pack: costPricePerPack != null ? Number(costPricePerPack) : null,
  };
}

// ---------------------------------------------------------------------------

export function QuickRestockView() {
  const { hasPermission } = usePermissions();
  const canCreateProduct = hasPermission('products.create');
  const [storeId, setStoreId] = useState(() => getStoreIdFromStorage());

  // search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // restock cart supports both single-item and pack products
  const [restockCart, setRestockCart] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [qtyDrafts, setQtyDrafts] = useState({});
  const [supplierValue, setSupplierValue] = useState({ supplier_id: null, supplier: null });
  const [restockDate, setRestockDate] = useState(() => todayIsoDate());

  const debounceRef = useRef(null);

  // Keep storeId in sync with localStorage changes (e.g. store switching)
  useEffect(() => {
    const sync = () => setStoreId(getStoreIdFromStorage());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────────

  const handleQueryChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim() || !storeId) {
        setSearchResults([]);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await axiosInstance.get('/api/quick-dashboard/search', {
            params: { query: value.trim(), store_id: storeId, limit: 20 },
          });
          // API returns { results: [...] } where each item has a `type` field
          const all = res.data?.results || [];
          setSearchResults(
            all.filter((r) => r.type === 'product').map((item) => normalizeQuickSearchProduct(item))
          );
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setSearching(false);
        }
      }, 350);
    },
    [storeId]
  );

  // ── Cart helpers ────────────────────────────────────────────────────────────

  const addToCart = useCallback((product) => {
    const normalized = normalizeQuickSearchProduct({ ...product, type: 'product' });
    setRestockCart((prev) => {
      if (prev.find((r) => r.productId === normalized.id)) return prev;
      return [
        ...prev,
        {
          productId: normalized.id,
          name: normalized.name,
          currentStock: normalized.stock ?? normalized.quantity ?? 0,
          isPack: Boolean(normalized.is_pack),
          quantityPerPack: Number(normalized.quantity_per_pack ?? 0) || null,
          packsToAdd: normalized.is_pack ? 1 : null,
          qty: normalized.is_pack
            ? Number(normalized.quantity_per_pack ?? 0) || 1
            : 1,
          costPerPack: normalized.is_pack
            ? Number(
                normalized.cost_price_per_pack ??
                  (Number(normalized.cost_price ?? 0) *
                    (Number(normalized.quantity_per_pack ?? 0) || 1))
              ) || 0
            : null,
          costPerUnit: normalized.is_pack
            ? ((Number(normalized.cost_price_per_pack ?? 0) || 0) /
                (Number(normalized.quantity_per_pack ?? 0) || 1)) ||
              Number(normalized.cost_price ?? 0) ||
              0
            : Number(normalized.cost_price ?? 0) || 0,
          addAsExpense: false,
        },
      ];
    });
  }, []);

  const applyVoiceRestockDraft = useCallback((draft) => {
    const items = draft?.items || [];
    if (!items.length) {
      toast.warning('No products to restock from voice.');
      return;
    }

    setRestockCart((prev) => {
      let next = [...prev];
      items.forEach((item) => {
        if (!item.product_id) return;
        const qty = Math.max(0.01, Number(item.quantity) || 1);
        const existing = next.find((r) => r.productId === item.product_id);
        const isPack = Boolean(item.is_pack);
        const quantityPerPack = Number(item.quantity_per_pack ?? 0) || null;
        const costPerUnit =
          item.cost_price != null
            ? Number(item.cost_price)
            : Number(item.cost_price_per_pack ?? 0) / (quantityPerPack || 1) || 0;

        if (existing) {
          next = next.map((r) => {
            if (r.productId !== item.product_id) return r;
            if (r.isPack && r.quantityPerPack) {
              const packs = Math.max(1, Math.round(qty));
              return {
                ...r,
                packsToAdd: packs,
                qty: packs * r.quantityPerPack,
                costPerUnit: item.cost_price != null ? Number(item.cost_price) : r.costPerUnit,
              };
            }
            return {
              ...r,
              qty,
              costPerUnit: item.cost_price != null ? Number(item.cost_price) : r.costPerUnit,
            };
          });
          return;
        }

        next = [
          ...next,
          {
            productId: item.product_id,
            name: item.name,
            currentStock: item.stock ?? 0,
            isPack,
            quantityPerPack,
            packsToAdd: isPack ? Math.max(1, Math.round(qty)) : null,
            qty: isPack && quantityPerPack ? Math.max(1, Math.round(qty)) * quantityPerPack : qty,
            costPerPack: isPack
              ? Number(item.cost_price_per_pack ?? costPerUnit * (quantityPerPack || 1)) || 0
              : null,
            costPerUnit: costPerUnit || 0,
            addAsExpense: false,
          },
        ];
      });
      return next;
    });

    toast.success('Added from voice — review quantities, then submit.');
  }, []);

  const handleProductCreated = useCallback(
    (product) => {
      addToCart(product);
      toast.success(`"${product.name}" added to restock list. Set quantity and submit when ready.`);
      setQuery('');
      setSearchResults([]);
    },
    [addToCart]
  );

  const updateRow = useCallback((productId, field, value) => {
    setRestockCart((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, [field]: value } : r))
    );
  }, []);

  const removeRow = useCallback((productId) => {
    setRestockCart((prev) => prev.filter((r) => r.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setRestockCart([]), []);

  const handleQtyDraftChange = useCallback((productId, rawValue) => {
    setQtyDrafts((prev) => ({ ...prev, [productId]: rawValue }));
  }, []);

  const handleQtyDraftBlur = useCallback(
    (row, isPack) => {
      const key = row.productId;
      const raw = String(qtyDrafts[key] ?? '').trim();

      if (raw === '') {
        if (isPack) {
          updateRow(key, 'packsToAdd', 0);
          updateRow(key, 'qty', 0);
        } else {
          updateRow(key, 'qty', 0);
        }
      } else {
        const parsed = Number(raw);
        const normalized = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
        if (isPack) {
          const quantityPerPack = row.quantityPerPack || 1;
          updateRow(key, 'packsToAdd', normalized);
          updateRow(key, 'qty', normalized * quantityPerPack);
        } else {
          updateRow(key, 'qty', normalized);
        }
      }

      setQtyDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [qtyDrafts, updateRow]
  );

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!storeId) {
      toast.error('No active store selected.');
      return;
    }
    if (restockCart.length === 0) {
      toast.warning('Restock list is empty.');
      return;
    }
    const invalid = restockCart.find((r) => !r.qty || r.qty <= 0);
    if (invalid) {
      toast.error(`"${invalid.name}" has an invalid quantity.`);
      return;
    }
    if (!isSupplierValid(supplierValue)) {
      toast.error('Please select or enter supplier name and phone number.');
      return;
    }
    if (!restockDate) {
      toast.error('Please select a restock date.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        store_id: storeId,
        restock_date: restockDate,
        items: restockCart.map((r) => ({
          product_id: r.productId,
          quantity: Number(r.qty),
          cost_price: Number(r.costPerUnit),
          add_as_expense: r.addAsExpense,
        })),
        ...buildSupplierPayload(supplierValue),
      };
      const data = await bulkRestockProducts(payload);
      toast.success(data.message || 'Restock submitted successfully.');
      clearCart();
      setQuery('');
      setSearchResults([]);
      setSupplierValue({ supplier_id: null, supplier: null });
      setRestockDate(todayIsoDate());
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to submit restock.');
    } finally {
      setSubmitting(false);
    }
  }, [storeId, restockCart, clearCart, supplierValue, restockDate]);

  // ── Derived totals ──────────────────────────────────────────────────────────

  const grandTotal = restockCart.reduce((sum, r) => sum + (r.qty || 0) * (r.costPerUnit || 0), 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <DashboardContent>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h4">Quick Restock</Typography>
          {restockCart.length > 0 && (
            <Button
              size="small"
              color="inherit"
              startIcon={<Iconify icon="eva:trash-2-outline" />}
              onClick={clearCart}
            >
              Clear all
            </Button>
          )}
        </Stack>

        {!storeId && (
          <Alert severity="warning">No active store selected. Please select a store first.</Alert>
        )}

        <Grid container spacing={3}>
          {/* ── Left: search panel ── */}
          <Grid xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="subtitle1">Search Products</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VoiceInputBar
                      storeId={storeId}
                      intentHint="restock"
                      disabled={!storeId}
                      onConfirm={applyVoiceRestockDraft}
                    />
                    {canCreateProduct && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Iconify icon="eva:plus-fill" />}
                        onClick={() => setAddProductOpen(true)}
                        disabled={!storeId}
                      >
                        Add product
                      </Button>
                    )}
                  </Stack>
                </Stack>

                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by name, SKU, or code…"
                  value={query}
                  onChange={handleQueryChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: searching && (
                      <InputAdornment position="end">
                        <CircularProgress size={16} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Stack spacing={1} mt={2} sx={{ maxHeight: 480, overflowY: 'auto' }}>
                  {searchResults.length === 0 && query.trim() && !searching && (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                      No products found.
                    </Typography>
                  )}

                  {searchResults.map((product) => {
                    const alreadyAdded = restockCart.some((r) => r.productId === product.id);
                    return (
                      <Box
                        key={product.id}
                        onClick={() => !alreadyAdded && addToCart(product)}
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: alreadyAdded ? 'default' : 'pointer',
                          '&:hover': { bgcolor: alreadyAdded ? undefined : 'action.hover' },
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            In stock: {product.stock ?? product.quantity ?? 0}
                          </Typography>
                        </Box>

                        <Tooltip title={alreadyAdded ? 'Already in list' : 'Add to restock'}>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={alreadyAdded}
                              onClick={() => addToCart(product)}
                            >
                              <Iconify icon={alreadyAdded ? 'eva:checkmark-fill' : 'eva:plus-fill'} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* ── Right: restock cart ── */}
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" mb={2}>
                  Restock List
                </Typography>

                {restockCart.length === 0 ? (
                  <Box
                    sx={{
                      py: 6,
                      textAlign: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Iconify
                      icon="eva:archive-outline"
                      sx={{ width: 40, height: 40, color: 'text.disabled', mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Search and add products to begin restocking.
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell align="center" sx={{ minWidth: 90 }}>
                              Qty / Packs
                            </TableCell>
                            <TableCell align="center" sx={{ minWidth: 110 }}>
                              Cost (₦)
                            </TableCell>
                            <TableCell align="right" sx={{ minWidth: 90 }}>
                              Total
                            </TableCell>
                            <TableCell align="center">Expense</TableCell>
                            <TableCell align="center" />
                          </TableRow>
                        </TableHead>

                        <TableBody>
                          {restockCart.map((row) => (
                            <TableRow key={row.productId}>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {row.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Current: {row.currentStock}
                                </Typography>
                                {row.isPack && row.quantityPerPack ? (
                                  <Typography variant="caption" color="info.main" display="block">
                                    Pack x{row.quantityPerPack} units
                                  </Typography>
                                ) : null}
                              </TableCell>

                              <TableCell align="center">
                                {row.isPack ? (
                                  <>
                                    <TextField
                                      size="small"
                                      type="number"
                                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                      value={
                                        qtyDrafts[row.productId] !== undefined
                                          ? qtyDrafts[row.productId]
                                          : row.packsToAdd ?? 0
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value;
                                        handleQtyDraftChange(row.productId, raw);
                                        if (raw === '') return;
                                        const packsToAdd = Math.max(0, Number(raw));
                                        const quantityPerPack = row.quantityPerPack || 1;
                                        updateRow(row.productId, 'packsToAdd', packsToAdd);
                                        updateRow(row.productId, 'qty', packsToAdd * quantityPerPack);
                                      }}
                                      onBlur={() => handleQtyDraftBlur(row, true)}
                                      sx={{ width: 90 }}
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {row.qty} units
                                    </Typography>
                                  </>
                                ) : (
                                  <TextField
                                    size="small"
                                    type="number"
                                    inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                    value={
                                      qtyDrafts[row.productId] !== undefined
                                        ? qtyDrafts[row.productId]
                                        : row.qty
                                    }
                                    onChange={(e) =>
                                      (() => {
                                        const raw = e.target.value;
                                        handleQtyDraftChange(row.productId, raw);
                                        if (raw === '') return;
                                        updateRow(row.productId, 'qty', Math.max(0, Number(raw)));
                                      })()
                                    }
                                    onBlur={() => handleQtyDraftBlur(row, false)}
                                    sx={{ width: 80 }}
                                  />
                                )}
                              </TableCell>

                              <TableCell align="center">
                                {row.isPack ? (
                                  <>
                                    <TextField
                                      size="small"
                                      type="number"
                                      inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                      value={row.costPerPack ?? 0}
                                      onChange={(e) => {
                                        const costPerPack = Math.max(0, Number(e.target.value));
                                        const quantityPerPack = row.quantityPerPack || 1;
                                        updateRow(row.productId, 'costPerPack', costPerPack);
                                        updateRow(row.productId, 'costPerUnit', costPerPack / quantityPerPack);
                                      }}
                                      sx={{ width: 110 }}
                                    />
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      {fCurrency(row.costPerUnit)}/unit
                                    </Typography>
                                  </>
                                ) : (
                                  <TextField
                                    size="small"
                                    type="number"
                                    inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                    value={row.costPerUnit}
                                    onChange={(e) =>
                                      updateRow(
                                        row.productId,
                                        'costPerUnit',
                                        Math.max(0, Number(e.target.value))
                                      )
                                    }
                                    sx={{ width: 100 }}
                                  />
                                )}
                              </TableCell>

                              <TableCell align="right">
                                <Typography variant="body2">
                                  {fCurrency(row.qty * row.costPerUnit)}
                                </Typography>
                              </TableCell>

                              <TableCell align="center">
                                <Switch
                                  size="small"
                                  checked={row.addAsExpense}
                                  onChange={(e) =>
                                    updateRow(row.productId, 'addAsExpense', e.target.checked)
                                  }
                                  color="success"
                                />
                              </TableCell>

                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeRow(row.productId)}
                                >
                                  <Iconify icon="eva:trash-2-outline" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={2} sx={{ mb: 2 }}>
                      <TextField
                        label="Restock date"
                        type="date"
                        value={restockDate}
                        onChange={(e) => setRestockDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                      />
                      <SupplierSelect value={supplierValue} onChange={setSupplierValue} />
                    </Stack>

                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Expense toggle marks the restock cost as a CAPEX expense in your books.
                        </Typography>
                      </Box>

                      <Stack direction="row" alignItems="center" spacing={3}>
                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary">
                            Grand total
                          </Typography>
                          <Typography variant="h6">{fCurrency(grandTotal)}</Typography>
                        </Box>

                        <Button
                          variant="contained"
                          size="large"
                          onClick={handleSubmit}
                          disabled={submitting || restockCart.length === 0}
                          startIcon={
                            submitting ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <Iconify icon="eva:save-outline" />
                            )
                          }
                        >
                          {submitting ? 'Submitting…' : 'Submit Restock'}
                        </Button>
                      </Stack>
                    </Stack>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <ProductQuickAddDialog
          open={addProductOpen}
          onClose={() => setAddProductOpen(false)}
          storeId={storeId}
          defaultQuantity={0}
          allowZeroQuantity
          onProductCreated={handleProductCreated}
          title="Add product for restock"
        />
      </Stack>
    </DashboardContent>
  );
}
