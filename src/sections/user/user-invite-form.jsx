import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

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

export function UserNewInviteForm() {
  const router = useRouter();

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
    try {
      // Call the invite action with form data
      const response = await inviteUser(data);
      toast.success('Invitation sent successfully!');
      reset();
      router.push(paths.dashboard.user.list);
      console.info('Invite response', response);
    } catch (error) {
      console.error('Invitation error:', error);

      // Extract error details from the backend response
      const errorMessage =
        error.response?.data?.detail
          ? Array.isArray(error.response.data.detail)
            ? error.response.data.detail.map((err) => err.msg).join(', ')
            : error.response.data.detail
          : error.response?.data?.message ||
            error.message ||
            'Invitation failed!';
      toast.error(errorMessage);
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
