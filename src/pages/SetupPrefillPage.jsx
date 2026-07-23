import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { parseSetupPrefillParam, saveSetupPrefill } from 'src/utils/setup-prefill';

export default function SetupPrefillPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const encoded = searchParams.get('d');
    const payload = parseSetupPrefillParam(encoded);
    if (payload) {
      saveSetupPrefill(payload);
    }
    navigate(paths.auth.jwt.signUp, { replace: true, state: { fromSetupBuilder: Boolean(payload) } });
  }, [navigate, searchParams]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <CircularProgress />
      <Typography color="text.secondary">Preparing your setup...</Typography>
    </Box>
  );
}
