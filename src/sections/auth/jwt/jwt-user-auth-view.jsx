import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, FormProvider } from 'react-hook-form';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fData } from 'src/utils/format-number';

import { uploadFile } from 'src/actions/upload';
import { updateUserDetails } from 'src/actions/user';
import { useInvitationDetails } from 'src/actions/invitation';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { AnimateLogo2 } from 'src/components/animate';
import { Field, schemaHelper } from 'src/components/hook-form';

// ----------------------------------------------------------------------
// Preprocess the date_of_birth field to convert string to Date
const NewUserSchema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
  country: zod.string().optional(),
  state: zod.string().optional(),
  city: zod.string().optional(),
  address: zod.string().min(1, { message: 'Address is required!' }),
  // zipCode: zod.string().min(1, { message: 'Zip code is required!' }),
  date_of_birth: zod.preprocess((val) => {
    // treat empty, null, or the literal 'undefined' as no value
    if (
      val === undefined ||
      val === null ||
      (typeof val === 'string' && (val.trim() === '' || val === 'undefined'))
    ) {
      return undefined;
    }
    return new Date(val);
  }, zod.date().optional()),
  password: zod
  .string()
  .min(8, { message: 'Password must be at least 8 characters!' })
  .regex(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter!' })
  .regex(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter!' })
  .regex(/(?=.*\d)/, { message: 'Password must contain at least one number!' })
  .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, { message: 'Password must contain at least one special character!' }),
re_password: zod.string().min(1, { message: 'Re-entering your password is required!' }),
  photoURL: zod.string().optional(),
})
.refine(data => data.password === data.re_password, {
  message: 'Passwords must match!',
  path: ['re_password'],
});
// ----------------------------------------------------------------------

export function UserNewForm() {
  const { invitation_id } = useParams();
  const { invitation, loading, error } = useInvitationDetails(invitation_id);
    const passwordToggle = useBoolean();
    const rePasswordToggle = useBoolean();
    const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const defaultValues = useMemo(() => ({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    country: '',
    state: '',
    city: '',
    address: '',
    // zipCode: '',
    date_of_birth: '',
    password: '',
    re_password: '',
    photoURL: '',
  }), []);

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const { handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = methods;
  const passwordValue = watch('password') || '';

  const passwordRules = [
    { label: 'At least 8 characters', test: pw => pw.length >= 8 },
    { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
    { label: 'One number', test: pw => /\d/.test(pw) },
    { label: 'One special character', test: pw => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];

  const photoURLValue = watch('photoURL');

  // State for manual URL input
  const [photoURLInput, setPhotoURLInput] = useState('');

  const onSubmit = handleSubmit(async (data) => {
    if (data.date_of_birth === undefined) {
      delete data.date_of_birth;
    }
    try {
      if (data.photoURL && data.photoURL instanceof File) {
        data.photoURL = await uploadFile(data.photoURL, data.firstName);
      }
      const response = await updateUserDetails(invitation_id, data);
      toast.success('Your details have been updated successfully!');
      reset();
      router.push(paths.dashboard.user.list);
      console.info('Update response:', response);
    } catch (err) {
      console.error('Error updating invitation details:', err);
      let errorMessage = 'Update failed!';
      const errorData = err.response?.data;

      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          // Extract the 'msg' property from each error detail object if available
          errorMessage = errorData.detail
            .map((detail) =>
              typeof detail === 'object' && detail.msg
                ? detail.msg
                : typeof detail === 'object'
                ? JSON.stringify(detail)
                : detail
            )
            .join(', ');
        } else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    }


  });

  if (loading) return <Typography>Loading invitation details...</Typography>;
  if (error) return <Typography>Error loading invitation details.</Typography>;
  if (!invitation) return <Typography>Invitation not found.</Typography>;

  const renderLogo = <AnimateLogo2 sx={{ mb: 3, mx: 'auto' }} />;
  const renderHead = (
    <Stack alignItems="center" spacing={1.5} sx={{ mb: 5 }}>
      <Typography variant="h5">Update your account</Typography>
    </Stack>
  );

  // Wrap the form in FormProvider so that useController (and Controller) can read context.
  const renderForm = (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit}>
        <Grid container spacing={3}>
          {/* Left Column: Image Input */}
          <Grid item xs={12} md={4}>
            <Card sx={{ pt: 10, pb: 5, px: 3 }}>
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
              {/* Additional field to manually set a Photo URL */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <TextField
                  label="Or enter Photo URL"
                  value={photoURLInput}
                  onChange={(e) => setPhotoURLInput(e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    setValue('photoURL', photoURLInput);
                    setPhotoURLInput('');
                  }}
                >
                  Set Photo URL
                </Button>
                {typeof photoURLValue === 'string' && photoURLValue.startsWith('http') && (
                  <Box mt={2}>
                    <img
                      src={photoURLValue}
                      alt="Preview"
                      style={{ maxWidth: '200px' }}
                    />
                  </Box>
                )}
              </Stack>
            </Card>
          </Grid>
          {/* Right Column: Invitation & Update Fields */}
          <Grid item xs={12} md={8}>
          <Field.Text
                  name="invitation_company"
                  variant="filled"
                  label="Company"
                  value={invitation.company}
                  InputProps={{ readOnly: true }}
                />
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
                <Field.Text name="firstName" label="First name" />
                <Field.Text name="lastName" label="Last name" />
                <Field.Text
                  name="invitation_email"
                  label="Email"
                  value={invitation.email}
                  InputProps={{ readOnly: true }}
                />
                <Field.Phone name="phoneNumber" label="Phone number" required/>
                <Field.Text
                  name="invitation_role"
                  label="Role"
                  variant="filled"
                  value={invitation.role}
                  InputProps={{ readOnly: true }}
                />
                <Field.CountrySelect
                  fullWidth
                  name="country"
                  label="Nationality"
                  placeholder="Choose a country"
                />
                <Field.Text name="state" label="State/region" />
                <Field.Text name="city" label="City" />
                <Field.Text name="address" label="Address" />
                {/* <Field.Text name="zipCode" label="Zip/code" /> */}
                <Field.DatePicker name="date_of_birth" label="Date of Birth"/>

                <Box>
                  <Field.Text
                    name="password"
                    label="Password"
                    placeholder="8+ chars, upper, lower, number & special"
                    type={passwordToggle.value ? 'text' : 'password'}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={passwordToggle.onToggle} edge="end">
                          <Iconify icon={passwordToggle.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                        </IconButton>
                      </InputAdornment>
                    ) }}
                  />
                  <Stack spacing={0.5} sx={{ mt: 1 }}>
                    {passwordRules.map(rule => {
                      const met = rule.test(passwordValue);
                      return (
                        <Stack key={rule.label} direction="row" alignItems="center" spacing={1}>
                          <Iconify icon={met ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-outline'} color={met ? 'success.main' : 'error.main'} />
                          <Typography variant="body2" sx={{ color: met ? 'success.main' : 'error.main' }}>{rule.label}</Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
                 <Field.Text
                            name="re_password"
                            label="Re-enter Password"
                            placeholder="Confirm your password"
                            type={rePasswordToggle.value ? 'text' : 'password'}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{ endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={rePasswordToggle.onToggle} edge="end">
                                  <Iconify icon={rePasswordToggle.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                                </IconButton>
                              </InputAdornment>
                            ) }}
                          />
                {/* <Field.Text
                  name="password"
                  label="Password"
                  variant="filled"
                  InputLabelProps={{ shrink: true }}
                  type="password"
                />
                <Field.Text
                  name="re_password"
                  label="Confirm Password"
                  variant="filled"
                  InputLabelProps={{ shrink: true }}
                  type="password"
                /> */}
              </Box>
              <Stack alignItems="flex-end" sx={{ mt: 3 }}>
                <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                  Update Account
                </LoadingButton>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </form>
    </FormProvider>
  );

  return (
    <>
      {renderLogo}
      {renderHead}
      {renderForm}
    </>
  );
}
