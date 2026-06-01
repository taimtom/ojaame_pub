import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/utils/axios';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import {
  fetchServiceConsumableTemplates,
  updateServiceConsumableTemplates,
} from 'src/actions/service-log';

export function ServiceConsumableTemplates({ serviceId, storeId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [productSearching, setProductSearching] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!serviceId || !storeId) return;
    setLoading(true);
    try {
      const data = await fetchServiceConsumableTemplates(serviceId, storeId);
      setItems(
        (data || []).map((row) => ({
          product_id: row.product_id,
          product_name: row.product_name,
          default_quantity: row.default_quantity,
        }))
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [serviceId, storeId]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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

  const addProduct = (product) => {
    if (items.some((i) => i.product_id === product.id)) {
      toast.info('Product already in template.');
      return;
    }
    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        default_quantity: 1,
      },
    ]);
    setProductDialogOpen(false);
    setProductQuery('');
  };

  const saveTemplates = async () => {
    if (!serviceId || !storeId) return;
    setSaving(true);
    try {
      await updateServiceConsumableTemplates(
        serviceId,
        storeId,
        items.map((i) => ({
          product_id: i.product_id,
          default_quantity: Number(i.default_quantity) || 1,
        }))
      );
      toast.success('Default products saved.');
      loadTemplates();
    } catch (error) {
      toast.error(error.message || 'Failed to save default products.');
    } finally {
      setSaving(false);
    }
  };

  if (!serviceId) return null;

  return (
    <Card>
      <CardHeader
        title="Default products used"
        subheader="Pre-fill materials when logging this service"
        sx={{ mb: 1 }}
      />
      <Divider />
      <Stack spacing={2} sx={{ p: 3 }}>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            {!items.length && (
              <Typography variant="body2" color="text.disabled">
                No default products configured.
              </Typography>
            )}
            {items.map((row, index) => (
              <Stack key={row.product_id} direction="row" spacing={1} alignItems="center">
                <TextField size="small" fullWidth value={row.product_name} disabled label="Product" />
                <TextField
                  size="small"
                  label="Default qty"
                  type="number"
                  value={row.default_quantity}
                  onChange={(e) =>
                    setItems(
                      items.map((item, i) =>
                        i === index
                          ? { ...item, default_quantity: Number(e.target.value) || 0 }
                          : item
                      )
                    )
                  }
                  sx={{ width: 120 }}
                  inputProps={{ min: 0, step: 0.01 }}
                />
                <IconButton
                  color="error"
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>
            ))}
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setProductDialogOpen(true)}
              >
                Add product
              </Button>
              <Button variant="contained" disabled={saving} onClick={saveTemplates}>
                {saving ? 'Saving…' : 'Save defaults'}
              </Button>
            </Stack>
          </>
        )}
      </Stack>

      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add default product</DialogTitle>
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
                  onClick={() => addProduct(p)}
                >
                  {p.name}
                </Button>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
