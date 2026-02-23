/**
 * OAuth Setup Validation Component
 *
 * This component validates and displays the OAuth configuration status
 * for Google services integration. It provides feedback on configuration
 * completeness and helps troubleshoot setup issues.
 */

import React from 'react';

import {
  Box,
  Card,
  Stack,
  Alert,
  Button,
  Collapse,
  Typography,
  IconButton,
} from '@mui/material';

import { googleOAuthConfig } from 'src/utils/google-oauth-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function OAuthSetupValidation({
  showDetails = false,
  variant = 'outlined',
  sx,
  ...other
}) {
  const [expanded, setExpanded] = React.useState(showDetails);
  const isConfigured = googleOAuthConfig.isConfigured();
  const clientId = googleOAuthConfig.getClientId();

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const severity = isConfigured ? 'success' : 'warning';

  return (
    <Card variant={variant} sx={{ p: 3, ...sx }} {...other}>
      <Stack spacing={2}>
        {/* Main Status Alert */}
        <Alert
          severity={severity}
          action={
            <IconButton
              size="small"
              onClick={handleToggleExpanded}
              sx={{ mt: -0.5 }}
            >
              <Iconify
                icon={expanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                width={20}
              />
            </IconButton>
          }
        >
          <Typography variant="subtitle2" gutterBottom>
            Google OAuth Configuration {isConfigured ? 'Active' : 'Required'}
          </Typography>

          {isConfigured ? (
            <Typography variant="body2">
              Google OAuth is properly configured and ready to use.
              {clientId && (
                <>
                  <br />
                  <strong>Client ID:</strong> ...{clientId.slice(-12)}
                </>
              )}
            </Typography>
          ) : (
            <Typography variant="body2">
              Google OAuth credentials are not configured. Click below for setup instructions.
            </Typography>
          )}
        </Alert>

        {/* Detailed Configuration Information */}
        <Collapse in={expanded}>
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="logos:google" width={24} />
              OAuth Configuration Details
            </Typography>

            {isConfigured ? (
              <Stack spacing={2}>
                {/* Configuration Status */}
                <Box>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    ✓ Configuration Complete
                  </Typography>
                  <Stack spacing={1} sx={{ pl: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Client ID:
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {clientId ? `...${clientId.slice(-12)}` : 'Not available'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Status:
                      </Typography>
                      <Typography variant="body2" color="success.main">
                        Active
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Services Available:
                      </Typography>
                      <Typography variant="body2">
                        Gmail, Drive, Calendar, Meet
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Available Scopes */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Available OAuth Scopes
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {[
                      'User Profile & Email',
                      'Gmail Send & Modify',
                      'Google Drive File Access',
                      'Google Calendar Events',
                      'Google Meet Integration',
                    ].map((scope, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                        <Iconify icon="eva:checkmark-fill" width={16} color="success.main" />
                        <Typography variant="body2">{scope}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Test Configuration Button */}
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="eva:play-circle-outline" />}
                  onClick={() => {
                    window.open(
                      googleOAuthConfig.generateAuthUrl('full', 'test-integration'),
                      '_blank',
                      'width=500,height=600'
                    );
                  }}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Test OAuth Flow
                </Button>
              </Stack>
            ) : (
              <Stack spacing={2}>
                {/* Setup Instructions */}
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Setup Instructions
                  </Typography>
                  <Typography variant="body2">
                    To enable Google OAuth integration, you need to configure the following
                    environment variables in your <code>.env</code> file:
                  </Typography>
                </Alert>

                {/* Environment Variables */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Required Environment Variables
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.neutral',
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
{`# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here`}
                    </pre>
                  </Box>
                </Box>

                {/* Setup Steps */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    How to Get Google OAuth Credentials
                  </Typography>
                  <Stack spacing={1} sx={{ pl: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        1.
                      </Typography>
                      <Typography variant="body2">
                        Go to the{' '}
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                          sx={{ p: 0, minWidth: 'auto', textDecoration: 'underline' }}
                        >
                          Google Cloud Console
                        </Button>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        2.
                      </Typography>
                      <Typography variant="body2">
                        Create a new project or select an existing one
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        3.
                      </Typography>
                      <Typography variant="body2">
                        Enable the Google APIs you want to use (Gmail, Drive, Calendar)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        4.
                      </Typography>
                      <Typography variant="body2">
                        Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        5.
                      </Typography>
                      <Typography variant="body2">
                        Set application type to Web application
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        6.
                      </Typography>
                      <Typography variant="body2">
                        Add your domain to Authorized redirect URIs: <br />
                        <code>{window.location.origin}/dashboard/integration/oauth-callback</code>
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        7.
                      </Typography>
                      <Typography variant="body2">
                        Copy the Client ID and Client Secret to your .env file
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                        8.
                      </Typography>
                      <Typography variant="body2">
                        Restart your development server
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Help Links */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Helpful Resources
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Iconify icon="eva:external-link-outline" />}
                      onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                    >
                      Google Cloud Console
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Iconify icon="eva:book-outline" />}
                      onClick={() => window.open('https://developers.google.com/identity/protocols/oauth2', '_blank')}
                    >
                      OAuth 2.0 Docs
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}

export default OAuthSetupValidation;

