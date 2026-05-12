import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { addProduct } from 'src/actions/product';
import { useGetCategories } from 'src/actions/category';
import { CategoryQuickAddDialog } from './category-quick-add-dialog';
import { toast } from 'src/components/snackbar';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

// ----------------------------------------------------------------------

const EMPTY_FORM = {
  name: '',
  category_id: '',
  quantity: 1,
  product_kind: 'sellable',
  is_pack: false,
  costPrice: '',
  price: '',
  quantity_per_pack: '',
  cost_price_per_pack: '',
  pack_sell_price: '',
};

// ----------------------------------------------------------------------

export function ProductQuickAddForm({ storeId, storeSlug }) {
  const router = useRouter();
  const { currencySymbol } = useCurrencyFormat();
  const { categories, categoriesLoading, mutateCategories } = useGetCategories(storeId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [lastCreated, setLastCreated] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.category_id) errs.category_id = 'Category is required';
    if (!form.quantity || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    if (form.product_kind === 'sellable') {
      if (!form.price || Number(form.price) < 1) errs.price = 'Selling price must be at least 1';
    }
    if (form.product_kind === 'production_input') {
      if (form.costPrice === '' || Number(form.costPrice) < 0)
        errs.costPrice = 'Cost price is required';
    }
    if (form.is_pack && form.product_kind === 'sellable') {
      if (!form.quantity_per_pack || Number(form.quantity_per_pack) < 1)
        errs.quantity_per_pack = 'Required for pack products';
      if (form.cost_price_per_pack === '' || Number(form.cost_price_per_pack) < 0)
        errs.cost_price_per_pack = 'Required for pack products';
    }
    return errs;
  };

  const handleSubmit = async (andAddAnother) => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    const storedId = storeId || localStorage.getItem('store_id');
    if (!storedId) {
      toast.error('Store ID not found');
      return;
    }

    const isProductionInput = form.product_kind === 'production_input';
    const costNum = form.costPrice !== '' ? Number(form.costPrice) : null;
    const priceNum = isProductionInput
      ? (costNum && costNum > 0 ? costNum : 0.01)
      : Number(form.price);

    const payload = {
      store_id: Number(storedId),
      name: form.name.trim(),
      category_id: Number(form.category_id),
      quantity: Number(form.quantity),
      product_kind: form.product_kind,
      is_pack: form.is_pack && !isProductionInput,
      price: priceNum,
      costPrice: costNum,
      priceSale: null,
      taxes: 0,
      publish: 'publish',
      allow_variable_price: false,
      variable_price_min: null,
      variable_price_max: null,
      quantity_per_pack: form.is_pack && !isProductionInput ? Number(form.quantity_per_pack) : null,
      cost_price_per_pack:
        form.is_pack && !isProductionInput ? Number(form.cost_price_per_pack) : null,
      pack_sell_price:
        form.is_pack && !isProductionInput && form.pack_sell_price !== ''
          ? Number(form.pack_sell_price)
          : null,
      sub_items: [],
    };

    setSubmitting(true);
    try {
      const response = await addProduct(payload);
      toast.success(`"${form.name}" created!`);
      setLastCreated({ name: form.name, id: response?.id });
      if (andAddAnother) {
        setForm(EMPTY_FORM);
        setErrors({});
        setLastCreated(null);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      const message =
        Array.isArray(detail)
          ? detail.join(' ')
          : typeof detail === 'string'
          ? detail
          : err?.message || 'Failed to create product';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isProductionInput = form.product_kind === 'production_input';
  const totalUnits =
    form.is_pack && form.quantity_per_pack
      ? Number(form.quantity || 0) * Number(form.quantity_per_pack)
      : null;

  return (
    <Stack spacing={3}>
      {/* Success banner with quick actions */}
      {lastCreated && !submitting && (
        <Alert
          severity="success"
          action={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setLastCreated(null);
                  setForm(EMPTY_FORM);
                  setErrors({});
                }}
              >
                Add Another
              </Button>
              <Button
                size="small"
                onClick={() => router.push(paths.dashboard.product.root(storeSlug))}
              >
                View Products
              </Button>
              {lastCreated.id != null && (
                <Button
                  size="small"
                  onClick={() =>
                    router.push(paths.dashboard.product.details(storeSlug, lastCreated.id))
                  }
                >
                  View Item
                </Button>
              )}
            </Stack>
          }
        >
          &ldquo;{lastCreated.name}&rdquo; was created successfully.
        </Alert>
      )}

      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Inventory role toggle */}
          <Stack spacing={1}>
            <Typography variant="subtitle2">Inventory Role</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={form.product_kind}
              onChange={(_, v) => {
                if (!v) return;
                set('product_kind', v);
                if (v === 'production_input') {
                  setForm((prev) => ({
                    ...prev,
                    product_kind: v,
                    is_pack: false,
                    quantity_per_pack: '',
                    cost_price_per_pack: '',
                    pack_sell_price: '',
                  }));
                }
              }}
            >
              <ToggleButton value="sellable">For Sale</ToggleButton>
              <ToggleButton value="production_input">Input / Raw Material (not sold)</ToggleButton>
            </ToggleButtonGroup>
            {isProductionInput && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Production inputs are purchased for internal use. They do not appear in checkout or
                Quick Sale.
              </Typography>
            )}
          </Stack>

          {/* Name */}
          <TextField
            label="Product Name *"
            fullWidth
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
          />

          {/* Category */}
          <Autocomplete
            options={categories || []}
            getOptionLabel={(opt) =>
              typeof opt === 'object'
                ? opt.name
                : (categories || []).find((c) => c.id === opt)?.name || ''
            }
            isOptionEqualToValue={(opt, val) =>
              opt.id === (typeof val === 'object' ? val?.id : val)
            }
            value={(categories || []).find((c) => c.id === Number(form.category_id)) || null}
            loading={categoriesLoading}
            onChange={(_, newVal) => {
              if (newVal?.__isAddNew) {
                setQuickAddOpen(true);
              } else {
                set('category_id', newVal ? newVal.id : '');
              }
            }}
            filterOptions={(opts, state) => {
              const list = opts || [];
              const filtered = list.filter((o) =>
                (o.name || '').toLowerCase().includes(state.inputValue.toLowerCase())
              );
              filtered.push({
                id: '__add__',
                name: `+ Add "${state.inputValue || 'new category'}"`,
                __isAddNew: true,
              });
              return filtered;
            }}
            renderOption={(props, option) => (
              <li
                {...props}
                key={option.id}
                style={option.__isAddNew ? { color: 'var(--palette-primary-main)', fontWeight: 600 } : {}}
              >
                {option.name}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Category *"
                error={!!errors.category_id}
                helperText={errors.category_id}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {categoriesLoading ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <CategoryQuickAddDialog
            open={quickAddOpen}
            storeId={storeId}
            onClose={() => setQuickAddOpen(false)}
            onCreated={async (newCat) => {
              await mutateCategories();
              setForm((prev) => ({ ...prev, category_id: newCat.id }));
              setErrors((prev) => ({ ...prev, category_id: undefined }));
            }}
          />

          {/* Quantity */}
          <TextField
            label="Quantity in stock *"
            type="number"
            fullWidth
            value={form.quantity}
            inputProps={{ min: 1 }}
            onChange={(e) => set('quantity', e.target.value)}
            error={!!errors.quantity}
            helperText={
              errors.quantity ||
              (totalUnits != null
                ? `Total individual units in stock: ${totalUnits}`
                : undefined)
            }
          />

          <Divider />

          {/* Pack toggle — sellable only */}
          {!isProductionInput && (
            <Stack spacing={1}>
              <Typography variant="subtitle2">Item Type</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_pack}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        is_pack: checked,
                        ...(!checked && {
                          quantity_per_pack: '',
                          cost_price_per_pack: '',
                          pack_sell_price: '',
                        }),
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        quantity_per_pack: undefined,
                        cost_price_per_pack: undefined,
                      }));
                    }}
                  />
                }
                label="This is a pack product (sold in bulk packs)"
              />
            </Stack>
          )}

          {/* Pack-specific fields */}
          {form.is_pack && !isProductionInput && (
            <Stack
              spacing={2}
              sx={{
                pl: 2,
                borderLeft: (t) => `3px solid ${t.palette.primary.light}`,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                A pack bundles multiple individual units (e.g. a crate of 12 bottles). Quantity
                above is the number of packs in stock.
              </Typography>
              <TextField
                label="Units per pack *"
                type="number"
                fullWidth
                value={form.quantity_per_pack}
                inputProps={{ min: 1 }}
                helperText="How many individual items are in one pack"
                onChange={(e) => set('quantity_per_pack', e.target.value)}
                error={!!errors.quantity_per_pack}
              />
              <TextField
                label="Cost per pack *"
                type="number"
                fullWidth
                value={form.cost_price_per_pack}
                helperText="Total purchase cost for one full pack"
                onChange={(e) => set('cost_price_per_pack', e.target.value)}
                error={!!errors.cost_price_per_pack}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{currencySymbol}</InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Pack sell price (optional)"
                type="number"
                fullWidth
                value={form.pack_sell_price}
                helperText="Price when selling a full pack. Leave blank to use per-item price."
                onChange={(e) => set('pack_sell_price', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{currencySymbol}</InputAdornment>
                  ),
                }}
              />
            </Stack>
          )}

          <Divider />

          {/* Pricing */}
          <Stack spacing={2}>
            <Typography variant="subtitle2">Pricing</Typography>

            {isProductionInput ? (
              <TextField
                label="Cost price *"
                type="number"
                fullWidth
                value={form.costPrice}
                helperText="Unit purchase cost — stored for reporting; not shown as a selling price"
                onChange={(e) => set('costPrice', e.target.value)}
                error={!!errors.costPrice}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{currencySymbol}</InputAdornment>
                  ),
                }}
              />
            ) : (
              <>
                <TextField
                  label="Cost price"
                  type="number"
                  fullWidth
                  value={form.costPrice}
                  helperText="Optional — used for profit margin calculations"
                  onChange={(e) => set('costPrice', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{currencySymbol}</InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={form.is_pack ? 'Selling price per item *' : 'Selling price *'}
                  type="number"
                  fullWidth
                  value={form.price}
                  helperText={
                    form.is_pack
                      ? 'Price charged per individual item when selling from a pack'
                      : undefined
                  }
                  onChange={(e) => set('price', e.target.value)}
                  error={!!errors.price}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{currencySymbol}</InputAdornment>
                    ),
                  }}
                />
              </>
            )}
          </Stack>

          <Divider />

          {/* Submit actions */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ flex: 1 }}
            >
              {submitting ? 'Creating...' : 'Create Item'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled={submitting}
              onClick={() => handleSubmit(true)}
              sx={{ flex: 1 }}
            >
              Create &amp; Add Another
            </Button>
          </Stack>

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              onClick={() => router.push(paths.dashboard.product.bulkAdd(storeSlug))}
            >
              Adding many items at once? Use Bulk Add instead →
            </Button>
          </Box>
        </Stack>
      </Card>
    </Stack>
  );
}
