import { z as zod } from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isValidPhoneNumber } from 'react-phone-number-input/input';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { signUp } from 'src/auth/context/jwt';
import { useAuthContext } from 'src/auth/hooks';
import { getGoogleAuthRedirectUrl, getGoogleClientId } from 'src/utils/google-auth-env';

// ----------------------------------------------------------------------

export const SignUpSchema = zod
  .object({
    firstName: zod.string().min(1, { message: 'First name is required!' }),
    lastName: zod.string().min(1, { message: 'Last name is required!' }),
    email: zod
      .string()
      .min(1, { message: 'Email is required!' })
      .email({ message: 'Email must be a valid email address!' }),
    phoneNumber: schemaHelper.phoneNumber({ isValidPhoneNumber }),
    password: zod
      .string()
      .min(8, { message: 'Password must be at least 8 characters!' })
      .regex(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter!' })
      .regex(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter!' })
      .regex(/(?=.*\d)/, { message: 'Password must contain at least one number!' })
      .regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, { message: 'Password must contain at least one special character!' }),
    re_password: zod.string().min(1, { message: 'Re-entering your password is required!' }),
    referral_code_used: zod.string().optional(),
  })
  .refine(data => data.password === data.re_password, {
    message: 'Passwords must match!',
    path: ['re_password'],
  });

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const { checkUserSession } = useAuthContext();
  const router = useRouter();
  const passwordToggle = useBoolean();
  const rePasswordToggle = useBoolean();
  const [errorMsg, setErrorMsg] = useState('');

  const storedReferralCode = localStorage.getItem('referral_agent_code') || '';

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      re_password: '',
      referral_code_used: storedReferralCode,
    },
  });

  // Clear stored referral code after it's been picked up by the form
  useEffect(() => {
    if (storedReferralCode) {
      localStorage.removeItem('referral_agent_code');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { handleSubmit, watch, formState: { isSubmitting } } = methods;
  const passwordValue = watch('password') || '';

  const passwordRules = [
    { label: 'At least 8 characters', test: pw => pw.length >= 8 },
    { label: 'One uppercase letter', test: pw => /[A-Z]/.test(pw) },
    { label: 'One lowercase letter', test: pw => /[a-z]/.test(pw) },
    { label: 'One number', test: pw => /\d/.test(pw) },
    { label: 'One special character', test: pw => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
  ];

  const onSubmit = handleSubmit(async errData => {
    try {
      await signUp({
        email: errData.email,
        password: errData.password,
        firstName: errData.firstName,
        lastName: errData.lastName,
        phoneNumber: errData.phoneNumber,
        re_password: errData.re_password,
        referral_code_used: errData.referral_code_used || undefined,
      });

      await checkUserSession();
      router.refresh();
      router.push(paths.auth.jwt.verify);
    } catch (err) {
      console.error('Submission error:', err);
      const { response, message: errMsg, detail: topDetail } = err;
      let message = '';

      if (response && response.data) {
        const { detail } = response.data;
        message = Array.isArray(detail)
          ? detail.join(' ')
          : typeof detail === 'string'
          ? detail
          : JSON.stringify(response.data);
      } else if (topDetail) {
        message = typeof topDetail === 'string'
          ? topDetail
          : Array.isArray(topDetail)
          ? topDetail.join(' ')
          : JSON.stringify(topDetail);
      } else {
        message = errMsg || 'An unknown error occurred';
      }

      setErrorMsg(message);
      toast.error(message);
    }
  });

  return (
    <>
      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography variant="h5">Get started absolutely free</Typography>
        <Stack direction="row" spacing={0.5}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Already have an account?
          </Typography>
          <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
            Sign in
          </Link>
        </Stack>
      </Stack>

      {!!errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.Text name="firstName" label="First name" InputLabelProps={{ shrink: true }} />
            <Field.Text name="lastName" label="Last name" InputLabelProps={{ shrink: true }} />
          </Stack>

          <Field.Text name="email" label="Email address" InputLabelProps={{ shrink: true }} />
          <Field.Phone name="phoneNumber" label="Phone number" variant="filled" InputLabelProps={{ shrink: true }} />

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

          <Field.Text
            name="referral_code_used"
            label="Referral Code (optional)"
            placeholder="e.g. emma2345"
            InputLabelProps={{ shrink: true }}
            helperText="If someone referred you, enter their code here"
          />

          <LoadingButton fullWidth color="inherit" size="large" type="submit" variant="contained" loading={isSubmitting} loadingIndicator="Create account...">
            Create account
          </LoadingButton>
        </Stack>
      </Form>

      <Stack spacing={1} sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            const clientId = getGoogleClientId();
            const redirectUrl = getGoogleAuthRedirectUrl();
            if (!clientId || !redirectUrl) {
              toast.error(
                'Google sign-up is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URL in your .env file.'
              );
              return;
            }
            const redirectUri = encodeURIComponent(redirectUrl);
            const scope = encodeURIComponent('openid email profile');
            const nonce = Math.random().toString(36).substring(2);
            window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${nonce}`;
          }}
          startIcon={<Iconify icon="logos:google-icon" width={20} height={20} />}
          sx={{ textTransform: 'none', py: 1.5, borderRadius: 3, fontWeight: 600, boxShadow: 1, borderColor: 'grey.300', bgcolor: 'background.paper', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)', bgcolor: 'grey.50' } }}
        >Continue with Google</Button>

        <Typography component="div" sx={{ mt: 3, textAlign: 'center', typography: 'caption', color: 'text.secondary' }}>
          By signing up, I agree to <Link underline="always" color="text.primary">Terms of service</Link> and <Link underline="always" color="text.primary">Privacy policy</Link>.
        </Typography>

        <Typography
          variant="caption"
          align="center"
          display="block"
          mt={2}
          color="text.disabled"
        >
          Joining as a referral agent?{' '}
          <Link
            component={RouterLink}
            to="/agent/signup"
            variant="caption"
            color="text.secondary"
            underline="hover"
          >
            Agent sign up
          </Link>
        </Typography>
      </Stack>
    </>
  );
}
