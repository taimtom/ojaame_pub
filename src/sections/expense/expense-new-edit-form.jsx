import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
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
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

import { EXPENSE_CATEGORIES } from 'src/_mock/expenses';
import { addExpense, editExpense } from 'src/actions/expense';

import { toast } from 'src/components/snackbar';
import { Form, Field,schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------
export const NewExpenseSchema = zod.object({
  // category: zod.string().min(1, 'Category is required'),
  category: zod.enum(
        // no TS assertion here, just pass your values array
        EXPENSE_CATEGORIES.map((opt) => opt.value),
        { errorMap: () => ({ message: 'Select a valid category' }) }
      ),
  amount: zod.number().min(0.01, 'Amount must be greater than 0'),
  description: zod.string().optional(),
  // expense_date: zod.date({ required_error: 'Date is required' })
  expense_date: schemaHelper.date({
      message: { required_error: 'Expired date is required!' },
    }),
});

export function ExpenseNewEditForm({ currentExpense, storeId }) {
  const router = useRouter();

  const defaultValues = useMemo(() => ({
    category:     currentExpense?.category   || '',
    amount:       currentExpense?.amount     || 0,
    description:  currentExpense?.description|| '',
    expense_date: currentExpense
      ? new Date(currentExpense.expense_date)
      : new Date(),
  }), [currentExpense]);


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
    formState: { isSubmitting, errors },
  } = methods;

  useEffect(() => {
    if (currentExpense) {
      reset(defaultValues);
    }
  }, [currentExpense, defaultValues, reset]);

  // Debug onError to catch validation issues
  const onSubmit = handleSubmit(
    async data => {
      // 1) Make sure we have a Date instance
      const dateObj = data.expense_date instanceof Date
        ? data.expense_date
        : new Date(data.expense_date);

      // 2) Extract just the YYYY-MM-DD
      const dateOnly = dateObj.toISOString().substring(0, 10);

      // 3) Build payload matching ExpenseCreate
      const payload = {
        store_id:     storeId,
        category:     data.category,
        amount:       data.amount,
        description:  data.description,
        expense_date: dateOnly,            // <-- date-only string
      };

      try {
        if (currentExpense) {
          // <-- only two args here
          await editExpense(currentExpense.id, payload);
          toast.success('Expense updated!');
        } else {
          // <-- only one arg here
          await addExpense(payload);
          toast.success('Expense created!');
        }
        reset(defaultValues);
        router.push(paths.dashboard.expense.root);
      } catch (err) {
        console.error('Expense submission error', err);
        // FastAPI error is `{ details: { body: '…' } }`
        const msg =
          err.details?.body ||
          err.response?.data?.detail ||
          err.message ||
          'Unknown error';
        toast.error(msg);
      }
    },
    validationErrors => {
      console.warn('Validation failed', validationErrors);
      toast.error('Please fix validation errors first.');
    }
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        <Card>
          <CardHeader title="Details" subheader="Category, description, date and amount" sx={{ mb: 3 }} />
          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            {/* <Stack spacing={1.5}>
              <Typography variant="subtitle2">Category</Typography>
              <Field.Text name="category" placeholder="Ex: Food..." />
            </Stack> */}
           <Stack spacing={1.5}>
   <Typography variant="subtitle2">Category</Typography>

   <FormControl fullWidth error={!!errors.category}>
     <InputLabel id="category-label">Category</InputLabel>
     <Controller
       name="category"
       control={control}
       render={({ field }) => (
         <Select
           {...field}
           labelId="category-label"
           label="Category"
         >
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

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Description</Typography>
              <Field.Text name="description" label="description" multiline rows={4} />
              {/* <Field.Editor name="description" sx={{ maxHeight: 480 }} /> */}
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Date</Typography>
              <Field.DatePicker name="expense_date" control={control} />
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Amount</Typography>
              <Field.Text
                name="amount"
                placeholder="0.00"
                type="number"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>{currencySymbol}</Box>
                    </InputAdornment>
                  ),
                }}
              />
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
