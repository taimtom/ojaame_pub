// import { z as zod } from 'zod';
import { useState } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

// import { useBoolean } from 'src/hooks/use-boolean';

import { signUp } from 'src/auth/context/jwt';
import { useAuthContext } from 'src/auth/hooks';

import { FormWizard } from './form-wizard'; // Import FormWizard component

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const { checkUserSession } = useAuthContext();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');

  // Handle final form submission after all steps are completed
  const handleFinalSubmit = async (data) => {
    try {
      await signUp({
        email: data.stepThree.email, // Collect email from Step 3
        password: data.password, // Assume password handled outside wizard for simplicity
        firstName: data.stepOne.firstName,
        lastName: data.stepOne.lastName,
      });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : error);
    }
  };

  const renderHead = (
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
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 3,
        textAlign: 'center',
        typography: 'caption',
        color: 'text.secondary',
      }}
    >
      {'By signing up, I agree to '}
      <Link underline="always" color="text.primary">
        Terms of service
      </Link>
      {' and '}
      <Link underline="always" color="text.primary">
        Privacy policy
      </Link>
      .
    </Typography>
  );

  return (
    <>
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Integrate the FormWizard component here */}
      <FormWizard onSubmit={handleFinalSubmit} />

      {renderTerms}
    </>
  );
}
