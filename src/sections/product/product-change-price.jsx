import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';

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

const RegularChangePriceSchema = zod
  .object({
    price: zod
      .number({ invalid_type_error: 'Sell price is required' })
      .min(0, { message: 'Sell price cannot be negative' }),
    costPrice: zod
      .number({ invalid_type_error: 'Cost price is required' })
      .min(0, { message: 'Cost price cannot be negative' }),
  })
  .refine((data) => data.costPrice <= data.price, {
    message: 'Cost price cannot exceed sell price',
    path: ['costPrice'],
  });

const PackChangePriceSchema = zod
  .object({
    price: zod
      .number({ invalid_type_error: 'Sell price is required' })
      .min(0, { message: 'Sell price cannot be negative' }),
    costPricePerPack: zod
      .number({ invalid_type_error: 'Cost price per pack is required' })
      .min(0, { message: 'Cost price per pack cannot be negative' }),
  })
  .refine(
    (data) => data.costPricePerPack >= 0,
    { message: 'Cost price per pack cannot be negative', path: ['costPricePerPack'] }
  );

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

// ----------------------------------------------------------------------

export function ProductChangePriceForm({ currentProduct, storeSlug }) {
  const router = useRouter();
  const { currencySymbol } = useCurrencyFormat();

  const isPack = Boolean(currentProduct?.is_pack);
  const quantityPerPack = currentProduct?.quantity_per_pack ?? 1;

  const schema = isPack ? PackChangePriceSchema : RegularChangePriceSchema;

  const defaultValues = useMemo(() => {
    if (isPack) {
      return {
        price: currentProduct?.price ?? 0,
        costPricePerPack: currentProduct?.cost_price_per_pack ?? 0,
      };
    }
    return {
      price: currentProduct?.price ?? 0,
      costPrice: currentProduct?.costPrice ?? 0,
    };
  }, [currentProduct, isPack]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    if (!currentProduct) return;

    try {
      const payload = isPack
        ? { price: data.price, cost_price_per_pack: data.costPricePerPack }
        : { price: data.price, costPrice: data.costPrice };

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
