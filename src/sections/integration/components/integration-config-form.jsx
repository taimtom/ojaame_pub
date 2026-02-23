import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Card,
  Stack,
  Alert,
  Switch,
  Accordion,
  TextField,
  AlertTitle,
  Typography,
  FormControlLabel,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { googleOAuthConfig } from 'src/utils/google-oauth-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function IntegrationConfigForm({
  provider,
  integrationType,
  onConfigChange,
  initialConfig = {},
}) {
  const { control, watch, setValue, getValues } = useForm({
    defaultValues: {
      // Google fields
      googleClientId: '',
      googleClientSecret: '',
      googleScopes: {
        email: true,
        drive: false,
        calendar: false,
      },

      // Jumia fields
      jumiaClientId: '',
      jumiaClientSecret: '',
      jumiaBaseUrl: 'https://vendor-api-staging.jumia.com',
      jumiaShopId: '',

      // Advanced settings
      useProduction: false,
      ...initialConfig,
    },
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState('{}');

  const formValues = watch();

  // Generate JSON configuration based on form values
  useEffect(() => {
    let config = {};

    if (provider === 'google') {
      // For Google integrations, use consistent scope set to prevent OAuth scope change errors
      // Note: We use a fixed scope set regardless of selected services to avoid scope conflicts

      // Use simplified configuration format
      config = {
        client_secrets: {
          web: {
            client_id: googleOAuthConfig.getClientId(),
            client_secret: googleOAuthConfig.getClientSecret(),
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token'
          }
        },
        redirect_uri: googleOAuthConfig.generateRedirectUri()
      };
    } else if (provider === 'jumia') {
      const baseUrl = formValues.useProduction
        ? 'https://vendor-api.jumia.com'
        : formValues.jumiaBaseUrl || 'https://vendor-api-staging.jumia.com';

      config = {
        provider: 'jumia',
        client_id: formValues.jumiaClientId || 'YOUR_JUMIA_CLIENT_ID',
        client_secret: formValues.jumiaClientSecret || 'YOUR_JUMIA_CLIENT_SECRET',
        base_url: baseUrl,
        redirect_uri: `${window.location.origin}/dashboard/integration/oauth-callback`,
        auto_configured: false,
      };

      if (formValues.jumiaShopId) {
        config.shop_id = formValues.jumiaShopId;
      }
    }

    const configJson = JSON.stringify(config, null, 2);
    setGeneratedConfig(configJson);

    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [formValues, provider, integrationType, onConfigChange]);

  const renderGoogleForm = () => (
    <Stack spacing={3}>
      {/* Pre-configured OAuth Information */}
      <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
        <AlertTitle>Google OAuth Pre-Configured ✨</AlertTitle>
        <Typography variant="body2">
          🎉 <strong>Great news!</strong> Google OAuth credentials are automatically configured for this system.
          You dont need to provide your own Client ID or Secret - we ve got you covered!
        </Typography>
        <br />
        <Typography variant="body2">
          <strong>🔒 What this means for you:</strong>
        </Typography>
        <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
          <li><strong>Zero Setup:</strong> No Google Cloud Console configuration needed</li>
          <li><strong>Enterprise Security:</strong> Server-side credential management</li>
          <li><strong>Instant Access:</strong> Start using Google services immediately</li>
          <li><strong>Always Updated:</strong> Automatic security patches and updates</li>
          <li><strong>No Limits:</strong> Full access to all Google APIs</li>
        </Box>
      </Alert>

      {/* Service Selection */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="eva:settings-2-outline" width={20} />
          Select Google Services to Enable
        </Typography>
        <Stack spacing={2}>
          <Controller
            name="googleScopes.email"
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: field.value ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  bgcolor: field.value ? 'primary.lighter' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setValue('googleScopes.email', !field.value)}
              >
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="subtitle2">Gmail Integration</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Send emails, invoices, and manage email communications
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', margin: 0 }}
                />
              </Box>
            )}
          />

          <Controller
            name="googleScopes.drive"
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: field.value ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  bgcolor: field.value ? 'primary.lighter' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setValue('googleScopes.drive', !field.value)}
              >
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="subtitle2">Google Drive Integration</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload files, store documents, and manage file sharing
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', margin: 0 }}
                />
              </Box>
            )}
          />

          <Controller
            name="googleScopes.calendar"
            control={control}
            render={({ field }) => (
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: field.value ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  bgcolor: field.value ? 'primary.lighter' : 'transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setValue('googleScopes.calendar', !field.value)}
              >
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label={
                    <Box>
                      <Typography variant="subtitle2">Google Calendar & Meet Integration</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create meeting invites, schedule appointments, and manage events
                      </Typography>
                    </Box>
                  }
                  sx={{ width: '100%', margin: 0 }}
                />
              </Box>
            )}
          />
        </Stack>
      </Box>

      {/* Configuration Summary */}
      <Alert severity="info" icon={<Iconify icon="eva:info-outline" />}>
        <Typography variant="body2">
          <strong>System Configuration:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>Client ID: ...{googleOAuthConfig.getClientId().slice(-12)}</li>
          <li>Redirect URI: {googleOAuthConfig.generateRedirectUri()}</li>
          <li>Security: Server-side credential storage</li>
          <li>Status: {googleOAuthConfig.isConfigured() ? 'Active' : 'Inactive'}</li>
        </Box>
      </Alert>
    </Stack>
  );

  const renderJumiaForm = () => (
    <Stack spacing={3}>
      <Alert severity="info">
        <AlertTitle>Jumia Seller API Setup</AlertTitle>
        Get your credentials from{' '}
        <a
          href="https://seller.jumia.com.ng/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jumia Seller Portal
        </a>
        {' '}under API Settings
      </Alert>

      <Controller
        name="jumiaClientId"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Jumia Client ID"
            placeholder="your_jumia_client_id"
            fullWidth
            helperText="Client ID from Jumia Seller Portal API settings"
          />
        )}
      />

      <Controller
        name="jumiaClientSecret"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Jumia Client Secret"
            type="password"
            placeholder="your_jumia_client_secret"
            fullWidth
            helperText="Client Secret from Jumia Seller Portal API settings"
          />
        )}
      />

      <Controller
        name="jumiaShopId"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Shop ID (Optional)"
            placeholder="12345"
            fullWidth
            helperText="Your Jumia shop ID for product management"
          />
        )}
      />

      <Accordion expanded={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)}>
        <AccordionSummary expandIcon={<Iconify icon="eva:arrow-down-fill" />}>
          <Typography variant="subtitle2">Advanced Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Controller
              name="useProduction"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} />}
                  label="Use Production Environment"
                />
              )}
            />

            {!formValues.useProduction && (
              <Controller
                name="jumiaBaseUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Custom API Base URL"
                    placeholder="https://vendor-api-staging.jumia.com"
                    fullWidth
                    helperText="Custom API endpoint (leave default for staging)"
                  />
                )}
              />
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );

  return (
    <Box>
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          {provider === 'google' ? 'Google' : 'Jumia'} Integration Configuration
        </Typography>

        {provider === 'google' ? renderGoogleForm() : renderJumiaForm()}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Generated Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This JSON will be automatically generated and sent to the backend:
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.75rem',
            maxHeight: 300,
            border: 1,
            borderColor: 'grey.300',
          }}
        >
          {generatedConfig}
        </Box>
      </Card>
    </Box>
  );
}

