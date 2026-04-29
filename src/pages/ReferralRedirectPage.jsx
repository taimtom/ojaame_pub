import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { paths } from 'src/routes/paths';

/**
 * Handles agent referral links like https://ojaa.me/ref/emma2345
 * Stores the agent code and redirects to the merchant signup page.
 */
export default function ReferralRedirectPage() {
  const { agentCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (agentCode) {
      localStorage.setItem('referral_agent_code', agentCode);
    }
    navigate(paths.auth.jwt.signUp, { replace: true });
  }, [agentCode, navigate]);

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
      <Typography color="text.secondary">Redirecting to sign up…</Typography>
    </Box>
  );
}
