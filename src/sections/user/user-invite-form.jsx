import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { inviteUser } from 'src/actions/user';
import { useGetRoles } from 'src/actions/role';
import { useGetStores } from 'src/actions/store';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';


// ----------------------------------------------------------------------

export const NewUserSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  role_id: zod.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    zod.number({ invalid_type_error: 'User Role is required' })
  ),
  store_ids: zod.array(zod.number()).optional(),
});

// ----------------------------------------------------------------------

// Turns any Axios/fetch error into a human-readable string.
// The Axios interceptor strips the full error and rejects with just
// response.data (plus _httpStatus attached). Handle that shape here.
function parseApiError(error) {
  // After interceptor: error IS the data object (with _httpStatus attached)
  const status = error._httpStatus ?? error.response?.status;
  const data = error.response?.data ?? error;

  if (status === 503) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  if (data?.detail) {
    // FastAPI 422 — detail is an array of validation problems
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err) => {
          const field = err.loc?.slice(1).join(' → ') || '';
          return field ? `${field}: ${err.msg}` : err.msg;
        })
        .join('\n');
    }
    // Any other structured error with a string detail
    return String(data.detail);
  }

  if (data?.message) return String(data.message);
  if (typeof error === 'string') return error;

  return error.message || 'Invitation failed. Please try again.';
}

export function UserNewInviteForm() {
  const router = useRouter();
  const [seatLimitReached, setSeatLimitReached] = useState(false);
  const [formError, setFormError] = useState(null);

  const { stores, storesLoading } = useGetStores();
  const { roles, rolesLoading } = useGetRoles();


  const defaultValues = useMemo(
    () => ({
      email: '',
      role_id: undefined,
      store_ids: [],
    }),
    []
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;


  const onSubmit = handleSubmit(async (data) => {
    setSeatLimitReached(false);
    setFormError(null);
    try {
      const response = await inviteUser(data);
      toast.success('Invitation sent successfully!');
      reset();
      router.push(paths.dashboard.user.list);
      console.info('Invite response', response);
    } catch (error) {
      console.error('Invitation error:', error);

      if ((error._httpStatus ?? error.response?.status) === 402) {
        setSeatLimitReached(true);
        return;
      }

      setFormError(parseApiError(error));
    }
  });


  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="email" label="Email address" />

              <FormControl fullWidth>
                <InputLabel id="role-select-label">User Role</InputLabel>
                <Controller
                  name="role_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="role-select-label"
                      label="User Role"
                      disabled={rolesLoading}
                      value={field.value !== undefined ? field.value : ''}
                      onChange={(e) => {
                        const { value } = e.target;
                        field.onChange(value === '' ? undefined : parseInt(value, 10));
                      }}

                    >
                      <MenuItem value="" disabled>
                        <em>Select a role</em>
                      </MenuItem>
                      {roles.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              {/* Multi-select field for choosing one or more stores */}
              <FormControl fullWidth>
                <InputLabel id="store-select-label">Stores</InputLabel>
                <Controller
                  name="store_ids"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="store-select-label"
                      multiple
                      input={<OutlinedInput label="Stores" />}
                      renderValue={(selected) => {
                        // Map selected store IDs to store names
                        const selectedStores = stores.filter((store) =>
                          selected.includes(store.id)
                        );
                        return selectedStores.map((s) => s.storeName).join(', ');
                      }}
                    >
                      {stores.map((store) => (
                        <MenuItem key={store.id} value={store.id}>
                          {store.storeName}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Box>

            {seatLimitReached && (
              <Alert
                severity="warning"
                sx={{ mt: 3 }}
                action={
                  <Button
                    component={RouterLink}
                    href={`${paths.dashboard.user.account}?tab=billing`}
                    size="small"
                    color="warning"
                    variant="contained"
                  >
                    Upgrade seats
                  </Button>
                }
              >
                Seat limit reached. Go to Billing to add more seats.
              </Alert>
            )}

            {formError && (
              <Alert
                severity="error"
                onClose={() => setFormError(null)}
                sx={{ mt: 3, whiteSpace: 'pre-line' }}
              >
                {formError}
              </Alert>
            )}

            <Box mt={3} display="flex" justifyContent="flex-end">
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting || storesLoading}
              >
                Invite user
              </LoadingButton>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
