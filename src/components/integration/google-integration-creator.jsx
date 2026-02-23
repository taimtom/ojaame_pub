/**
 * Google Integration Creator Component
 *
 * Simplified interface for creating Google integrations that automatically
 * uses pre-configured OAuth credentials and only requires users to:
 * 1. Provide an integration name
 * 2. Select which Google services to enable
 *
 * This hides all complexity around OAuth client setup from end users.
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';

import {
  Box,
  Card,
  Stack,
  Alert,
  // Button,
  Switch,
  TextField,
  Typography,
  AlertTitle,
  FormControlLabel,
} from '@mui/material';

// import { googleOAuthConfig } from 'src/utils/google-oauth-config';

import { STATIC_GOOGLE_OAUTH_CONFIG } from 'src/config/google-oauth-static';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function GoogleIntegrationCreator({
  onConfigChange,
  onValidationChange,
  initialName = '',
  sx,
  ...other
}) {
  const { control, watch, formState: { errors, isValid } } = useForm({
    defaultValues: {
      name: initialName,
      services: {
        email: true,   // Gmail enabled by default
        drive: false,
        calendar: false,
      },
    },
    mode: 'onChange',
  });

  const formValues = watch();

  // Generate configuration whenever form values change
  React.useEffect(() => {
    const scopes = [];
    const enabledServices = [];

    // Build scopes and service list based on selections
    if (formValues.services?.email) {
      scopes.push(
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify'
      );
      enabledServices.push('Gmail');
    }

    if (formValues.services?.drive) {
      scopes.push(
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive'
      );
      enabledServices.push('Drive');
    }

    if (formValues.services?.calendar) {
      scopes.push(
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar'
      );
      enabledServices.push('Calendar & Meet');
    }

    // Always include basic profile scopes
    scopes.unshift(
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    );

    // Generate the simplified configuration object
    const config = {
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: STATIC_GOOGLE_OAUTH_CONFIG.redirect_uri
    };

    // Notify parent component of configuration changes
    if (onConfigChange) {
      onConfigChange(config);
    }

    // Notify parent component of validation state
    if (onValidationChange) {
      onValidationChange(isValid && !!formValues.name);
    }
  }, [formValues, isValid, onConfigChange, onValidationChange]);

  const selectedServices = Object.values(formValues.services || {}).filter(Boolean).length;

  return (
    <Card sx={{ p: 3, ...sx }} {...other}>
      <Stack spacing={3}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Iconify icon="logos:google" width={32} />
          <Box>
            <Typography variant="h6">Create Google Integration</Typography>
            <Typography variant="body2" color="text.secondary">
              Connect your Point-of-Sales system with Google services
            </Typography>
          </Box>
        </Box>

        {/* Pre-configured Notice */}
        <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
          <AlertTitle>🎉 Ready to Go!</AlertTitle>
          <Typography variant="body2">
            Google OAuth is pre-configured for this system. Just give your integration a name
            and select the services you want to use.
          </Typography>
        </Alert>

        {/* Integration Name */}
        <Controller
          name="name"
          control={control}
          rules={{
            required: 'Integration name is required',
            minLength: { value: 3, message: 'Name must be at least 3 characters' },
            maxLength: { value: 50, message: 'Name must be less than 50 characters' },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Integration Name"
              placeholder="e.g., Main Store Google Integration"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message || 'Choose a descriptive name for this integration'}
              InputProps={{
                startAdornment: <Iconify icon="eva:edit-outline" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          )}
        />

        {/* Service Selection */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="eva:grid-outline" width={20} />
            Select Google Services ({selectedServices} selected)
          </Typography>

          <Stack spacing={2}>
            {/* Gmail Service */}
            <Controller
              name="services.email"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    p: 2.5,
                    border: 1,
                    borderColor: field.value ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    bgcolor: field.value ? 'primary.lighter' : 'background.neutral',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: field.value ? 'primary.lighter' : 'primary.lightest',
                    }
                  }}
                  onClick={() => field.onChange(!field.value)}
                >
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Iconify icon="logos:gmail" width={20} />
                          <Typography variant="subtitle2">Gmail Integration</Typography>
                          {field.value && (
                            <Box sx={{ px: 1, py: 0.25, bgcolor: 'primary.main', borderRadius: 1 }}>
                              <Typography variant="caption" color="white">ENABLED</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Send emails, invoices, and automated notifications directly from your POS system
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Email Sending</Typography>
                          </Box>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Invoice Delivery</Typography>
                          </Box>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Customer Notifications</Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', margin: 0, alignItems: 'flex-start' }}
                  />
                </Box>
              )}
            />

            {/* Google Drive Service */}
            <Controller
              name="services.drive"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    p: 2.5,
                    border: 1,
                    borderColor: field.value ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    bgcolor: field.value ? 'primary.lighter' : 'background.neutral',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: field.value ? 'primary.lighter' : 'primary.lightest',
                    }
                  }}
                  onClick={() => field.onChange(!field.value)}
                >
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Iconify icon="logos:google-drive" width={20} />
                          <Typography variant="subtitle2">Google Drive Integration</Typography>
                          {field.value && (
                            <Box sx={{ px: 1, py: 0.25, bgcolor: 'primary.main', borderRadius: 1 }}>
                              <Typography variant="caption" color="white">ENABLED</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Store receipts, backup data, and share files with your team automatically
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">File Storage</Typography>
                          </Box>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Document Backup</Typography>
                          </Box>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Team Sharing</Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', margin: 0, alignItems: 'flex-start' }}
                  />
                </Box>
              )}
            />

            {/* Google Calendar Service */}
            <Controller
              name="services.calendar"
              control={control}
              render={({ field }) => (
                <Box
                  sx={{
                    p: 2.5,
                    border: 1,
                    borderColor: field.value ? 'primary.main' : 'grey.300',
                    borderRadius: 2,
                    bgcolor: field.value ? 'primary.lighter' : 'background.neutral',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: field.value ? 'primary.lighter' : 'primary.lightest',
                    }
                  }}
                  onClick={() => field.onChange(!field.value)}
                >
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Iconify icon="logos:google-calendar" width={20} />
                          <Typography variant="subtitle2">Calendar & Meet Integration</Typography>
                          {field.value && (
                            <Box sx={{ px: 1, py: 0.25, bgcolor: 'primary.main', borderRadius: 1 }}>
                              <Typography variant="caption" color="white">ENABLED</Typography>
                            </Box>
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Schedule appointments, send meeting invites, and manage customer bookings
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Appointment Booking</Typography>
                          </Box>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Meeting Invites</Typography>
                          </Box>
                          <Box sx={{ px: 1, py: 0.25, bgcolor: 'background.paper', borderRadius: 0.5 }}>
                            <Typography variant="caption">Event Management</Typography>
                          </Box>
                        </Box>
                      </Box>
                    }
                    sx={{ width: '100%', margin: 0, alignItems: 'flex-start' }}
                  />
                </Box>
              )}
            />
          </Stack>
        </Box>

        {/* Configuration Summary */}
        <Alert severity="info" icon={<Iconify icon="eva:info-outline" />}>
          <Typography variant="body2">
            <strong>💡 What happens next:</strong>
          </Typography>
          <Box component="ol" sx={{ m: 0, pl: 2 }}>
            <li>Your integration will be created with the selected services</li>
            <li>Click Activate to connect with your Google account</li>
            <li>Grant permissions for the services you ve selected</li>
            <li>Start using Google features in your POS system!</li>
          </Box>
        </Alert>

        {/* Validation Summary */}
        {!isValid && (
          <Alert severity="warning">
            <Typography variant="body2">
              Please provide an integration name to continue.
            </Typography>
          </Alert>
        )}
      </Stack>
    </Card>
  );
}

export default GoogleIntegrationCreator;

