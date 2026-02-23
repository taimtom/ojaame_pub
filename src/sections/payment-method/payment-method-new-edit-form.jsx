import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
// import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { addPaymentMethod, editPaymentMethod } from 'src/actions/paymentmethod';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------
export const NewPaymentMethodSchema = zod.object({
  method_type: zod.enum(
    ['cash','pos','bank_transfer','mobile_money','check','credit','other'],
    { errorMap: () => ({ message: 'Please select a payment type' }) }
  ),
  issuer: zod.string().max(100, 'Issuer name too long').optional(),
  description: zod.string().optional(),
  is_active: zod.boolean({ required_error: 'Active status is required' }),
});

export function PaymentMethodNewEditForm({ currentPaymentMethod, storeId, storeSlug, storeNameSlug }) {
  const router = useRouter();

  const defaultValues = useMemo(() => ({
    method_type: currentPaymentMethod?.method_type || '',
    issuer:      currentPaymentMethod?.issuer      || '',
    description: currentPaymentMethod?.description || '',
    is_active:   currentPaymentMethod
      ? currentPaymentMethod.is_active === 1
      : true,
  }), [currentPaymentMethod]);

  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(NewPaymentMethodSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    if (currentPaymentMethod) reset(defaultValues);
  }, [currentPaymentMethod, defaultValues, reset]);

  const onSubmit = handleSubmit(
    async (data) => {
      const payload = {
        method_type: data.method_type,
        issuer:      data.issuer || null,
        description: data.description || null,
        is_active:   data.is_active ? 1 : 0,
      };

      try {
        if (currentPaymentMethod) {
          await editPaymentMethod(currentPaymentMethod.id, payload, storeId);
          toast.success('Payment method updated!');
        } else {
          await addPaymentMethod(payload, storeId);
          toast.success('Payment method created!');
        }
        reset(defaultValues);
        // Delay navigation by 2 seconds to allow user to see toast
        setTimeout(() => {
          router.push(paths.dashboard.paymentMethod.root(storeSlug));
        }, 2000);
      } catch (err) {
        console.error('PaymentMethod error', err);
        const msg = err.response?.data?.detail || err.message || 'Unknown error';
        toast.error(msg);
      }
    },
    () => {
      toast.error('Please fix the highlighted fields.');
    }
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        <Card>
          <CardHeader
            title={currentPaymentMethod ? 'Edit Payment Method' : 'New Payment Method'}
            subheader="Configure how Cashier can  Pay customers Order"
            sx={{ mb: 3 }}
          />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            {/* Method Type */}
            <Stack spacing={1}>
              {/* <Typography variant="subtitle2">Payment Type</Typography> */}
              <FormControl fullWidth error={!!errors.method_type}>
              <InputLabel id="method-type-label">Payment Type</InputLabel>
              <Controller
                name="method_type"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="method-type-label"
                    label="Payment Type"
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="pos">POS Terminal</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="credit">Credit Card</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                )}
              />
              <FormHelperText>{errors.method_type?.message}</FormHelperText>
            </FormControl>

            </Stack>

            {/* Issuer */}
            <Stack spacing={1}>
              <Typography variant="subtitle2">Issuer (optional)</Typography>
              <Field.Text
                name="issuer"
                placeholder="E.g. First Bank, Stripe"
                helperText={errors.issuer?.message}
              />
            </Stack>

            {/* Description */}
            <Stack spacing={1}>
              <Typography variant="subtitle2">Description (optional)</Typography>
              <Field.Text
                name="description"
                multiline
                rows={4}
                placeholder="Any notes or instructions"
              />
            </Stack>

            {/* Active Toggle */}
            <Stack spacing={1} direction="row" alignItems="center">
  <Controller
    name="is_active"
    control={control}
    render={({ field }) => (
      <>
        <Switch
          checked={field.value}
          // when you flip it, RHF will receive true or false
          onChange={(e) => field.onChange(e.target.checked)}
        />
        <Typography
          variant="body1"
          sx={{ ml: 1, fontWeight: 'medium' }}
        >
          {field.value ? 'Active' : 'Inactive'}
        </Typography>
      </>
    )}
  />
  {errors.is_active && (
    <Typography variant="body2" color="error" sx={{ ml: 2 }}>
      {errors.is_active.message}
    </Typography>
  )}
</Stack>

          </Stack>
        </Card>

        {/* Submit */}
        <Box display="flex" justifyContent="flex-end">
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
          >
            {currentPaymentMethod ? 'Save Changes' : 'Create Method'}
          </LoadingButton>
        </Box>
      </Stack>
    </Form>
  );
}
