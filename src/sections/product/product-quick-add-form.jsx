import { useState } from 'react';

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
import { withOnboardingQuery } from 'src/utils/onboarding-routes';
import { addProduct } from 'src/actions/product';
import { useOnboardingProgress } from 'src/actions/onboarding';
import { useAdvanceOnboarding, useOnboardingMode } from 'src/hooks/use-onboarding-mode';
import { useGetCategories } from 'src/actions/category';
import { CategoryQuickAddDialog } from './category-quick-add-dialog';
import { toast } from 'src/components/snackbar';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';
import { VoiceInputBar } from 'src/sections/voice';

// ----------------------------------------------------------------------

const EMPTY_FORM = {
  name: '',
  category_id: '',
  quantity: 1,
  product_kind: 'sellable',
  is_pack: false,
  costPrice: '',
  price: '',
  allow_variable_price: false,
  variable_price_min: '',
  quantity_per_pack: '',
  cost_price_per_pack: '',
  pack_sell_price: '',
};

function buildCreatedProductSnapshot(form, productId) {
  const isPack = Boolean(form.is_pack && form.product_kind === 'sellable');
  const packsInStock = Number(form.quantity) || 0;
  const quantityPerPack = isPack ? Number(form.quantity_per_pack) || 0 : null;
  const unitStock = isPack ? packsInStock * (quantityPerPack || 0) : packsInStock;

  return {
    id: productId,
    name: form.name.trim(),
    stock: unitStock,
    quantity: unitStock,
    is_pack: isPack,
    quantity_per_pack: quantityPerPack,
    cost_price: form.costPrice !== '' ? Number(form.costPrice) : 0,
    cost_price_per_pack:
      form.cost_price_per_pack !== '' ? Number(form.cost_price_per_pack) : null,
  };
}

// ----------------------------------------------------------------------

export function ProductQuickAddForm({
  storeId,
  storeSlug,
  defaultQuantity = 1,
  allowZeroQuantity = false,
  embedded = false,
  onCreated,
  onCancel,
}) {
  const router = useRouter();
  const onboarding = useOnboardingMode();
  const advanceOnboarding = useAdvanceOnboarding();
  const { mutateProgress } = useOnboardingProgress({ skip: !onboarding });
  const { currencySymbol } = useCurrencyFormat();
  const { categories, categoriesLoading, mutateCategories } = useGetCategories(storeId, {
    published_only: true,
  });

  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, quantity: defaultQuantity }));
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [addedCount, setAddedCount] = useState(0);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.category_id) errs.category_id = 'Category is required';
    const qtyNum = Number(form.quantity);
    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      errs.quantity = 'Quantity cannot be negative';
    } else if (!allowZeroQuantity && qtyNum < 1) {
      errs.quantity = 'Quantity must be at least 1';
    }
    if (form.product_kind === 'sellable') {
      if (!form.price || Number(form.price) < 1) {
        errs.price = form.allow_variable_price
          ? 'Max selling price must be at least 1'
          : 'Selling price must be at least 1';
      }

      if (form.allow_variable_price) {
        const minNum = Number(form.variable_price_min);
        const maxNum = Number(form.price);
        if (form.variable_price_min === '' || Number.isNaN(minNum) || minNum < 1) {
          errs.variable_price_min = 'Min selling price must be at least 1';
        } else if (!Number.isNaN(maxNum) && minNum > maxNum) {
          errs.variable_price_min = 'Min selling price cannot be greater than max selling price';
        }
      }
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

  const handleSubmit = async () => {
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
      show_on_store: true,
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

    if (!isProductionInput && form.allow_variable_price) {
      payload.allow_variable_price = true;
      payload.variable_price_min = Number(form.variable_price_min);
      payload.variable_price_max = Number(form.price);
    }

    setSubmitting(true);
    try {
      const response = await addProduct(payload);
      const productId = response?.product_id ?? response?.id;
      toast.success(`"${form.name}" created!`);
      if (onCreated) {
        onCreated(buildCreatedProductSnapshot(form, productId));
      }
      setAddedCount((prev) => prev + 1);
      if (onboarding) {
        await mutateProgress();
      }
      if (!embedded) {
        setForm({ ...EMPTY_FORM, quantity: defaultQuantity });
        setErrors({});
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

  const quantityLabel = form.is_pack && !isProductionInput
    ? 'Packs in stock *'
    : 'Quantity in stock *';
  const quantityMin = allowZeroQuantity ? 0 : 1;
  const quantityHelper =
    errors.quantity ||
    (allowZeroQuantity
      ? 'Start at 0 if you will add stock via restock.'
      : totalUnits != null
        ? `Total individual units in stock: ${totalUnits}`
        : undefined);

  return (
    <Stack spacing={embedded ? 2 : 3}>
      <Card sx={{ p: embedded ? 0 : 3, boxShadow: embedded ? 'none' : undefined }}>
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <VoiceInputBar
              storeId={storeId}
              intentHint="add_product"
              disabled={!storeId}
              onConfirm={(draft) => {
                if (draft?.name) set('name', draft.name);
                if (draft?.quantity != null) set('quantity', draft.quantity);
                if (draft?.price != null && draft.price !== '') set('price', draft.price);
                if (draft?.cost != null && draft.cost !== '') set('costPrice', draft.cost);
                toast.success('Filled from voice — review and save.');
              }}
            />
          </Stack>

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
                    allow_variable_price: false,
                    variable_price_min: '',
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
            label={quantityLabel}
            type="number"
            fullWidth
            value={form.quantity}
            inputProps={{ min: quantityMin }}
            onChange={(e) => set('quantity', e.target.value)}
            error={!!errors.quantity}
            helperText={quantityHelper}
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
                  label={
                    form.allow_variable_price
                      ? form.is_pack
                        ? 'Max selling price per item *'
                        : 'Max selling price *'
                      : form.is_pack
                        ? 'Selling price per item *'
                        : 'Selling price *'
                  }
                  type="number"
                  fullWidth
                  value={form.price}
                  helperText={
                    errors.price ||
                    (form.allow_variable_price
                      ? 'Used as the highest allowed selling price.'
                      : form.is_pack
                        ? 'Price charged per individual item when selling from a pack'
                        : undefined)
                  }
                  onChange={(e) => set('price', e.target.value)}
                  error={!!errors.price}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{currencySymbol}</InputAdornment>
                    ),
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.allow_variable_price}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setForm((prev) => ({
                          ...prev,
                          allow_variable_price: enabled,
                          ...(!enabled && { variable_price_min: '' }),
                        }));
                        setErrors((prev) => ({
                          ...prev,
                          variable_price_min: undefined,
                        }));
                      }}
                    />
                  }
                  label="Allow variable pricing"
                />
                {form.allow_variable_price && (
                  <TextField
                    label={form.is_pack ? 'Min selling price per item *' : 'Min selling price *'}
                    type="number"
                    fullWidth
                    value={form.variable_price_min}
                    helperText={errors.variable_price_min || 'Lowest allowed selling price.'}
                    onChange={(e) => set('variable_price_min', e.target.value)}
                    error={!!errors.variable_price_min}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">{currencySymbol}</InputAdornment>
                      ),
                    }}
                  />
                )}
              </>
            )}
          </Stack>

          <Divider />

          {/* Submit actions */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {embedded && onCancel && (
              <Button variant="outlined" size="large" disabled={submitting} onClick={onCancel} sx={{ flex: 1 }}>
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              size="large"
              disabled={submitting}
              onClick={() => handleSubmit()}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{ flex: 1 }}
            >
              {submitting ? 'Creating...' : embedded ? 'Create product' : 'Create Item'}
            </Button>
            {onboarding && addedCount > 0 && (
              <Button
                variant="contained"
                color="success"
                size="large"
                disabled={submitting}
                onClick={() => advanceOnboarding()}
                sx={{ flex: 1 }}
              >
                Next
              </Button>
            )}
          </Stack>

          {!embedded && addedCount > 0 && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              {addedCount} item{addedCount === 1 ? '' : 's'} added this session
            </Typography>
          )}

          {!embedded && (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                onClick={() =>
                  router.push(
                    onboarding
                      ? withOnboardingQuery(paths.dashboard.product.bulkAdd(storeSlug))
                      : paths.dashboard.product.bulkAdd(storeSlug)
                  )
                }
              >
                Adding many items at once? Use Bulk Add instead →
              </Button>
            </Box>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
