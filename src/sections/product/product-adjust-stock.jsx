import { z as zod } from 'zod';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';

import { adjustProductStock } from 'src/actions/product';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const LOSS_REASONS = [
  { value: 'damaged',  label: 'Damaged',  icon: 'solar:danger-triangle-bold',  color: 'error' },
  { value: 'wasted',   label: 'Wasted',   icon: 'solar:trash-bin-2-bold',       color: 'warning' },
  { value: 'expired',  label: 'Expired',  icon: 'solar:calendar-date-bold',     color: 'warning' },
  { value: 'stolen',   label: 'Stolen',   icon: 'solar:shield-warning-bold',    color: 'error' },
  { value: 'lost',     label: 'Lost',     icon: 'solar:question-square-bold',   color: 'default' },
];

const AdjustSchema = zod.object({
  name: zod.string().min(1),
  reason: zod.string().min(1, { message: 'Please select a reason.' }),
  quantity: zod.number().min(1, { message: 'Quantity must be at least 1.' }),
  description: zod.string().optional(),
  addAsExpense: zod.boolean(),
});

const PackAdjustSchema = zod.object({
  name: zod.string().min(1),
  reason: zod.string().min(1, { message: 'Please select a reason.' }),
  lossMode: zod.enum(['units', 'packs']),
  quantityLost: zod.number().min(1, { message: 'Quantity must be at least 1.' }),
  description: zod.string().optional(),
  addAsExpense: zod.boolean(),
});

// ----------------------------------------------------------------------

function ReadonlyInfo({ icon, label, value, color }) {
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

// ─── Single-item form ────────────────────────────────────────────────────────

function SingleAdjustForm({ currentProduct, storeSlug }) {
  const router = useRouter();
  const currentStock = currentProduct?.quantity ?? 0;

  const defaultValues = useMemo(
    () => ({ name: currentProduct?.name || '', reason: '', quantity: 1, description: '', addAsExpense: true }),
    [currentProduct]
  );

  const methods = useForm({ resolver: zodResolver(AdjustSchema), defaultValues });
  const { reset, handleSubmit, formState: { isSubmitting } } = methods;

  const quantity = useWatch({ control: methods.control, name: 'quantity' });
  const reason   = useWatch({ control: methods.control, name: 'reason' });
  const addAsExpense = useWatch({ control: methods.control, name: 'addAsExpense' });

  useEffect(() => { if (currentProduct) reset(defaultValues); }, [currentProduct, defaultValues, reset]);

  const deductQty   = Math.max(Number(quantity) || 0, 0);
  const newStock    = currentStock - deductQty;
  const overDeduct  = deductQty > currentStock;
  const selectedReason = LOSS_REASONS.find((r) => r.value === reason);
  const lossValue = deductQty * Number(currentProduct?.costPrice || 0);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const store_id = currentProduct?.store_id || localStorage.getItem('store_id');
      await adjustProductStock(currentProduct.id, {
        product_id: currentProduct.id,
        store_id: Number(store_id),
        quantity: data.quantity,
        reason: data.reason,
        description: data.description || undefined,
        add_as_expense: data.addAsExpense,
      });
      toast.success('Stock adjustment recorded!');
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
          <CardHeader title="Record Stock Loss" subheader="Select a reason and enter the quantity lost" sx={{ mb: 3 }} />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text name="name" label="Product name" InputProps={{ readOnly: true }} />

            <ReadonlyInfo
              icon="solar:box-bold"
              label="Current Stock"
              value={currentStock}
            />

            {/* Reason selector */}
            <Field.Select name="reason" label="Reason for loss *" InputLabelProps={{ shrink: true }}>
              {LOSS_REASONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Iconify icon={opt.icon} width={18} sx={{ color: `${opt.color}.main` }} />
                    <span>{opt.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="quantity"
              label="Quantity lost *"
              placeholder="0"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText="How many units were lost / removed"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>units</Typography>
                  </InputAdornment>
                ),
              }}
            />

            {deductQty > 0 && (
              <Stack spacing={1.5}>
                {overDeduct ? (
                  <Alert severity="error">
                    Cannot deduct <strong>{deductQty}</strong> — only <strong>{currentStock}</strong> in stock.
                  </Alert>
                ) : (
                  <>
                    <ReadonlyInfo
                      icon="solar:arrow-down-bold"
                      label="Units being removed"
                      value={`${deductQty} units`}
                      color="error.main"
                    />
                    <ReadonlyInfo
                      icon="solar:box-bold"
                      label="Stock after adjustment"
                      value={newStock}
                      color={newStock === 0 ? 'error.main' : newStock <= 5 ? 'warning.main' : 'success.main'}
                    />
                    {selectedReason && (
                      <Alert
                        severity={selectedReason.color === 'error' ? 'error' : 'warning'}
                        icon={<Iconify icon={selectedReason.icon} width={20} />}
                        sx={{ py: 0.5 }}
                      >
                        Recording <strong>{deductQty} unit(s)</strong> as <strong>{selectedReason.label}</strong>.
                        This will be logged to stock history.
                      </Alert>
                    )}
                  </>
                )}
              </Stack>
            )}

            <Field.Text
              name="description"
              label="Note (optional)"
              placeholder="e.g. Bag burst during delivery, 3 items found damaged on shelf"
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
            />

            <Field.Switch name="addAsExpense" label="Book loss value as expense (P&L)" />

            {addAsExpense && Number(currentProduct?.costPrice || 0) > 0 && deductQty > 0 && (
              <ReadonlyInfo
                icon="solar:dollar-minimalistic-bold"
                label="Loss value"
                value={fCurrency(lossValue)}
                color="warning.main"
              />
            )}
          </Stack>
        </Card>

        <Stack direction="row" alignItems="center" flexWrap="wrap">
          <LoadingButton
            type="submit"
            variant="contained"
            color="error"
            size="large"
            loading={isSubmitting}
            disabled={overDeduct}
            startIcon={<Iconify icon="solar:danger-triangle-bold" />}
          >
            Record Loss
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}

// ─── Pack form (single units or whole packs) ───────────────────────────────

function PackAdjustForm({ currentProduct, storeSlug }) {
  const router = useRouter();

  const quantityPerPack = currentProduct?.quantity_per_pack ?? 1;
  const costPricePerUnit = Number(currentProduct?.costPrice || 0);
  const costPricePerPack = currentProduct?.cost_price_per_pack ?? null;
  const currentUnits = currentProduct?.quantity ?? 0;
  const currentPacks = Math.floor(currentUnits / quantityPerPack);

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      reason: '',
      lossMode: 'units',
      quantityLost: 1,
      description: '',
      addAsExpense: true,
    }),
    [currentProduct]
  );

  const methods = useForm({ resolver: zodResolver(PackAdjustSchema), defaultValues });
  const { reset, handleSubmit, setValue, control, formState: { isSubmitting } } = methods;

  const lossMode = useWatch({ control: methods.control, name: 'lossMode' });
  const quantityLost = useWatch({ control: methods.control, name: 'quantityLost' });
  const reason = useWatch({ control: methods.control, name: 'reason' });
  const addAsExpense = useWatch({ control: methods.control, name: 'addAsExpense' });

  useEffect(() => {
    if (currentProduct) reset(defaultValues);
  }, [currentProduct, defaultValues, reset]);

  const qtyEntered = Math.max(Number(quantityLost) || 0, 0);
  const isPackMode = lossMode === 'packs';
  const unitsToDeduct = isPackMode ? qtyEntered * quantityPerPack : qtyEntered;
  const packsEquivalent = isPackMode ? qtyEntered : qtyEntered / quantityPerPack;
  const newUnits = currentUnits - unitsToDeduct;
  const overDeduct = unitsToDeduct > currentUnits;
  const selectedReason = LOSS_REASONS.find((r) => r.value === reason);
  const totalCost =
    costPricePerUnit > 0
      ? unitsToDeduct * costPricePerUnit
      : costPricePerPack != null && isPackMode
        ? qtyEntered * costPricePerPack
        : null;

  const handleLossModeChange = (field, value) => {
    if (value) {
      field.onChange(value);
      setValue('quantityLost', 1);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const store_id = currentProduct?.store_id || localStorage.getItem('store_id');
      const unitsLost =
        data.lossMode === 'packs' ? data.quantityLost * quantityPerPack : data.quantityLost;

      const defaultDescription =
        data.lossMode === 'packs'
          ? `${data.quantityLost} pack(s) ${data.reason} — ${unitsLost} unit(s) removed from stock`
          : `${data.quantityLost} unit(s) ${data.reason} from pack stock (${quantityPerPack} per pack)`;

      await adjustProductStock(currentProduct.id, {
        product_id: currentProduct.id,
        store_id: Number(store_id),
        quantity: unitsLost,
        reason: data.reason,
        description: data.description || defaultDescription,
        add_as_expense: data.addAsExpense,
      });
      toast.success('Stock adjustment recorded!');
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
          <CardHeader
            title="Record Stock Loss"
            subheader={`This is a pack product (${quantityPerPack} units per pack). Record loss by single unit or whole pack.`}
            sx={{ mb: 3 }}
          />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Field.Text name="name" label="Product name" InputProps={{ readOnly: true }} />

            <Box
              display="grid"
              gap={2}
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }}
            >
              <ReadonlyInfo
                icon="solar:layers-bold"
                label="Units per pack"
                value={quantityPerPack}
              />
              <ReadonlyInfo
                icon="solar:box-bold"
                label="Current stock"
                value={`${currentUnits} units (≈ ${currentPacks} packs)`}
              />
              <ReadonlyInfo
                icon="solar:dollar-minimalistic-bold"
                label="Cost per unit"
                value={
                  costPricePerUnit > 0
                    ? fCurrency(costPricePerUnit)
                    : costPricePerPack != null
                      ? fCurrency(costPricePerPack / quantityPerPack)
                      : '—'
                }
              />
            </Box>

            <Field.Select name="reason" label="Reason for loss *" InputLabelProps={{ shrink: true }}>
              {LOSS_REASONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Iconify icon={opt.icon} width={18} sx={{ color: `${opt.color}.main` }} />
                    <span>{opt.label}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Field.Select>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                What are you recording?
              </Typography>
              <Controller
                name="lossMode"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    value={field.value}
                    onChange={(_event, value) => handleLossModeChange(field, value)}
                  >
                    <ToggleButton value="units">
                      Single units
                      <Typography component="span" variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                        e.g. 1 bottle burst
                      </Typography>
                    </ToggleButton>
                    <ToggleButton value="packs">
                      Whole packs
                      <Typography component="span" variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                        e.g. 1 full pack lost
                      </Typography>
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </Box>

            <Field.Text
              name="quantityLost"
              label={isPackMode ? 'Number of packs lost *' : 'Number of units lost *'}
              placeholder="0"
              type="number"
              InputLabelProps={{ shrink: true }}
              helperText={
                isPackMode
                  ? `Each pack = ${quantityPerPack} unit(s). Max ${currentPacks} pack(s) in stock.`
                  : `Loose units from opened packs. Max ${currentUnits} unit(s) in stock.`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                      {isPackMode ? 'packs' : 'units'}
                    </Typography>
                  </InputAdornment>
                ),
              }}
            />

            {qtyEntered > 0 && (
              <Stack spacing={1.5}>
                {overDeduct ? (
                  <Alert severity="error">
                    {isPackMode ? (
                      <>
                        Cannot deduct <strong>{unitsToDeduct} units</strong> ({qtyEntered} pack
                        {qtyEntered === 1 ? '' : 's'}) — only <strong>{currentUnits}</strong>{' '}
                        units ({currentPacks} pack{currentPacks === 1 ? '' : 's'}) in stock.
                      </>
                    ) : (
                      <>
                        Cannot deduct <strong>{qtyEntered} units</strong> — only{' '}
                        <strong>{currentUnits}</strong> in stock.
                      </>
                    )}
                  </Alert>
                ) : (
                  <>
                    <ReadonlyInfo
                      icon="solar:arrow-down-bold"
                      label="Units being removed"
                      value={
                        isPackMode
                          ? `${unitsToDeduct} units (${qtyEntered} pack${qtyEntered === 1 ? '' : 's'})`
                          : `${unitsToDeduct} unit${unitsToDeduct === 1 ? '' : 's'}`
                      }
                      color="error.main"
                    />
                    {!isPackMode && qtyEntered > 0 && quantityPerPack > 1 && (
                      <ReadonlyInfo
                        icon="solar:layers-bold"
                        label="Pack equivalent"
                        value={`≈ ${packsEquivalent.toFixed(2)} pack(s)`}
                      />
                    )}
                    <ReadonlyInfo
                      icon="solar:box-bold"
                      label="Stock after adjustment"
                      value={`${newUnits} units (≈ ${Math.floor(newUnits / quantityPerPack)} full packs)`}
                      color={
                        newUnits === 0 ? 'error.main' : newUnits <= 5 ? 'warning.main' : 'success.main'
                      }
                    />
                    {selectedReason && (
                      <Alert
                        severity={selectedReason.color === 'error' ? 'error' : 'warning'}
                        icon={<Iconify icon={selectedReason.icon} width={20} />}
                        sx={{ py: 0.5 }}
                      >
                        {isPackMode ? (
                          <>
                            Recording <strong>{qtyEntered} pack(s)</strong> ({unitsToDeduct} units)
                            as <strong>{selectedReason.label}</strong>.
                          </>
                        ) : (
                          <>
                            Recording <strong>{qtyEntered} unit(s)</strong> as{' '}
                            <strong>{selectedReason.label}</strong>.
                          </>
                        )}{' '}
                        This will be logged to stock history.
                      </Alert>
                    )}
                  </>
                )}
              </Stack>
            )}

            <Field.Text
              name="description"
              label="Note (optional)"
              placeholder={
                isPackMode
                  ? 'e.g. Whole pack fell off truck during delivery'
                  : 'e.g. 1 bottle burst during transport from warehouse'
              }
              multiline
              rows={2}
              InputLabelProps={{ shrink: true }}
            />

            <Field.Switch name="addAsExpense" label="Book loss value as expense (P&L)" />

            {addAsExpense && totalCost != null && unitsToDeduct > 0 && (
              <ReadonlyInfo
                icon="solar:dollar-minimalistic-bold"
                label="Loss value"
                value={fCurrency(totalCost)}
                color="warning.main"
              />
            )}
          </Stack>
        </Card>

        <Stack direction="row" alignItems="center" flexWrap="wrap">
          <LoadingButton
            type="submit"
            variant="contained"
            color="error"
            size="large"
            loading={isSubmitting}
            disabled={overDeduct || qtyEntered === 0}
            startIcon={<Iconify icon="solar:danger-triangle-bold" />}
          >
            Record Loss
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function ProductAdjustStockForm({ currentProduct, storeSlug, storeId }) {
  const isPack = currentProduct?.is_pack === true;

  return isPack ? (
    <PackAdjustForm currentProduct={currentProduct} storeSlug={storeSlug} storeId={storeId} />
  ) : (
    <SingleAdjustForm currentProduct={currentProduct} storeSlug={storeSlug} storeId={storeId} />
  );
}
