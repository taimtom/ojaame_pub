import { useState, useEffect } from 'react';

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { exchangeOAuthCode } from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function OAuthCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);


  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const oauthError = searchParams.get('error');

        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Parse state to get integration ID
        let integrationId;
        try {
          const { integrationId: parsedId } = JSON.parse(decodeURIComponent(state));
          integrationId = parsedId;
        } catch {
          // Fallback to localStorage
          integrationId = localStorage.getItem('pendingIntegrationId');
          localStorage.removeItem('pendingIntegrationId');
        }

        if (!integrationId) {
          throw new Error('Integration ID not found in OAuth state');
        }

        // Exchange authorization code for tokens
        const response = await exchangeOAuthCode(integrationId, code);

        if (response.status === 'success') {
          setResult({
            type: 'success',
            message: 'Integration configured successfully!',
            integrationId,
          });
          toast.success('Integration configured successfully!');

          // Redirect after a short delay
          setTimeout(() => {
            router.push(paths.dashboard.integration.list);
          }, 2000);
        } else {
          throw new Error(response.error || 'Failed to configure integration');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, router]);

  const handleRetry = () => {
    router.push(paths.dashboard.integration.list);
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      p={3}
    >
      <Card sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Stack spacing={3} alignItems="center">
          {processing && (
            <>
              <CircularProgress size={48} />
              <Typography variant="h6">
                Configuring your integration...
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Please wait while we complete the setup process.
              </Typography>
            </>
          )}

          {result && (
            <>
              <Iconify
                icon={
                  result.type === 'success'
                    ? 'eva:checkmark-circle-2-fill'
                    : 'eva:alert-circle-fill'
                }
                width={48}
                sx={{ color: result.type === 'success' ? 'success.main' : 'error.main' }}
              />
              <Typography variant="h6">
                {result.type === 'success' ? 'Success!' : 'Configuration Complete'}
              </Typography>
              <Alert severity={result.type} sx={{ width: '100%' }}>
                {result.message}
              </Alert>
              {result.type === 'success' && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Redirecting you back to integrations...
                </Typography>
              )}
            </>
          )}

          {error && (
            <>
              <Iconify
                icon="eva:alert-circle-fill"
                width={48}
                sx={{ color: 'error.main' }}
              />
              <Typography variant="h6">Configuration Failed</Typography>
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
              <Button
                variant="contained"
                onClick={handleRetry}
                startIcon={<Iconify icon="eva:arrow-back-fill" />}
              >
                Back to Integrations
              </Button>
            </>
          )}
        </Stack>
      </Card>
    </Box>
  );
}
