import { z as zod } from 'zod';
import { useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
// import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
// import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetRoles } from 'src/actions/role';
import { USER_STATUS_OPTIONS } from 'src/_mock';
import { useGetStores } from 'src/actions/store';
import { editUserDetails } from 'src/actions/user';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------
// Quick Edit Schema
export const UserQuickEditSchema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  middleName: zod.string().optional(),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  country: schemaHelper.objectOrNull({
    message: { required_error: 'Country is required!' },
  }),
  state: zod.string().optional(),
  city: zod.string().optional(),
  address: zod.string().optional(),
  zipCode: zod.string().optional(),
  role_id: zod.number({ invalid_type_error: 'User Role is required' }),
  store_ids: zod.array(zod.number()).optional(),
  status: zod.string().optional(),
});

// Helper: ensure store_ids is always an array of numbers.
const parseStoreIds = (ids) => {
  if (!ids) return [];
  if (Array.isArray(ids)) {
    const result = [];
    ids.forEach((item) => {
      if (typeof item === 'string' && item.includes(',')) {
        result.push(...item.split(',').map((i) => Number(i.trim())));
      } else {
        result.push(Number(item));
      }
    });
    return result;
  }
  if (typeof ids === 'string') {
    return ids.split(',').map((id) => Number(id.trim()));
  }
  return [];
};

export function UserQuickEditForm({ currentUser, open, onClose }) {
  const router = useRouter();
  const { roles, rolesLoading } = useGetRoles();
  const { stores } = useGetStores();
  const { user: loggedUser } = useAuthContext();

  // If the logged-in user is editing their own account, disable these fields.
  const isEditingSelf = currentUser?.user_id === loggedUser?.user_id;

  // Compute default values from currentUser.
  const defaultValues = useMemo(
    () => ({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      middleName: currentUser?.middleName || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      address: currentUser?.address || '',
      country: currentUser?.country || '',
      state: currentUser?.state || '',
      city: currentUser?.city || '',
      zipCode: currentUser?.zipCode || '',
      status: currentUser?.status || '',
      companyName: currentUser?.companyName || '',
      role_id: currentUser?.role_id || '',
      store_ids: parseStoreIds(currentUser?.store_ids),
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
  });
  const { reset, handleSubmit, formState: { isSubmitting }, control } = methods;

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      console.log('Submitting Data:', data);
      await editUserDetails(currentUser.user_id, data);
      toast.success('Update success!');
      onClose();
      window.location.reload();
      // router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Update failed!');
    }
  });

  const roleOptions = roles || [];

  return (
    <Dialog
      fullWidth
      maxWidth={false}
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
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            {/* Status field: disabled if editing self */}
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Status"
                  disabled={isEditingSelf}
                  fullWidth
                >
                  {USER_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

            {/* Other basic fields (always editable) */}
            <Field.Text name="firstName" label="First name" />
            <Field.Text name="lastName" label="Last name" />
            <Field.Text name="middleName" label="Middle name" />
            <Field.Text name="email" label="Email address" />
            <Field.Phone name="phoneNumber" label="Phone number" />
            <Field.CountrySelect
              fullWidth
              name="country"
              label="Country"
              placeholder="Choose a country"
            />
            <Field.Text name="state" label="State/region" />
            <Field.Text name="city" label="City" />
            {/* For demonstration, address is always editable */}
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Address" fullWidth />
              )}
            />
            <Field.Text name="zipCode" label="Zip/code" />
            {/* Company field is always read-only */}
            <Field.Text name="companyName" label="Company" disabled />

            {/* User Role: disabled if editing self */}
            <Controller
              name="role_id"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="User Role"
                  disabled={rolesLoading || isEditingSelf}
                  fullWidth
                  onChange={(e) =>
                    field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                  }
                  value={field.value || ''}
                >
                  <MenuItem value="">
                    <em>Select a role</em>
                  </MenuItem>
                  {roleOptions.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {/* Stores: disabled if editing self */}
            <Controller
              name="store_ids"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  multiple
                  options={stores || []}
                  disabled={isEditingSelf}
                  freeSolo={false}
                  getOptionLabel={(option) => option.storeName || ''}
                  value={
                    (stores || []).filter((store) =>
                      field.value?.includes(store.id)
                    ) || []
                  }
                  onChange={(_event, newValue) => {
                    const newIds = newValue.map((store) => Number(store.id));
                    field.onChange(newIds);
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Stores" placeholder="+ Stores" />
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option.id}
                        label={option.storeName}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    ))
                  }
                />
              )}
            />
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
