import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { EmailInboxIcon } from 'src/assets/icons';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { verifyEmail, resendVerification } from 'src/auth/context/jwt';

// Validation Schema
const VerifySchema = zod
  .object({
    code: zod.string().min(1, { message: 'Code is required!' }).min(6, { message: 'Code must be at least 6 characters!' }),
  })
  .passthrough();

// Main Component
export function SplitVerifyView() {
  const { checkUserSession, user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const defaultValues = {
    code: '',
    email: ''
  };
  const methods = useForm({
    resolver: zodResolver(VerifySchema),
    defaultValues,
  });

  useEffect(() => {
    // If user context is not set, try updating session
    if (!user) {
      checkUserSession();
    }
  }, [user, checkUserSession]);

  useEffect(() => {
    // Set the email in the form if available
    if (user?.email) {
      methods.setValue('email', user.email);
    }
  }, [user, methods]);

  // Redirect to dashboard if already verified
  useEffect(() => {
    if (user?.email_verified) {
      router.replace(paths.dashboard.root);
    }
  }, [user, router]);

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyEmail({ code: data.code });
      await checkUserSession();
      // Redirect after successful verification
      router.replace(paths.dashboard.root);
    } catch (err) {
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  });

   // Handler for resending verification code
  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      const res = await resendVerification();
      setSuccess(res.message || "New verification code sent");
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  // Header Section
  const renderHead = (
    <>
      <EmailInboxIcon sx={{ mx: 'auto' }} />
      <Stack spacing={1} sx={{ mt: 3, mb: 5, textAlign: 'center', whiteSpace: 'pre-line' }}>
        <Typography variant="h5">Please check your email!</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`We've emailed a 6-digit confirmation code. \nPlease enter the code in the box below to verify your email.`}
        </Typography>
      </Stack>
    </>
  );

  // Form Section
  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        name="email"
        label="Email address"
        InputLabelProps={{ shrink: true }}
        disabled  // Display the email but do not allow editing
      />
      <Field.Code name="code" />
      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting || loading}
        loadingIndicator="Verifying..."
      >
        Verify
      </LoadingButton>
      {error && <Typography color="error">{error}</Typography>}
      {success && <Typography color="success.main">{success}</Typography>}
      <Typography variant="body2" sx={{ mx: 'auto' }}>
        {`Don’t have a code? `}
        <Link variant="subtitle2" sx={{ cursor: 'pointer' }} onClick={handleResend}>
          Resend code
        </Link>
      </Typography>
      <Link
        component={RouterLink}
        href={paths.auth.jwt.signIn}
        color="inherit"
        variant="subtitle2"
        sx={{ mx: 'auto', alignItems: 'center', display: 'inline-flex' }}
      >
        <Iconify icon="eva:arrow-ios-back-fill" width={16} sx={{ mr: 0.5 }} />
        Return to sign in
      </Link>
    </Stack>
  );

  return (
    <>
      {renderHead}
      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
