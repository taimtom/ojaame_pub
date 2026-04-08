import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';

import { updateProductQuantity } from 'src/actions/product';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const SingleSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  quantity: zod.number().min(0),
  addQuantity: zod.number().min(1, { message: 'Quantity to add must be at least 1!' }),
  totalQuantity: zod.number().min(0).optional(),
  description: zod.string().optional(),
  addAsExpense: zod.boolean(),
});

const PackSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  quantity: zod.number().min(0),
  packsToAdd: zod.number().min(1, { message: 'Number of packs to add must be at least 1!' }),
  description: zod.string().optional(),
  addAsExpense: zod.boolean(),
});

// ----------------------------------------------------------------------

function ReadonlyField({ label, value, icon, color }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 1,
        bgcolor: 'background.neutral',
        border: (theme) => `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon && <Iconify icon={icon} width={18} sx={{ color: color || 'text.secondary' }} />}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="subtitle2" sx={{ color: color || 'text.primary' }}>
        {value}
      </Typography>
    </Stack>
  );
}

// ─── Single item form ────────────────────────────────────────────────────────

function SingleItemForm({ currentProduct, storeSlug }) {
  const router = useRouter();
  const baseQuantity = currentProduct?.quantity ?? 0;

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      quantity: baseQuantity,
      addQuantity: 0,
      totalQuantity: baseQuantity,
      description: '',
      addAsExpense: false,
    }),
    [currentProduct, baseQuantity]
  );

  const methods = useForm({ resolver: zodResolver(SingleSchema), defaultValues });

  const {
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const addQuantity = useWatch({ control: methods.control, name: 'addQuantity' });
  const addAsExpense = useWatch({ control: methods.control, name: 'addAsExpense' });
  const restockCost = (Number(addQuantity) || 0) * Number(currentProduct?.costPrice || 0);

  useEffect(() => {
    setValue('totalQuantity', baseQuantity + (Number(addQuantity) || 0));
  }, [addQuantity, baseQuantity, setValue]);

  useEffect(() => {
    if (currentProduct) reset(defaultValues);
  }, [currentProduct, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const store_id = currentProduct?.store_id || localStorage.getItem('store_id');
      await updateProductQuantity(currentProduct.id, {
        product_id: currentProduct.id,
        store_id: Number(store_id),
        quantity: data.addQuantity,
        status: 'received',
        description: data.description || undefined,
        add_as_expense: data.addAsExpense,
      });
      toast.success('Stock updated successfully!');
      setTimeout(
        () => router.push(paths.dashboard.product.details(storeSlug, currentProduct.id)),
        2000
      );
      reset();
    } catch (error) {
      handleApiError(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        <Card>
          <CardHeader title="Stock Details" subheader="Current stock and quantity to add" sx={{ mb: 3 }} />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text name="name" label="Product name" InputProps={{ readOnly: true }} />

            <ReadonlyField
              icon="solar:box-bold"
              label="Current Stock"
              value={baseQuantity}
              color="text.secondary"
            />

            <Field.Text
              name="addQuantity"
              label="Quantity to add"
              placeholder="0"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText="Enter how many individual units you are adding to stock"
            />

            <ReadonlyField
              icon="solar:arrow-up-bold"
              label="New Total Stock"
              value={baseQuantity + (Number(addQuantity) || 0)}
              color="success.main"
            />

            <Field.Text
              name="description"
              label="Note (optional)"
              placeholder="e.g. Restock from supplier"
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
            />

            <Field.Switch name="addAsExpense" label="Record restock as expense" />

            {addAsExpense && (
              <ReadonlyField
                icon="solar:dollar-minimalistic-bold"
                label="Expense amount"
                value={fCurrency(restockCost)}
                color="warning.main"
              />
            )}
          </Stack>
        </Card>

        <Stack direction="row" alignItems="center" flexWrap="wrap">
          <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
            Add Quantity
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}

// ─── Pack item form ──────────────────────────────────────────────────────────

function PackItemForm({ currentProduct, storeSlug }) {
  const router = useRouter();

  const quantityPerPack = currentProduct?.quantity_per_pack ?? 1;
  const costPricePerPack = currentProduct?.cost_price_per_pack ?? null;
  const currentUnits = currentProduct?.quantity ?? 0;
  const currentPacks = Math.floor(currentUnits / quantityPerPack);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      quantity: currentUnits,
      packsToAdd: 0,
      description: '',
      addAsExpense: false,
    }),
    [currentProduct, currentUnits]
  );

  const methods = useForm({ resolver: zodResolver(PackSchema), defaultValues });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const packsToAdd = useWatch({ control: methods.control, name: 'packsToAdd' });
  const addAsExpense = useWatch({ control: methods.control, name: 'addAsExpense' });

  useEffect(() => {
    if (currentProduct) reset(defaultValues);
  }, [currentProduct, defaultValues, reset]);

  const unitsToAdd = (Number(packsToAdd) || 0) * quantityPerPack;
  const newTotalUnits = currentUnits + unitsToAdd;
  const newTotalPacks = Math.floor(newTotalUnits / quantityPerPack);
  const totalCost =
    costPricePerPack != null ? (Number(packsToAdd) || 0) * costPricePerPack : null;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const store_id = currentProduct?.store_id || localStorage.getItem('store_id');
      const unitsBeingAdded = data.packsToAdd * quantityPerPack;

      await updateProductQuantity(currentProduct.id, {
        product_id: currentProduct.id,
        store_id: Number(store_id),
        quantity: unitsBeingAdded,
        status: 'received',
        description:
          data.description ||
          `${data.packsToAdd} pack(s) received — ${unitsBeingAdded} unit(s) added to stock`,
        add_as_expense: data.addAsExpense,
      });

      toast.success('Stock updated successfully!');
      setTimeout(
        () => router.push(paths.dashboard.product.details(storeSlug, currentProduct.id)),
        2000
      );
      reset();
    } catch (error) {
      handleApiError(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {/* Pack reference info */}
        <Card>
          <CardHeader
            title="Pack Configuration"
            subheader="Reference info for this pack product"
            sx={{ mb: 3 }}
          />
          <Divider />
          <Stack spacing={2} sx={{ p: 3 }}>
            <Box
              display="grid"
              gap={2}
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }}
            >
              <Stack
                spacing={0.5}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'info.lighter',
                  border: (theme) => `1px solid ${theme.palette.info.light}`,
                }}
              >
                <Typography variant="caption" sx={{ color: 'info.dark' }}>
                  Units per Pack
                </Typography>
                <Typography variant="h5" sx={{ color: 'info.dark' }}>
                  {quantityPerPack}
                </Typography>
              </Stack>

              <Stack
                spacing={0.5}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'warning.lighter',
                  border: (theme) => `1px solid ${theme.palette.warning.light}`,
                }}
              >
                <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                  Cost per Pack
                </Typography>
                <Typography variant="h5" sx={{ color: 'warning.dark' }}>
                  {costPricePerPack != null ? fCurrency(costPricePerPack) : '—'}
                </Typography>
              </Stack>

              <Stack
                spacing={0.5}
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'background.neutral',
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Current Stock
                </Typography>
                <Typography variant="h5">
                  {currentUnits} units
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  ≈ {currentPacks} packs
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Card>

        {/* Stock addition */}
        <Card>
          <CardHeader
            title="Add Stock"
            subheader="Enter the number of packs received"
            sx={{ mb: 3 }}
          />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text name="name" label="Product name" InputProps={{ readOnly: true }} />

            <Field.Text
              name="packsToAdd"
              label="Number of packs to add *"
              placeholder="0"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText={`Each pack contains ${quantityPerPack} unit(s)`}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      packs
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />

            {/* Live calculations */}
            {Number(packsToAdd) > 0 && (
              <Stack spacing={1.5}>
                <ReadonlyField
                  icon="solar:layers-bold"
                  label="Units being added"
                  value={`${unitsToAdd} units`}
                  color="success.main"
                />
                <ReadonlyField
                  icon="solar:box-bold"
                  label="New total stock"
                  value={`${newTotalUnits} units (≈ ${newTotalPacks} packs)`}
                  color="primary.main"
                />
                {totalCost != null && (
                  <ReadonlyField
                    icon="solar:dollar-minimalistic-bold"
                    label="Total restock cost"
                    value={fCurrency(totalCost)}
                    color="warning.main"
                  />
                )}

                <Alert severity="info" sx={{ py: 0.5 }}>
                  Adding <strong>{Number(packsToAdd)} pack(s)</strong> → <strong>{unitsToAdd} unit(s)</strong> will be recorded in stock history.
                </Alert>
              </Stack>
            )}

            <Field.Text
              name="description"
              label="Note (optional)"
              placeholder="e.g. Purchased from supplier XYZ"
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
            />

            <Field.Switch name="addAsExpense" label="Record restock as expense" />

            {addAsExpense && totalCost != null && (
              <ReadonlyField
                icon="solar:dollar-minimalistic-bold"
                label="Expense amount"
                value={fCurrency(totalCost)}
                color="warning.main"
              />
            )}
          </Stack>
        </Card>

        <Stack direction="row" alignItems="center" flexWrap="wrap">
          <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
            Add Stock
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}

// ─── Shared error handler ────────────────────────────────────────────────────

function handleApiError(error) {
  let message = 'An unknown error occurred';
  if (error && typeof error === 'object') {
    const { response, message: errMsg, detail: topDetail } = error;
    if (response?.data) {
      const { detail } = response.data;
      if (Array.isArray(detail)) message = detail.join(' ');
      else if (typeof detail === 'string') message = detail;
      else message = JSON.stringify(response.data);
    } else if (topDetail) {
      message =
        typeof topDetail === 'string'
          ? topDetail
          : Array.isArray(topDetail)
          ? topDetail.join(' ')
          : JSON.stringify(topDetail);
    } else if (errMsg) {
      message = errMsg;
    }
  }
  toast.error(message);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ProductAddQuantityForm({ currentProduct, storeSlug, storeId }) {
  const isPack = currentProduct?.is_pack === true;

  return isPack ? (
    <PackItemForm currentProduct={currentProduct} storeSlug={storeSlug} storeId={storeId} />
  ) : (
    <SingleItemForm currentProduct={currentProduct} storeSlug={storeSlug} storeId={storeId} />
  );
}
