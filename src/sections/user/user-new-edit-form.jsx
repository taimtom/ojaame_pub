import { z as zod } from 'zod';
import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
// import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
// import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
// import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fData } from 'src/utils/format-number';

import { useGetRoles } from 'src/actions/role';
import { uploadFile } from 'src/actions/upload';
import { useGetStores } from 'src/actions/store';
import { editUserDetails } from 'src/actions/user';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
// import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export const NewUserSchema = zod.object({
  photoURL: schemaHelper.file1().optional(),
  firstName: zod.string().min(1, { message: 'Name is required!' }),
  lastName: zod.string().min(1, { message: 'Name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  role_id: zod.number({ invalid_type_error: 'User Role is required' }),
  store_ids: zod.array(zod.number()).optional(),
  country: schemaHelper.objectOrNull({
    message: { required_error: 'Country is required!' },
  }),
  address: zod.string().min(1, { message: 'Address is required!' }),
  company: zod.string().min(1, { message: 'Company is required!' }),
  state: zod.string().min(1, { message: 'State is required!' }),
  city: zod.string().min(1, { message: 'City is required!' }),
  // role: zod.string().min(1, { message: 'Role is required!' }),
  zipCode: zod.string().optional(),
  // password: zod
  //   .string()
  //   .min(1, { message: 'Password is required!' })
  //   .min(6, { message: 'Password is too short!' }),

  // Not required
  is_active: zod.boolean(),
  email_verified: zod.boolean(),
});

// ----------------------------------------------------------------------

export function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const { user: loggedUser } = useAuthContext();

  // Determine if editing self
  const isEditingSelf = currentUser?.user_id === loggedUser?.user_id;

  const { roles, rolesLoading } = useGetRoles();
  const { stores, storesLoading } = useGetStores();

  const defaultValues = useMemo(
    () => ({
      status: currentUser?.status || '',
      is_active: currentUser?.is_active ?? false,
      photoURL: currentUser?.photoURL || null,
      email_verified: currentUser?.email_verified || false,
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      country: currentUser?.country || '',
      state: currentUser?.state || '',
      city: currentUser?.city || '',
      address: currentUser?.address || '',
      zipCode: currentUser?.zipCode || '',
      company: currentUser?.companyName || '',
      role_id: currentUser?.role_id || '',
      store_ids: currentUser?.store_ids || [],
      // password: '',
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
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

  const getStatusText = () => {
    if (values.is_active) {
      return 'active';
    }
    return currentUser?.invitation_id ? 'pending' : 'banned';

  };

  const onSubmit = handleSubmit(async (data) => {
    // Create a copy of the submitted data
    const payload = { ...data };

    // Check if a new photo is provided (as a File object)
    if (payload.photoURL && payload.photoURL instanceof File) {
      try {
        // Use the firstName as part of the file name; adjust as needed.
        const fileUrl = await uploadFile(payload.photoURL, data.firstName || "avatar");
        payload.photoURL = fileUrl;
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        toast.error("File upload failed. Please try again.");
        return;
      }
    } else if (!payload.photoURL) {
      // Remove photoURL field if no file is provided
      delete payload.photoURL;
    }

    try {
      await editUserDetails(currentUser.user_id, payload);
      toast.success("Update success!");
      router.push(paths.dashboard.user.list);
    } catch (error) {
      console.error("Submission error:", error);
      let message = "";
      if (error && typeof error === "object") {
        const { response, message: errMsg, detail: topDetail } = error;
        if (response && response.data) {
          const { detail } = response.data;
          if (Array.isArray(detail)) {
            message = detail.join(" ");
          } else if (typeof detail === "string") {
            message = detail;
          } else {
            message = JSON.stringify(response.data);
          }
        } else if (topDetail) {
          message =
            typeof topDetail === "string"
              ? topDetail
              : Array.isArray(topDetail)
              ? topDetail.join(" ")
              : JSON.stringify(topDetail);
        } else {
          message = errMsg;
        }
      }
      if (!message) {
        message = "An unknown error occurred";
      }
      toast.error(message);
    }
  });

  const roleOptions = roles || [];
  const password = useBoolean();

  return (
    <Form methods={methods} onSubmit={onSubmit}>
    <Grid container spacing={3}>
      {/* Left column: Avatar, banned & email verified switches */}
      <Grid xs={12} md={4}>
        <Card sx={{ pt: 10, pb: 5, px: 3, position: 'relative' }}>
          {currentUser && (
            <Label
              color={values.is_active ? 'success' : 'error'}
              sx={{ position: 'absolute', top: 24, right: 24 }}
            >
              {getStatusText()}
            </Label>
          )}
          <Box sx={{ mb: 5 }}>
            <Field.UploadAvatar
              name="photoURL"
              maxSize={3145728}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 3,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.disabled',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of {fData(3145728)}
                </Typography>
              }
            />
          </Box>
          {currentUser && (
            <FormControlLabel
              labelPlacement="start"
              control={
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      {...field}
                      checked={!field.value}
                      onChange={(event) =>
                        field.onChange(!event.target.checked)
                      }
                      // Disable banned toggle when editing your own account or if invitation exists
                      disabled={isEditingSelf || !!currentUser.invitation_id}
                    />
                  )}
                />
              }
              label={
                <>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Banned
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {currentUser.invitation_id
                      ? 'Invitation exists - cannot change status'
                      : 'Disable account'}
                  </Typography>
                </>
              }
              sx={{
                mx: 0,
                mb: 3,
                width: 1,
                justifyContent: 'space-between',
              }}
            />
          )}
          <Field.Switch
            name="email_verified"
            labelPlacement="start"
            label={
              <>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Email verified
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Disabling this will automatically send the user a verification email
                </Typography>
              </>
            }
            // Disable email verification when editing your own account or if invitation exists
            disabled={isEditingSelf || !!currentUser.invitation_id}
            sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
          />
          {currentUser && (
            <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
              <Button variant="soft" color="error">
                Delete user
              </Button>
            </Stack>
          )}
        </Card>
      </Grid>

      {/* Right column: User details */}
      <Grid xs={12} md={8}>
        <Card sx={{ p: 3 }}>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >
            <Field.Text name="firstName" label="First Name" />
            <Field.Text name="lastName" label="Last Name" />
            <Field.Text name="email" label="Email address" />
            <Field.Phone name="phoneNumber" label="Phone number" />

            {/* Role selector - disabled if editing self */}
            <FormControl fullWidth>
              <InputLabel id="role-select-label"> </InputLabel>
              <Controller
                name="role_id"
                control={control}
                render={({ field }) => (
                  <Field.Select
                    {...field}
                    labelId="role-select-label"
                    label="User Role"
                    disabled={rolesLoading || isEditingSelf}
                    value={field.value !== undefined ? field.value : ''}
                    onChange={(e) => {
                      const { value } = e.target;
                      field.onChange(value === '' ? undefined : Number(value));
                    }}
                  >
                    <MenuItem value="">
                      <em>Select a role</em>
                    </MenuItem>
                    {roleOptions.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Field.Select>
                )}
              />
            </FormControl>

            {/* Stores selector - disabled if editing self */}
            <FormControl fullWidth>
              <Controller
                name="store_ids"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    freeSolo={false}
                    options={stores || []}
                    getOptionLabel={(option) => option.storeName || ''}
                    value={
                      (stores || []).filter((store) =>
                        field.value.includes(store.id)
                      ) || []
                    }
                    onChange={(_event, newValue) => {
                      const newIds = newValue.map((store) => store.id);
                      field.onChange(newIds);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Stores"
                        placeholder="+ Stores"
                      />
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
                    disabled={isEditingSelf}
                  />
                )}
              />
            </FormControl>

            <Field.CountrySelect
              fullWidth
              name="country"
              label="Nationality"
              placeholder="Choose a country"
            />

            <Field.Text name="state" label="State/region" />
            <Field.Text name="city" label="City" />
            <Field.Text name="address" label="Address" />
            <Field.Text name="zipCode" label="Zip/code" />

            {/* Company field - disabled if editing self */}
            <Field.Text
              name="company"
              label="Company"
              disabled
              // disabled={isEditingSelf}
            />
          </Box>

          <Stack alignItems="flex-end" sx={{ mt: 3 }}>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {!currentUser ? 'Create user' : 'Save changes'}
            </LoadingButton>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  </Form>
  );
}
