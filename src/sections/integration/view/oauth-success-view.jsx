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

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function OAuthSuccessView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthSuccess = async () => {
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

        // Parse state to get integration ID with better error handling
        let integrationId;
        let stateError = null;

        try {
          if (state) {
            // Try to parse as JSON first
            const stateData = JSON.parse(decodeURIComponent(state));
            ({ integrationId } = stateData);
            console.log('Parsed state data:', stateData);
          }
        } catch (err) {
          stateError = err;
          console.warn('Failed to parse OAuth state as JSON:', err);

          // If JSON parsing fails, check if state is a plain string ID
          try {
            const plainState = decodeURIComponent(state);
            // If it looks like a simple ID string, use it directly
            if (plainState && /^[a-zA-Z0-9]+$/.test(plainState)) {
              integrationId = plainState;
              console.log('Using plain state as integration ID:', integrationId);
            }
          } catch (err2) {
            console.warn('Failed to decode state as plain string:', err2);
          }
        }

        // Fallback to localStorage if state parsing failed
        if (!integrationId) {
          integrationId = localStorage.getItem('pendingIntegrationId');
          if (integrationId) {
            console.log('Using integration ID from localStorage:', integrationId);
            localStorage.removeItem('pendingIntegrationId');
          }
        }

        if (!integrationId) {
          throw new Error(`Integration ID not found in OAuth state. State parse error: ${stateError?.message || 'Unknown'}. Please ensure the OAuth flow was initiated properly.`);
        }

        // Call the backend's public OAuth callback endpoint with hard-coded config
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://127.0.0.1:8004';
        const requestUrl = `${serverUrl}/api/integrations/oauth-callback-public?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}&integration_id=${integrationId}`;

        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (data.status === 'success') {
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
          throw new Error(data.error || 'Failed to configure integration');
        }
      } catch (err) {
        console.error('OAuth success callback error:', err);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setProcessing(false);
      }
    };

    handleOAuthSuccess();
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
                Finalizing your integration...
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Please wait while we complete the OAuth setup process.
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
                {result.type === 'success' ? 'Integration Activated!' : 'Configuration Complete'}
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
              <Typography variant="h6">Activation Failed</Typography>
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

