import { z as zod } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { updateProductQuantity } from 'src/actions/product'; // Adjust import as needed
import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewProductSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  quantity: zod.number().min(0, { message: 'Initial quantity is required!' }),
  addQuantity: zod.number().min(1, { message: 'Quantity to add is required!' }),
  // totalQuantity is optional (for display only)
  totalQuantity: zod.number().min(0).optional(),
});

// ----------------------------------------------------------------------

export function ProductAddQuantityForm({ currentProduct, storeSlug, storeId }) {
  const router = useRouter();

  const [includeTaxes, setIncludeTaxes] = useState(false);

  const baseQuantity = currentProduct?.quantity || 0;

  const defaultValues = useMemo(
    () => ({
      name: currentProduct?.name || '',
      quantity: baseQuantity,
      addQuantity: 0,
      totalQuantity: baseQuantity,
    }),
    [currentProduct, baseQuantity]
  );

  const methods = useForm({
    resolver: zodResolver(NewProductSchema),
    defaultValues,
  });

  const {
    reset,
    setValue,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = methods;

  const addQuantity = useWatch({ control: methods.control, name: 'addQuantity' });
  // const baseQuantity = currentProduct?.quantity || 0;

  // useEffect(() => {
  //   if (addQuantity !== undefined) {
  //     // Ensure addQuantity is not undefined before calculating
  //     const updatedQuantity = baseQuantity + (Number(addQuantity) || 0);
  //     setValue('totalQuantity', updatedQuantity); // Update the 'quantity' dynamically
  //   }
  // }, [addQuantity, baseQuantity, setValue]);

  useEffect(() => {
    const updatedQuantity = baseQuantity + (Number(addQuantity) || 0);
    setValue('totalQuantity', updatedQuantity);
  }, [addQuantity, baseQuantity, setValue]);

  useEffect(() => {
    if (currentProduct) {
      reset(defaultValues);
    }
  }, [currentProduct, defaultValues, reset]);

  useEffect(() => {
    if (includeTaxes) {
      setValue('taxes', 0);
    } else {
      setValue('taxes', currentProduct?.taxes || 0);
    }
  }, [currentProduct?.taxes, includeTaxes, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const store_id = currentProduct?.store_id || localStorage.getItem('store_id');
      const payload = {
        product_id: currentProduct.id, // add the product id here
        store_id: Number(store_id),
        quantity: data.addQuantity,
        status: currentProduct?.status || 'active', // add a status; change default as needed
      };

      console.info('Payload for quantity update:', payload);
      await updateProductQuantity(currentProduct.id, payload);

      toast.success('Quantity updated successfully!');

      setTimeout(() => {
        router.push(paths.dashboard.product.root(storeSlug));
      }, 5000);

      reset();
    }  catch (error) {
      console.error('Submission error:', error);
      let message = '';
      if (error && typeof error === 'object') {
        const { response, message: errMsg, detail: topDetail } = error;
        if (response && response.data) {
          const { detail } = response.data;
          if (Array.isArray(detail)) {
            message = detail.join(' ');
          } else if (typeof detail === 'string') {
            message = detail;
          } else {
            message = JSON.stringify(response.data);
          }
        } else if (topDetail) {
          message =
            typeof topDetail === 'string'
              ? topDetail
              : Array.isArray(topDetail)
              ? topDetail.join(' ')
              : JSON.stringify(topDetail);
        } else {
          message = errMsg;
        }
      }
      if (!message) {
        message = 'An unknown error occurred';
      }
      toast.error(message);
    }
  });

  const renderDetails = (
    <Card>
      <CardHeader title="Details" subheader="Title, quantity adjustment..." sx={{ mb: 3 }} />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Field.Text name="name" label="Product name" />
        <Field.Text
          name="quantity"
          label="Initial Quantity"
          disabled
          placeholder="0"
          type="number"
          InputProps={{ readOnly: true }} // Make it readonly
          InputLabelProps={{ shrink: true }}
        />

        <Field.Text
          name="totalQuantity"
          label="Total Quantity"
          disabled
          placeholder="0"
          type="number"
          InputProps={{ readOnly: true }} // Make it readonly
          InputLabelProps={{ shrink: true }}
        />

        <Field.Text
          name="addQuantity"
          label="Quantity to add"
          placeholder="0"
          type="number"
          InputLabelProps={{ shrink: true }}
        />
      </Stack>
    </Card>
  );

  const renderActions = (
    <Stack spacing={3} direction="row" alignItems="center" flexWrap="wrap">
      <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
        Add Quantity
      </LoadingButton>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderActions}
      </Stack>
    </Form>
  );
}
