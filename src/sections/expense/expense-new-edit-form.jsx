import { z as zod } from 'zod';
import { useMemo, useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { EXPENSE_CATEGORIES } from 'src/_mock/expenses';
import { addExpense, editExpense } from 'src/actions/expense';
import { useGetProducts } from 'src/actions/product';
import { useGetServices } from 'src/actions/service';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------
export const NewExpenseSchema = zod.object({
  category: zod.enum(
    EXPENSE_CATEGORIES.map((opt) => opt.value),
    { errorMap: () => ({ message: 'Select a valid category' }) }
  ),
  expense_type: zod.enum(['CAPEX', 'OPEX'], {
    errorMap: () => ({ message: 'Select an expense type' }),
  }).optional().nullable(),
  amount: zod.number().min(0.01, 'Amount must be greater than 0'),
  description: zod.string().optional(),
  expense_date: schemaHelper.date({
    message: { required_error: 'Expired date is required!' },
  }),
  linked_item_type: zod.string().optional().nullable(),
  linked_item_id: zod.number().optional().nullable(),
  is_tax_deductible: zod.boolean().optional().default(true),
  exclude_from_pnl: zod.boolean().optional().default(false),
  vat_amount: zod.number().min(0).optional().default(0),
  vat_claimable: zod.boolean().optional().default(true),
  wht_applicable: zod.boolean().optional().default(false),
  wht_rate: zod.number().min(0).max(1).optional().default(0),
  wht_amount: zod.number().min(0).optional().default(0),
});

export function ExpenseNewEditForm({ currentExpense, storeId }) {
  const router = useRouter();

  const [linkedItemType, setLinkedItemType] = useState(
    currentExpense?.linked_item_type || ''
  );

  const { products } = useGetProducts(storeId);
  const { services } = useGetServices(storeId);

  const defaultValues = useMemo(
    () => ({
      category: currentExpense?.category || '',
      expense_type: currentExpense?.expense_type || null,
      amount: currentExpense?.amount || 0,
      description: currentExpense?.description || '',
      expense_date: currentExpense ? new Date(currentExpense.expense_date) : new Date(),
      linked_item_type: currentExpense?.linked_item_type || null,
      linked_item_id: currentExpense?.linked_item_id || null,
      is_tax_deductible: currentExpense?.is_tax_deductible ?? true,
      exclude_from_pnl: currentExpense?.exclude_from_pnl ?? false,
      vat_amount: currentExpense?.vat_amount || 0,
      vat_claimable: currentExpense?.vat_claimable ?? true,
      wht_applicable: currentExpense?.wht_applicable ?? false,
      wht_rate: currentExpense?.wht_rate || 0,
      wht_amount: currentExpense?.wht_amount || 0,
    }),
    [currentExpense]
  );

  const { currencySymbol } = useCurrencyFormat();
  const methods = useForm({
    mode: 'onBlur',
    resolver: zodResolver(NewExpenseSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    if (currentExpense) {
      reset(defaultValues);
      setLinkedItemType(currentExpense?.linked_item_type || '');
    }
  }, [currentExpense, defaultValues, reset]);

  const onSubmit = handleSubmit(
    async (data) => {
      const dateObj =
        data.expense_date instanceof Date ? data.expense_date : new Date(data.expense_date);
      const dateOnly = dateObj.toISOString().substring(0, 10);

      const payload = {
        store_id: storeId,
        category: data.category,
        expense_type: data.expense_type,
        amount: data.amount,
        description: data.description,
        expense_date: dateOnly,
        linked_item_type: data.linked_item_type || null,
        linked_item_id: data.linked_item_id || null,
        is_tax_deductible: data.is_tax_deductible ?? true,
        exclude_from_pnl: data.exclude_from_pnl ?? false,
        vat_amount: data.vat_amount || 0,
        vat_claimable: data.vat_claimable ?? true,
        wht_applicable: data.wht_applicable ?? false,
        wht_rate: data.wht_rate || 0,
        wht_amount: data.wht_amount || 0,
        net_paid_to_vendor:
          data.wht_applicable
            ? Number(data.amount) - Number(data.wht_amount || 0)
            : null,
      };

      try {
        if (currentExpense) {
          await editExpense(currentExpense.id, payload);
          toast.success('Expense updated!');
        } else {
          await addExpense(payload);
          toast.success('Expense created!');
        }
        reset(defaultValues);
        router.push(paths.dashboard.expense.root);
      } catch (err) {
        console.error('Expense submission error', err);
        const msg =
          err.details?.body ||
          err.response?.data?.detail ||
          err.message ||
          'Unknown error';
        toast.error(msg);
      }
    },
    (validationErrors) => {
      console.warn('Validation failed', validationErrors);
      toast.error('Please fix validation errors first.');
    }
  );

  const linkedItems =
    linkedItemType === 'product'
      ? products
      : linkedItemType === 'service'
        ? services
        : [];

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        <Card>
          <CardHeader
            title="Details"
            subheader="Category, description, date and amount"
            sx={{ mb: 3 }}
          />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>

            {/* Category */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Category</Typography>
              <FormControl fullWidth error={!!errors.category}>
                <InputLabel id="category-label">Category</InputLabel>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} labelId="category-label" label="Category">
                      {EXPENSE_CATEGORIES.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.category && (
                  <FormHelperText>{errors.category.message}</FormHelperText>
                )}
              </FormControl>
            </Stack>

            {/* Expense Type */}
            <Stack spacing={1}>
              <Typography variant="subtitle2">Expense Type</Typography>
              <FormControl fullWidth error={!!errors.expense_type}>
                <InputLabel id="expense-type-label">Expense Type</InputLabel>
                <Controller
                  name="expense_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      value={field.value || ''}
                      labelId="expense-type-label"
                      label="Expense Type"
                      onChange={(e) => field.onChange(e.target.value || null)}
                    >
                      <MenuItem value="">Select...</MenuItem>
                      <MenuItem value="CAPEX">CAPEX – Capital Expenditure</MenuItem>
                      <MenuItem value="OPEX">OPEX – Operational Expenditure</MenuItem>
                    </Select>
                  )}
                />
                {errors.expense_type && (
                  <FormHelperText>{errors.expense_type.message}</FormHelperText>
                )}
              </FormControl>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                <Box component="span" sx={{ fontWeight: 600 }}>CAPEX</Box> (Capital Expenditure) covers
                one-time investments in long-term assets such as equipment, machinery, or
                property.{' '}
                <Box component="span" sx={{ fontWeight: 600 }}>OPEX</Box> (Operational Expenditure)
                covers recurring day-to-day costs like rent, utilities, salaries, and
                supplies.
              </Typography>
            </Stack>

            {/* Description */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Description</Typography>
              <Field.Text name="description" label="description" multiline rows={4} />
            </Stack>

            {/* Date */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Date</Typography>
              <Field.DatePicker name="expense_date" control={control} />
            </Stack>

            {/* Amount */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Amount</Typography>
              <Field.Text
                name="amount"
                placeholder="0.00"
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>
                        {currencySymbol}
                      </Box>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            {/* Tax treatment */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Tax treatment</Typography>
              <Controller
                name="is_tax_deductible"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Tax deductible"
                  />
                )}
              />
              <Controller
                name="exclude_from_pnl"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Exclude from P&L (e.g. loan principal)"
                  />
                )}
              />
              <Field.Text name="vat_amount" label="Input VAT amount" type="number" />
              <Controller
                name="vat_claimable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="VAT claimable"
                  />
                )}
              />
              <Controller
                name="wht_applicable"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Withholding tax applicable (suppliers/contractors only)"
                  />
                )}
              />
              <Field.Text name="wht_rate" label="WHT rate (e.g. 0.10)" type="number" />
              <Field.Text name="wht_amount" label="WHT amount" type="number" />
            </Stack>

            {/* Associated Product / Service (Optional) */}
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="subtitle2">Associated Product / Service</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  (optional)
                </Typography>
              </Stack>

              <FormControl fullWidth>
                <InputLabel id="linked-item-type-label">Item Type</InputLabel>
                <Controller
                  name="linked_item_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      value={field.value || ''}
                      labelId="linked-item-type-label"
                      label="Item Type"
                      onChange={(e) => {
                        const val = e.target.value || null;
                        field.onChange(val);
                        setLinkedItemType(e.target.value);
                        setValue('linked_item_id', null);
                      }}
                    >
                      <MenuItem value="">None</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                      <MenuItem value="service">Service</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>

              {linkedItemType && (
                <FormControl fullWidth>
                  <InputLabel id="linked-item-id-label">
                    {linkedItemType === 'product' ? 'Select Product' : 'Select Service'}
                  </InputLabel>
                  <Controller
                    name="linked_item_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        value={field.value || ''}
                        labelId="linked-item-id-label"
                        label={
                          linkedItemType === 'product' ? 'Select Product' : 'Select Service'
                        }
                        onChange={(e) => field.onChange(e.target.value || null)}
                      >
                        <MenuItem value="">None</MenuItem>
                        {linkedItems.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
              )}
            </Stack>

          </Stack>
        </Card>

        <Box display="flex" alignItems="center" flexWrap="wrap">
          <LoadingButton
            type="submit"
            variant="contained"
            size="large"
            loading={isSubmitting}
            sx={{ ml: 2 }}
          >
            {currentExpense ? 'Save Changes' : 'Create Expense'}
          </LoadingButton>
        </Box>
      </Stack>
    </Form>
  );
}
