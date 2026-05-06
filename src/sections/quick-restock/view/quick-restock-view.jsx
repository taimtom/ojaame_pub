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
  const [storeId, setStoreId] = useState(() => getStoreIdFromStorage());

  // search
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // restock cart supports both single-item and pack products
  const [restockCart, setRestockCart] = useState([]);

  const [submitting, setSubmitting] = useState(false);

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
    setRestockCart((prev) => {
      if (prev.find((r) => r.productId === product.id)) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          currentStock: product.stock ?? product.quantity ?? 0,
          isPack: Boolean(product.is_pack),
          quantityPerPack: Number(product.quantity_per_pack ?? 0) || null,
          packsToAdd: product.is_pack ? 1 : null,
          qty: product.is_pack
            ? Number(product.quantity_per_pack ?? 0) || 1
            : 1,
          costPerPack: product.is_pack
            ? Number(
                product.cost_price_per_pack ??
                  (Number(product.cost_price ?? 0) * (Number(product.quantity_per_pack ?? 0) || 1))
              ) || 0
            : null,
          costPerUnit: product.is_pack
            ? ((Number(product.cost_price_per_pack ?? 0) || 0) /
                (Number(product.quantity_per_pack ?? 0) || 1)) ||
              Number(product.cost_price ?? 0) ||
              0
            : Number(product.cost_price ?? 0) || 0,
          addAsExpense: true,
        },
      ];
    });
  }, []);

  const updateRow = useCallback((productId, field, value) => {
    setRestockCart((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, [field]: value } : r))
    );
  }, []);

  const removeRow = useCallback((productId) => {
    setRestockCart((prev) => prev.filter((r) => r.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setRestockCart([]), []);

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

    setSubmitting(true);
    try {
      const payload = {
        store_id: storeId,
        items: restockCart.map((r) => ({
          product_id: r.productId,
          quantity: Number(r.qty),
          cost_price: Number(r.costPerUnit),
          add_as_expense: r.addAsExpense,
        })),
      };
      const data = await bulkRestockProducts(payload);
      toast.success(data.message || 'Restock submitted successfully.');
      clearCart();
      setQuery('');
      setSearchResults([]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to submit restock.');
    } finally {
      setSubmitting(false);
    }
  }, [storeId, restockCart, clearCart]);

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
                <Typography variant="subtitle1" mb={2}>
                  Search Products
                </Typography>

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
                                      value={row.packsToAdd ?? 0}
                                      onChange={(e) => {
                                        const packsToAdd = Math.max(0, Number(e.target.value));
                                        const quantityPerPack = row.quantityPerPack || 1;
                                        updateRow(row.productId, 'packsToAdd', packsToAdd);
                                        updateRow(row.productId, 'qty', packsToAdd * quantityPerPack);
                                      }}
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
                                    value={row.qty}
                                    onChange={(e) =>
                                      updateRow(
                                        row.productId,
                                        'qty',
                                        Math.max(0, Number(e.target.value))
                                      )
                                    }
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
      </Stack>
    </DashboardContent>
  );
}
