import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { addCustomer } from 'src/actions/customer';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';
// ----------------------------------------------------------------------

export const NewAddressSchema = zod.object({
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

export function AddressNewForm({ open, onClose, onCreate }) {
  const defaultValues = {
    name: '',
    city: '',
    state: '',
    address: '',
    zip_code: '',
    country: '',
    primary: true,
    phone_number: '',
    address_type: '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewAddressSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const storeData = localStorage.getItem('activeWorkspace');
      const activeStore = storeData ? JSON.parse(storeData) : null;
      if (!activeStore) {
        throw new Error('Active store not found.');
      }
      const customerPayload = {
        name: data.name,
        city: data.city,
        state: data.state,
        address: data.address,
        zip_code: data.zip_code,
        country: data.country,
        phone_number: data.phone_number,
        primary: data.primary,
        address_type: data.address_type,
        store_id: activeStore.id,
        fullAddress: `${data.address}, ${data.city}, ${data.state}, ${data.country}, ${data.zip_code}`,
      };
      const newCustomer = await addCustomer(customerPayload);
      toast.success("Address saved successfully.");
      onCreate(newCustomer);
      onClose();
    } catch (error) {
      console.error('Error adding address:', error);
      // If the error has a response with details, show that.
      const errorMessage =
        error.response?.data?.detail || error.message || "Failed to add address.";
      toast.error(errorMessage);
    }
  });


  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>New Customer address</DialogTitle>

        <DialogContent dividers>
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
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
