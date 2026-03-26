import { z as zod } from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { uploadFile } from 'src/actions/upload';
import { addStore, editStore } from 'src/actions/store';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------
// Validation schema for a new/edit store.
export const NewStoreSchema = zod.object({
  avatarUrl: schemaHelper.file({ message: { required_error: 'Avatar is required!' } }).optional().nullable(),
  storeName: zod.string().min(1, { message: 'Store Name is required!' }),
  storeEmail: zod
    .string()
    .trim()
    .optional()
    .or(zod.literal(''))
    .refine((value) => !value || zod.string().email().safeParse(value).success, {
      message: 'Email must be a valid email address!',
    }),
  phoneNumber: zod
    .string()
    .optional()
    .or(zod.literal(''))
    .refine((value) => !value || isValidPhoneNumber(value), {
      message: 'Phone number must be valid',
    }),
  address: zod.string().min(1, { message: 'Address is required!' }),
  status: zod.string(),
  isVerified: zod.boolean(),
});

// ----------------------------------------------------------------------
// StoreNewEditForm Component
// Use a default value of null for currentStore in create mode.
export function StoreNewEditForm({ currentStore = null, mutate }) {
  const router = useRouter();
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Memoize default values based on currentStore.
  const defaultValues = useMemo(
    () => ({
      status: currentStore?.status || '',
      avatarUrl: currentStore?.avatarUrl || null,
      isVerified: currentStore?.isVerified ?? true,
      storeName: currentStore?.storeName || '',
      storeEmail: currentStore?.storeEmail || '',
      phoneNumber: currentStore?.phoneNumber || '',
      address: currentStore?.address || '',
    }),
    [currentStore]
  );

  // Initialize the form.
  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewStoreSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  // When currentStore loads or updates, reset the form with new default values.
  useEffect(() => {
    if (currentStore) {
      reset({
        status: currentStore.status || '',
        avatarUrl: currentStore.avatarUrl || null,
        isVerified: currentStore.isVerified ?? true,
        storeName: currentStore.storeName || '',
        storeEmail: currentStore.storeEmail || '',
        phoneNumber: currentStore.phoneNumber || '',
        address: currentStore.address || '',
      });
    }
  }, [currentStore, reset]);

  // Only show a spinner if we are in edit mode and currentStore is still loading.
  // In create mode, currentStore is explicitly set to null.
  if (currentStore === undefined) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      // Process avatarUrl: if it's a File, upload it first.
      if (data.avatarUrl && data.avatarUrl instanceof File) {
        data.avatarUrl = await uploadFile(data.avatarUrl, data.storeName);
      } else if (!data.avatarUrl || data.avatarUrl === '') {
        // If no image is uploaded, set to null
        data.avatarUrl = null;
      }

      if (currentStore) {
        // Edit mode: update the store.
        await editStore(currentStore.id, data);
        toast.success('Store updated successfully!');
        // Reload the page to reflect changes.
        window.location.reload();
      } else {
        // Create mode: add a new store.
        await addStore(data);
        toast.success('Store created successfully!');
        // After 2 seconds, redirect to the store list.
        setTimeout(() => {
          window.location.href = paths.dashboard.store.list;
        }, 2000);
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
        {/* Left Column: Avatar & Status Controls */}
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentStore && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'banned' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}
            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
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
                    <br /> <strong>(Optional)</strong>
                  </Typography>
                }
              />
            </Box>
            {/* Manual Avatar URL Input */}
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              <TextField
                label="Or enter Avatar URL"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                fullWidth
                variant="outlined"
                margin="normal"
              />
              <Button
                variant="contained"
                onClick={() => {
                  setValue('avatarUrl', avatarUrlInput);
                  setAvatarUrlInput('');
                }}
              >
                Set Avatar URL
              </Button>
              {typeof values.avatarUrl === 'string' &&
                values.avatarUrl.startsWith('http') && (
                  <Box mt={2}>
                    {/* Uncomment to show a preview if desired */}
                    {/* <img
                      src={values.avatarUrl}
                      alt="Avatar Preview"
                      style={{ maxWidth: '200px' }}
                    /> */}
                  </Box>
                )}
            </Stack>
            {currentStore && (
              <FormControlLabel
                labelPlacement="start"
                control={
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        {...field}
                        checked={field.value !== 'active'}
                        onChange={(event) =>
                          field.onChange(
                            event.target.checked ? 'banned' : 'active'
                          )
                        }
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
                      Apply disable account
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
              name="isVerified"
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
              sx={{ mx: 0, width: 1, justifyContent: 'space-between' }}
            />
            {currentStore && (
              <Stack justifyContent="center" alignItems="center" sx={{ mt: 3 }}>
                <Button variant="soft" color="error">
                  Delete user
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>
        {/* Right Column: Store Details */}
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
              <Field.Text name="storeName" label="Store name" />
              <Field.Text name="storeEmail" label="Email address" />
              <Field.Phone name="phoneNumber" label="Phone number" />
              <Field.Text name="address" label="Address" />
            </Box>
            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentStore ? 'Create Store' : 'Save changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
