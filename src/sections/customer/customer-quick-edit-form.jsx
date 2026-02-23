import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { editCustomer } from 'src/actions/customer';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------
// Schema for quick edit form – allow extra fields via passthrough()
// ----------------------------------------------------------------------
export const CustomerQuickEditSchema = zod
  .object({
    city: zod.string().min(1, { message: 'City is required!' }),
    state: zod.string().min(1, { message: 'State is required!' }),
    name: zod.string().min(1, { message: 'Name is required!' }),
    address: zod.string().min(1, { message: 'Address is required!' }),
    zip_code: zod.string().min(1, { message: 'Zip code is required!' }),
    phone_number: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    country: schemaHelper.objectOrNull({
      message: { required_error: 'Country is required!' },
    }),
    primary: zod.boolean(),
    address_type: zod.string(),
  })
  .passthrough();

// ----------------------------------------------------------------------
// Quick Edit Form Component
// ----------------------------------------------------------------------
export function CustomerQuickEditForm({ currentUser, open, onClose }) {
  const router = useRouter();

  // Retrieve active workspace from localStorage for fallback.
  const activeWorkspaceJson = localStorage.getItem('activeWorkspace');
  const activeWorkspace = useMemo(
    () => (activeWorkspaceJson ? JSON.parse(activeWorkspaceJson) : null),
    [activeWorkspaceJson]
  );

  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      city: currentUser?.city || '',
      state: currentUser?.state || '',
      address: currentUser?.address || '',
      zip_code: currentUser?.zip_code || '',
      country: currentUser?.country || '',
      primary: currentUser ? Boolean(currentUser.primary) : true,
      phone_number: currentUser?.phone_number || '',
      address_type: currentUser?.address_type || '',
      // Use the store_id from the customer details, or fallback to activeWorkspace.
      store_id: currentUser?.store_id || (activeWorkspace ? activeWorkspace.id : ''),
    }),
    [currentUser, activeWorkspace]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(CustomerQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Determine the store ID: first from currentUser, then from active workspace.
      const storeId = currentUser?.store_id || (activeWorkspace ? activeWorkspace.id : null);
      if (!storeId) {
        toast.error("No active store found");
        return;
      }
      console.log("Using store_id:", storeId);
      if (currentUser && currentUser.id) {
        // Pass store_id as a query parameter.
        await editCustomer(currentUser.id, data, { params: { store_id: storeId } });
        toast.success('Update successful!');
      } else {
        toast.error('Customer ID is missing.');
        return;
      }
      onClose();
      // Use the browser's native reload to refresh the page
      window.location.reload();
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
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Update</DialogTitle>
        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            Account is waiting for confirmation
          </Alert>
          {/* Hidden field for store_id */}
          <input type="hidden" {...methods.register('store_id')} />
          <Box
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            columnGap={2}
            rowGap={3}
          >
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
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
                columnGap={2}
                rowGap={3}
              >
                <Field.Text name="name" label="Full name" />
                <Field.Phone name="phone_number" label="Phone number" />
              </Box>
              <Field.Text name="address" label="Address" />
              <Box
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(3, 1fr)' }}
                columnGap={2}
                rowGap={3}
              >
                <Field.Text name="city" label="Town/city" />
                <Field.Text name="state" label="State" />
                <Field.Text name="zip_code" label="Zip/code" />
              </Box>
              <Field.CountrySelect
                name="country"
                label="Country"
                placeholder="Choose a country"
              />
              <Field.Checkbox name="primary" label="Use this address as default." />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
