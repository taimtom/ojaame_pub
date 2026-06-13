import { useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Grid from '@mui/material/Unstable_Grid2';

import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';
import { useBusinessType } from 'src/hooks/use-business-type';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import axiosInstance from 'src/utils/axios';
import { recordProductUsage } from 'src/actions/product';

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

function ItemCard({ item, onAdd, label }) {
  return (
    <Card
      onClick={() => onAdd(item)}
      sx={{
        p: 1.5,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'warning.main', boxShadow: 2, transform: 'translateY(-1px)' },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            bgcolor: 'warning.lighter',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon="solar:chef-hat-bold" width={20} sx={{ color: 'warning.dark' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {item.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              Cost {fCurrency(item.cost_price ?? item.price ?? 0)}
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
        <Iconify icon="eva:plus-fill" width={18} sx={{ color: 'warning.main', flexShrink: 0 }} />
      </Stack>
    </Card>
  );
}

function CartRow({ item, onQtyChange, onQtyInput, onRemove }) {
  const unitCost = item.cost_price ?? item.unit_price ?? 0;
  const lineCost = unitCost * item.quantity;

  return (
    <TableRow>
      <TableCell sx={{ py: 1, pl: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
          {item.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {fCurrency(unitCost)} / unit
        </Typography>
      </TableCell>

      <TableCell sx={{ py: 1 }} align="center">
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
            inputProps={{ step: 1, min: 1, style: { textAlign: 'center', width: 56 } }}
          />
          <IconButton size="small" onClick={() => onQtyChange(item.cartId, 1)} sx={{ p: 0.25 }}>
            <Iconify icon="eva:plus-fill" width={14} />
          </IconButton>
        </Stack>
      </TableCell>

      <TableCell sx={{ py: 1, pr: 0 }} align="right">
        <Typography variant="body2" fontWeight={600}>
          {fCurrency(lineCost)}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          at cost
        </Typography>
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

export function UsageDashboardView() {
  const { t, getNavLabel } = useBusinessType();
  const searchRef = useRef(null);

  const [storeId, setStoreId] = useState(() => getStoreIdFromStorage());

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

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [cart, setCart] = useState([]);
  const [usageNote, setUsageNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let timer;
    if (!query.trim() || !storeId) {
      setSearchResults([]);
    } else {
      timer = setTimeout(async () => {
        try {
          setSearching(true);
          const res = await axiosInstance.get('/api/quick-dashboard/search', {
            params: {
              query: query.trim(),
              store_id: storeId,
              limit: 20,
              item_type: 'product',
              product_kind: 'production_input',
            },
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

  const addToCart = useCallback((item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.cartId === `product-${item.id}`);
      if (existing) {
        const maxQty = existing.stock != null ? existing.stock : Infinity;
        if (existing.quantity >= maxQty) return prev;
        const newQty = Math.min(existing.quantity + 1, maxQty);
        return prev.map((c) =>
          c.cartId === existing.cartId ? { ...c, quantity: newQty } : c
        );
      }
      const unit = Number(item.price ?? 0);
      const cost = item.cost_price != null ? Number(item.cost_price) : unit;
      return [
        ...prev,
        {
          cartId: `product-${item.id}`,
          id: item.id,
          type: 'product',
          name: item.name,
          unit_price: unit,
          cost_price: cost,
          quantity: 1,
          stock: item.stock ?? null,
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
          if (newQty < 1) return null;
          const maxQty = c.stock != null ? c.stock : Infinity;
          const clampedQty = Math.min(newQty, maxQty);
          return { ...c, quantity: clampedQty };
        })
        .filter(Boolean)
    );
  }, []);

  const setQtyExact = useCallback((cartId, rawValue) => {
    const value = Number(rawValue);
    if (!value || value < 1) return;
    setCart((prev) =>
      prev.map((c) => {
        if (c.cartId !== cartId) return c;
        const maxQty = c.stock != null ? c.stock : Infinity;
        const clampedQty = Math.min(Math.floor(value), maxQty);
        return { ...c, quantity: clampedQty };
      })
    );
  }, []);

  const removeFromCart = useCallback((cartId) => {
    setCart((prev) => prev.filter((c) => c.cartId !== cartId));
  }, []);

  const totalCost = cart.reduce((s, c) => {
    const u = c.cost_price ?? c.unit_price ?? 0;
    return s + u * c.quantity;
  }, 0);

  const handleRecordUsage = async () => {
    if (!cart.length) {
      toast.warning('Add at least one item.');
      return;
    }
    if (!storeId) {
      toast.error('No active store selected.');
      return;
    }
    try {
      setSubmitting(true);
      await Promise.all(
        cart.map((line) =>
          recordProductUsage(line.id, {
            store_id: storeId,
            quantity: line.quantity,
            description: usageNote.trim() || undefined,
          })
        )
      );
      toast.success(`Recorded usage for ${cart.length} line(s).`);
      setCart([]);
      setUsageNote('');
      setQuery('');
      setSearchResults([]);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to record usage.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputLabel = t('productionInput') || 'Production input';

  if (!storeId) {
    return (
      <DashboardContent>
        <Alert severity="warning" sx={{ mt: 3 }}>
          No store selected. Please select an active store from the Store Dashboard first.
        </Alert>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {getNavLabel('usageDashboard') || 'Usage dashboard'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Deduct {inputLabel.toLowerCase()} stock (not a sale) — same idea as Quick Dashboard, for inventory
            consumption.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                Search {inputLabel}s
              </Typography>
              <TextField
                inputRef={searchRef}
                fullWidth
                size="small"
                placeholder="Name or SKU…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {searching ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Iconify icon="eva:search-fill" width={20} sx={{ color: 'text.disabled' }} />
                      )}
                    </InputAdornment>
                  ),
                  endAdornment: query ? (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <Iconify icon="eva:close-fill" width={16} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Box>

            <Box sx={{ p: 2, maxHeight: 480, overflowY: 'auto' }}>
              {searchResults.length === 0 && !searching && query && (
                <Box textAlign="center" py={4}>
                  <Typography color="text.secondary" variant="body2">
                    No results for &quot;{query}&quot;
                  </Typography>
                </Box>
              )}
              {searchResults.length === 0 && !query && (
                <Box textAlign="center" py={5}>
                  <Typography color="text.secondary">
                    Type to search {inputLabel.toLowerCase()} items
                  </Typography>
                </Box>
              )}
              <Stack spacing={1}>
                {searchResults.map((item) => (
                  <ItemCard key={`${item.type}-${item.id}`} item={item} onAdd={addToCart} label={inputLabel} />
                ))}
              </Stack>
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Usage batch
              </Typography>
            </Box>

            <Box sx={{ p: 2, minHeight: 200, maxHeight: 360, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <Box textAlign="center" py={5}>
                  <Iconify icon="solar:box-minimalistic-bold" width={48} sx={{ color: 'text.disabled', mb: 1.5 }} />
                  <Typography color="text.secondary" variant="body2">
                    Add items from the left
                  </Typography>
                </Box>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ pl: 0, py: 0.5, fontWeight: 700 }}>Item</TableCell>
                      <TableCell align="center" sx={{ py: 0.5, fontWeight: 700 }}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 0, py: 0.5, fontWeight: 700 }}>
                        Est. cost
                      </TableCell>
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
                        onRemove={removeFromCart}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            <Divider />

            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Note (optional, applied to each line)"
                value={usageNote}
                onChange={(e) => setUsageNote(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total est. cost (informational)
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  {fCurrency(totalCost)}
                </Typography>
              </Stack>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="warning"
                disabled={!cart.length || submitting}
                onClick={handleRecordUsage}
                startIcon={
                  submitting ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:check-circle-bold" />
                }
                sx={{ fontWeight: 700, py: 1.5 }}
              >
                {submitting ? 'Recording…' : 'Record usage'}
              </Button>
              {cart.length > 0 && (
                <Button
                  fullWidth
                  size="small"
                  color="inherit"
                  onClick={() => setCart([])}
                  sx={{ mt: 1, color: 'text.secondary' }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
