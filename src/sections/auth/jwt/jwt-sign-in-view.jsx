// File: src/sections/auth/jwt/sign-in.jsx
import { z as zod } from 'zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { signInWithPassword } from 'src/auth/context/jwt';

// Schema for validating email and password fields.
export const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
});

export function JwtSignInView() {
  const router = useRouter();
  const { checkUserSession } = useAuthContext();
  const [errorMsg, setErrorMsg] = useState('');
  const password = useBoolean();

  const defaultValues = {
    email: 'hello@gmail.com',
    password: '123456',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Email/Password form submission handler.
  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession();
      router.refresh();
    } catch (error) {
      console.error(error);

      let errorMessage = '';

      // Case 1: Axios error with response.data.detail
      const response = error?.response;
      if (response?.data?.detail) {
        errorMessage =
          typeof response.data.detail === 'string'
            ? response.data.detail
            : JSON.stringify(response.data.detail);
      }
      // Case 2: Interceptor already returned plain data object: { detail: '...' }
      else if (error?.detail) {
        errorMessage =
          typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
      }
      // Case 3: Standard Error instance
      else if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Fallback: generic message
      else {
        errorMessage = 'An error occurred while signing in.';
      }

      setErrorMsg(errorMessage);
      toast.error(errorMessage);
    }
  });

  // Handler for the Google sign-in button.
  const handleGoogleSignIn = () => {
    // IMPORTANT: Update these values to match your Google Console settings.
    const GOOGLE_CLIENT_ID = '181864963042-iu9uubcbthf2tncerkarlnp4ehepk7cr.apps.googleusercontent.com'; // Replace with your actual Client ID.

    const redirectUri = encodeURIComponent('http://localhost:3030/auth/google');


    // We'll request basic profile, email, and OpenID.
    const scope = encodeURIComponent('openid email profile');

    // A random nonce helps prevent replay attacks.
    const nonce = Math.random().toString(36).substring(2);

    // Construct the Google OAuth URL.
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${nonce}`;

    // Redirect the browser to start the Google OAuth flow.
    window.location.href = googleAuthUrl;
  };
  // Render header section.
  const renderHead = (
    <Stack spacing={1.5} sx={{ mb: 5 }}>
      <Typography variant="h5">Sign in to your account</Typography>
      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`Don't have an account?`}
        </Typography>
        <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
          Get started
        </Link>
        <Link component={RouterLink} href={paths.auth.jwt.updateStaff(123)} variant="subtitle2">
          || User Update
        </Link>
      </Stack>
    </Stack>
  );

  // Render email/password form.
  const renderForm = (
    <Stack spacing={3}>
      <Field.Text name="email" label="Email address" InputLabelProps={{ shrink: true }} />
      <Stack spacing={1.5}>

        <Field.Text
          name="password"
          label="Password"
          placeholder="6+ characters"
          type={password.value ? 'text' : 'password'}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify
                    icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Sign in..."
      >
        Sign in
      </LoadingButton>
      <Link
          component={RouterLink}
          href={paths.auth.jwt.resetPassword}
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Forgot password?
        </Link>
    </Stack>
  );

  // Render the Google sign-in button.
  const renderGoogleSignIn = (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography
        variant="body2"
        align="center"
        sx={{ color: 'text.secondary', fontWeight: 500, letterSpacing: 0.5 }}
      >
        {/* Or continue with */}
      </Typography>

      <Button
        fullWidth
        variant="outlined"
        onClick={handleGoogleSignIn}
        startIcon={<Iconify icon="logos:google-icon" width={20} height={20} />}
        sx={{
          textTransform: 'none',
          py: 1.5,
          borderRadius: 3,
          fontWeight: 600,
          boxShadow: 1,
          borderColor: 'grey.300',
          bgcolor: 'background.paper',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            boxShadow: 4,
            transform: 'translateY(-2px)',
            bgcolor: 'grey.50',
          },
        }}
      >
        Continue with Google
      </Button>
    </Stack>
  );

  return (
    <>
      {renderHead}

      <Alert severity="info" sx={{ mb: 3 }}>
        Use <strong>{defaultValues.email}</strong> with password{' '}
        <strong>{defaultValues.password}</strong>
      </Alert>

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      {/* Google Sign In Button */}
      {renderGoogleSignIn}
    </>
  );
}

export default JwtSignInView;
