import { useState } from 'react';

import {
  Box,
  Card,
  Step,
  Stack,
  Alert,
  Button,
  Stepper,
  StepLabel,
  AlertTitle,
  Typography,
  StepContent,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const GOOGLE_SETUP_STEPS = [
  {
    label: 'Create Google Cloud Project',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          1. Go to the{' '}
          <a
            href="https://console.cloud.google.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Cloud Console
          </a>
        </Typography>
        <Typography variant="body2" paragraph>
          2. Create a new project or select an existing one
        </Typography>
        <Typography variant="body2" paragraph>
          3. Enable the required APIs:
          <br />• Gmail API (for email integration)
          <br />• Google Drive API (for drive integration)
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Configure OAuth Consent Screen',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          1. Go to - APIs & Services → OAuth consent screen
        </Typography>
        <Typography variant="body2" paragraph>
          2. Choose External user type
        </Typography>
        <Typography variant="body2" paragraph>
          3. Fill in your application details:
          <br />• App name: Your Company Name POS Integration
          <br />• User support email: Your support email
          <br />• Developer contact information: Your contact email
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Create OAuth2 Credentials',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          1. Go to - APIs & Services → Credentials
        </Typography>
        <Typography variant="body2" paragraph>
          2. Click - Create Credentials → OAuth 2.0 Client IDs
        </Typography>
        <Typography variant="body2" paragraph>
          3. Choose - Web application
        </Typography>
        <Typography variant="body2" paragraph>
          4. Add authorized redirect URIs:
          <br />• <code>{window.location.origin}/dashboard/integration/list</code>
        </Typography>
        <Typography variant="body2" paragraph>
          5. Download the JSON file or copy the Client ID and Client Secret
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Configure Integration',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          Use the following JSON template in the integration configuration:
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.75rem',
          }}
        >
          {`{
  "client_secrets": {
    "web": {
      "client_id": "YOUR_GOOGLE_CLIENT_ID",
      "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "redirect_uris": ["${window.location.origin}/dashboard/integration/list"]
    }
  },
  "redirect_uri": "${window.location.origin}/dashboard/integration/list",
  "scopes": [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.file"
  ]
}`}
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Replace <code>YOUR_GOOGLE_CLIENT_ID</code> and <code>YOUR_GOOGLE_CLIENT_SECRET</code> with your actual credentials.
        </Typography>
      </Box>
    ),
  },
];

const JUMIA_SETUP_STEPS = [
  {
    label: 'Access Jumia Seller Portal',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          1. Log in to your{' '}
          <a
            href="https://seller.jumia.com.ng/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jumia Seller Portal
          </a>
        </Typography>
        <Typography variant="body2" paragraph>
          2. Navigate to - Settings or API Management section
        </Typography>
        <Typography variant="body2" paragraph>
          3. Look for - Developer API or Third-party Integrations
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Generate API Credentials',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          1. Request API access from Jumia support if not available
        </Typography>
        <Typography variant="body2" paragraph>
          2. Generate or obtain your:
          <br />• Client ID
          <br />• Client Secret
          <br />• API Endpoint URL
        </Typography>
        <Typography variant="body2" paragraph>
          3. Note down your User ID and Shop ID(s)
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Set Up OAuth Redirect',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          1. Configure the authorized redirect URI in Jumia settings:
          <br /><code>{window.location.origin}/dashboard/integration/list</code>
        </Typography>
        <Typography variant="body2" paragraph>
          2. Ensure your domain is whitelisted for API access
        </Typography>
      </Box>
    ),
  },
  {
    label: 'Configure Integration',
    content: (
      <Box>
        <Typography variant="body2" paragraph>
          Use the following JSON template in the integration configuration:
        </Typography>
        <Box
          component="pre"
          sx={{
            bgcolor: 'grey.100',
            p: 2,
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.75rem',
          }}
        >
          {`{
  "client_id": "YOUR_JUMIA_CLIENT_ID",
  "client_secret": "YOUR_JUMIA_CLIENT_SECRET",
  "base_url": "https://vendor-api-staging.jumia.com",
  "redirect_uri": "${window.location.origin}/dashboard/integration/list"
}`}
        </Box>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Replace the placeholder values with your actual Jumia credentials.
          Use <code>https://vendor-api.jumia.com</code> for production.
        </Typography>
      </Box>
    ),
  },
];

export function IntegrationSetupGuide({ provider, onClose }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = provider === 'google' ? GOOGLE_SETUP_STEPS : JUMIA_SETUP_STEPS;
  const providerName = provider === 'google' ? 'Google' : 'Jumia';

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h6">
          {providerName} Integration Setup Guide
        </Typography>
        {onClose && (
          <Button
            size="small"
            color="inherit"
            onClick={onClose}
            startIcon={<Iconify icon="eva:close-outline" />}
          >
            Close
          </Button>
        )}
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>Before You Start</AlertTitle>
        {provider === 'google' ? (
          <Typography variant="body2">
            You&apos;ll need a Google account and access to Google Cloud Console.
            The setup process is free but may require verification for production use.
          </Typography>
        ) : (
          <Typography variant="body2">
            You&apos;ll need an active Jumia seller account and may need to request
            API access from Jumia support. Some features may require approval.
          </Typography>
        )}
      </Alert>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              {step.content}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    size="small"
                    disabled={index === steps.length - 1}
                  >
                    {index === steps.length - 1 ? 'Finish' : 'Continue'}
                  </Button>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    size="small"
                  >
                    Back
                  </Button>
                </Stack>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>

      {activeStep === steps.length && (
        <Box sx={{ pt: 2 }}>
          <Alert severity="success">
            <AlertTitle>Setup Complete!</AlertTitle>
            <Typography variant="body2">
              You can now create a new {providerName} integration using the configuration
              template provided in the last step.
            </Typography>
          </Alert>
          <Button onClick={handleReset} sx={{ mt: 2 }}>
            Reset Guide
          </Button>
        </Box>
      )}
    </Card>
  );
}

