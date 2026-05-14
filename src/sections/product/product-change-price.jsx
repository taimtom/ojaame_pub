import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { changeProductPrice } from 'src/actions/product';
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const numFromForm = (v) => (v === '' || v === undefined || v === null ? undefined : Number(v));

const variablePriceFields = {
  allow_variable_price: zod.boolean().default(false),
  variable_price_min: zod.preprocess(numFromForm, zod.number().optional()),
};

function buildRegularChangePriceSchema() {
  return zod
    .object({
      price: zod.coerce
        .number({ invalid_type_error: 'Sell price is required' })
        .min(0, { message: 'Sell price cannot be negative' }),
      costPrice: zod.coerce
        .number({ invalid_type_error: 'Cost price is required' })
        .min(0, { message: 'Cost price cannot be negative' }),
      ...variablePriceFields,
    })
    .refine((data) => data.costPrice <= data.price, {
      message: 'Cost price cannot exceed sell price',
      path: ['costPrice'],
    })
    .refine((data) => {
      if (!data.allow_variable_price) return true;
      return data.variable_price_min !== undefined && !Number.isNaN(data.variable_price_min);
    }, { message: 'Enter a minimum price', path: ['variable_price_min'] })
    .refine((data) => {
      if (!data.allow_variable_price) return true;
      return (data.variable_price_min ?? 0) >= data.costPrice - 1e-9;
    }, {
      message: 'Minimum must be greater than or equal to cost price',
      path: ['variable_price_min'],
    })
    .refine((data) => {
      if (!data.allow_variable_price) return true;
      return (data.variable_price_min ?? 0) <= data.price + 1e-9;
    }, {
      message: 'Minimum cannot exceed sell price',
      path: ['variable_price_min'],
    });
}

function buildPackChangePriceSchema(quantityPerPack) {
  const qpp = quantityPerPack > 0 ? quantityPerPack : 1;
  return zod
    .object({
      price: zod.coerce
        .number({ invalid_type_error: 'Sell price is required' })
        .min(0, { message: 'Sell price cannot be negative' }),
      costPricePerPack: zod.coerce
        .number({ invalid_type_error: 'Cost price per pack is required' })
        .min(0, { message: 'Cost price per pack cannot be negative' }),
      ...variablePriceFields,
    })
    .refine((data) => data.costPricePerPack >= 0, {
      message: 'Cost price per pack cannot be negative',
      path: ['costPricePerPack'],
    })
    .refine((data) => {
      if (!data.allow_variable_price) return true;
      return data.variable_price_min !== undefined && !Number.isNaN(data.variable_price_min);
    }, { message: 'Enter a minimum price', path: ['variable_price_min'] })
    .refine((data) => {
      if (!data.allow_variable_price) return true;
      const unitCost = data.costPricePerPack / qpp;
      return (data.variable_price_min ?? 0) >= unitCost - 1e-9;
    }, {
      message: 'Minimum must be greater than or equal to unit cost (cost per pack ÷ units per pack)',
      path: ['variable_price_min'],
    })
    .refine((data) => {
      if (!data.allow_variable_price) return true;
      return (data.variable_price_min ?? 0) <= data.price + 1e-9;
    }, {
      message: 'Minimum cannot exceed sell price (per unit)',
      path: ['variable_price_min'],
    });
}

// ----------------------------------------------------------------------

function RegularPriceFields({ currencySymbol }) {
  return (
    <Stack spacing={2}>
      <Field.Text
        name="price"
        label="New sell price"
        type="number"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
        }}
      />
      <Field.Text
        name="costPrice"
        label="New cost price"
        type="number"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
        }}
      />
    </Stack>
  );
}

function PackPriceFields({ currencySymbol, quantityPerPack }) {
  const costPricePerPack = useWatch({ name: 'costPricePerPack' });
  const derivedUnitCost =
    quantityPerPack && costPricePerPack >= 0
      ? costPricePerPack / quantityPerPack
      : null;

  return (
    <Stack spacing={2}>
      <Field.Text
        name="price"
        label="New sell price (per unit)"
        type="number"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
        }}
      />
      <Field.Text
        name="costPricePerPack"
        label={`New cost price per pack (${quantityPerPack ?? '?'} units)`}
        type="number"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
        }}
      />
      {derivedUnitCost !== null && (
        <Typography variant="caption" color="text.secondary">
          Derived unit cost: {fCurrency(derivedUnitCost)}
        </Typography>
      )}
    </Stack>
  );
}

function VariablePriceFields({ currencySymbol, sellPriceLabel }) {
  const allow = useWatch({ name: 'allow_variable_price' });

  if (!allow) return null;

  return (
    <Stack spacing={1.5}>
      <Field.Text
        name="variable_price_min"
        label="Minimum price (variable range)"
        type="number"
        InputLabelProps={{ shrink: true }}
        InputProps={{
          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>,
        }}
        helperText="Must be at least the cost (or unit cost for packs) and not above the new sell price."
      />
      <Typography variant="caption" color="text.secondary">
        {sellPriceLabel}
      </Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function ProductChangePriceForm({ currentProduct, storeSlug }) {
  const router = useRouter();
  const { currencySymbol } = useCurrencyFormat();

  const isPack = Boolean(currentProduct?.is_pack);
  const quantityPerPack = currentProduct?.quantity_per_pack ?? 1;
  const isProductionInput = currentProduct?.product_kind === 'production_input';

  const schema = useMemo(
    () => (isPack ? buildPackChangePriceSchema(quantityPerPack) : buildRegularChangePriceSchema()),
    [isPack, quantityPerPack]
  );

  const defaultValues = useMemo(() => {
    const baseVar = {
      allow_variable_price: isProductionInput
        ? false
        : Boolean(currentProduct?.allow_variable_price),
      variable_price_min:
        currentProduct?.variable_price_min != null && currentProduct?.variable_price_min !== ''
          ? currentProduct.variable_price_min
          : '',
    };
    if (isPack) {
      return {
        price: currentProduct?.price ?? 0,
        costPricePerPack: currentProduct?.cost_price_per_pack ?? 0,
        ...baseVar,
      };
    }
    return {
      price: currentProduct?.price ?? 0,
      costPrice: currentProduct?.costPrice ?? 0,
      ...baseVar,
    };
  }, [currentProduct, isPack, isProductionInput]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const allowVariablePrice = useWatch({
    control: methods.control,
    name: 'allow_variable_price',
  });

  useEffect(() => {
    if (!allowVariablePrice) {
      methods.setValue('variable_price_min', '', { shouldValidate: false, shouldDirty: false });
    }
  }, [allowVariablePrice, methods]);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (!currentProduct) return;

    try {
      const allowVar = !isProductionInput && data.allow_variable_price;

      const payload = isPack
        ? {
            price: data.price,
            cost_price_per_pack: data.costPricePerPack,
            allow_variable_price: allowVar,
            ...(allowVar && { variable_price_min: Number(data.variable_price_min) }),
          }
        : {
            price: data.price,
            costPrice: data.costPrice,
            allow_variable_price: allowVar,
            ...(allowVar && { variable_price_min: Number(data.variable_price_min) }),
          };

      await changeProductPrice(currentProduct.id, payload);
      toast.success('Prices updated successfully');
      router.push(paths.dashboard.product.details(storeSlug, currentProduct.id));
    } catch (error) {
      const message =
        error?.response?.data?.detail || error?.message || 'Failed to update prices';
      toast.error(message);
    }
  });

  if (!currentProduct) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading product...
      </Typography>
    );
  }

  const maxCapNote = isPack
    ? 'Maximum sellable price (cap) is the new per-unit sell price above — same as your list price for this SKU.'
    : 'Maximum sellable price (cap) is the new sell price above — it acts as the ceiling when variable pricing is on.';

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        <Card>
          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography variant="h6">Change Price</Typography>
            <Typography variant="body2" color="text.secondary">
              Update the cost price and selling price for{' '}
              <strong>{currentProduct.name}</strong>.
              {isPack && (
                <> This is a pack product ({quantityPerPack} units per pack).</>
              )}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="subtitle2">Current values</Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" color="text.secondary">
                Current sell price: {fCurrency(currentProduct.price ?? 0)}
              </Typography>
              {isPack ? (
                <Typography variant="body2" color="text.secondary">
                  Current cost price per pack:{' '}
                  {fCurrency(currentProduct.cost_price_per_pack ?? 0)}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Current cost price: {fCurrency(currentProduct.costPrice ?? 0)}
                </Typography>
              )}
              {!isProductionInput && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Variable pricing:{' '}
                    {currentProduct.allow_variable_price ? 'On' : 'Off'}
                  </Typography>
                  {currentProduct.allow_variable_price && (
                    <Typography variant="body2" color="text.secondary">
                      Current min / max: {fCurrency(currentProduct.variable_price_min ?? 0)} —{' '}
                      {fCurrency(currentProduct.variable_price_max ?? currentProduct.price ?? 0)}
                    </Typography>
                  )}
                </>
              )}
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {isPack ? (
              <PackPriceFields
                currencySymbol={currencySymbol}
                quantityPerPack={quantityPerPack}
              />
            ) : (
              <RegularPriceFields currencySymbol={currencySymbol} />
            )}

            {!isProductionInput && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Field.Switch
                  name="allow_variable_price"
                  label="Allow variable pricing"
                  helperText="When enabled, staff can sell within a range. The ceiling is always your new sell price."
                />
                <VariablePriceFields
                  currencySymbol={currencySymbol}
                  sellPriceLabel={maxCapNote}
                />
              </>
            )}
          </Stack>
        </Card>

        <Stack direction="row" alignItems="center" flexWrap="wrap">
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
          >
            Save prices
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
