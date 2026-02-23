import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
// import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
// import InputLabel from '@mui/material/InputLabel';
// import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
// import FormControl from '@mui/material/FormControl';
// import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { paramCase } from 'src/utils/change-case';
// import { fData } from 'src/utils/format-number';

import { useGetRoles } from 'src/actions/role';
import { useGetStores } from 'src/actions/store';
import { addCustomer, editCustomer } from 'src/actions/customer';

// import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export const NewCustomerSchema = zod.object({
  city: zod.string().min(1, { message: 'City is required!' }),
  state: zod.string().min(1, { message: 'State is required!' }),
  name: zod.string().min(1, { message: 'Name is required!' }),
  address: zod.string().min(1, { message: 'Address is required!' }),
  zip_code: zod.string().min(1, { message: 'Zip code is required!' }),
  phone_number: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  country: schemaHelper.objectOrNull({
    message: { required_error: 'Country is required!' },
  }),
  // Not required
  primary: zod.boolean(),
  address_type: zod.string(),
});

// ----------------------------------------------------------------------

export function CustomerNewEditForm({ currentUser }) {
  const router = useRouter();

  const { roles, rolesLoading } = useGetRoles();
  const { stores, storesLoading } = useGetStores();

  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      city: currentUser?.city || '',
      state: currentUser?.state || '',
      address: currentUser?.address || '',
      zip_code: currentUser?.zip_code || '',
      country: currentUser?.country || '',
      // Convert currentUser.primary to a boolean; default to true if no customer exists.
      primary: currentUser ? Boolean(currentUser.primary) : true,
      phone_number: currentUser?.phone_number || '',
      address_type: currentUser?.address_type || '',
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewCustomerSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // const getStatusText = () => {
  //   return values.is_active ? 'active' : 'banned';
  // };

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Retrieve the active workspace (store) from localStorage.
      const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
      if (activeWorkspaceJson) {
        try {
          const activeWorkspace = JSON.parse(activeWorkspaceJson);
          // Ensure the store_id is attached to the data.
          data.store_id = activeWorkspace.id;
          // Create a store slug e.g. "mystore-1"
          const storeSlug = `${paramCase(activeWorkspace.storeName)}-${activeWorkspace.id}`;
          // Proceed with add or edit operations.
          if (currentUser && currentUser.id) {
            await editCustomer(currentUser.id, data);
            toast.success('Customer updated successfully!');
          } else {
            await addCustomer(data);
            toast.success('Customer added successfully!');
          }
          // Navigate to the customer list page with the store slug.
          router.push(paths.dashboard.customer.root(storeSlug));
        } catch (parseError) {
          console.error("Error parsing activeWorkspace:", parseError);
          toast.error("Failed to retrieve store information");
        }
      } else {
        toast.error("No active store found");
      }
    } catch (error) {
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



  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>

          <Stack spacing={3}>
            <Field.RadioGroup
              row
              name="address_type"
              options={[
                { label: 'Home', value: 'Home' },
                { label: 'Office', value: 'Office' },
              ]}
            />

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="name" label="Full name" />

              <Field.Phone name="phone_number" label="Phone number" />
            </Box>

            <Field.Text name="address" label="Address" />

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(3, 1fr)',
              }}
            >
              <Field.Text name="city" label="Town/city" />

              <Field.Text name="state" label="State" />

              <Field.Text name="zip_code" label="Zip/code" />
            </Box>

            <Field.CountrySelect name="country" label="Country" placeholder="Choose a country" />

            <Field.Checkbox name="primary" label="Use this address as default." />
          </Stack>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? 'Create Customer' : 'Save changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
