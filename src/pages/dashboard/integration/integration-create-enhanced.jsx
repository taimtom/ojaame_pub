import { mutate } from 'swr';
import { useForm } from 'react-hook-form';
import { useState, useCallback } from 'react';

import {
  Box,
  Card,
  Step,
  Stack,
  Alert,
  Button,
  Stepper,
  useTheme,
  StepLabel,
  Container,
  AlertTitle,
  Typography,
  StepContent,
  useMediaQuery,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetOAuthUrl, createIntegration } from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { IntegrationConfigForm } from 'src/sections/integration/components/integration-config-form';

// ----------------------------------------------------------------------

const INTEGRATION_PROVIDERS = [
  {
    id: 'google',
    name: 'Google Workspace',
    icon: 'logos:google',
    color: '#4285f4',
    description: 'Integrate with Gmail for sending emails and Google Drive for file storage',
    types: [
      { id: 'email', name: 'Gmail', icon: 'eva:email-fill' },
      { id: 'drive', name: 'Google Drive', icon: 'eva:cloud-fill' },
    ],
  },
  {
    id: 'jumia',
    name: 'Jumia Marketplace',
    icon: 'simple-icons:jumia',
    color: '#f68b1e',
    description: 'Connect your store with Jumia for e-commerce operations',
    types: [
      { id: 'ecommerce', name: 'E-commerce', icon: 'eva:shopping-cart-fill' },
    ],
  },
];

const STEPS = [
  'Choose Provider',
  'Select Integration Type',
  'Configure Settings',
  'Complete Setup',
];

// ----------------------------------------------------------------------

export default function IntegrationCreateEnhanced() {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [config, setConfig] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [createdIntegrationId, setCreatedIntegrationId] = useState(null);

  const { control, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: '',
      provider: '',
      integrationType: '',
      storeId: null, // This would come from user context
      companyId: null, // This would come from user context
    },
  });

  // Get OAuth URL for created integration
  const { oauthUrl, oauthUrlLoading } = useGetOAuthUrl(createdIntegrationId);

  const handleNext = useCallback(() => {
    setActiveStep((prev) => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => prev - 1);
  }, []);

  const handleProviderSelect = useCallback((provider) => {
    setSelectedProvider(provider);
    setValue('provider', provider.id);
    setValue('name', `${provider.name} Integration`);
    handleNext();
  }, [setValue, handleNext]);

  const handleTypeSelect = useCallback((type) => {
    setSelectedType(type);
    setValue('integrationType', type.id);
    handleNext();
  }, [setValue, handleNext]);

  const handleConfigChange = useCallback((newConfig) => {
    setConfig(newConfig);
  }, []);

  const handleCreateIntegration = useCallback(async () => {
    const formData = watch();

    setIsCreating(true);
    try {
      const payload = {
        name: formData.name,
        provider: formData.provider,
        integration_type: formData.integrationType,
        store_id: formData.storeId,
        company_id: formData.companyId,
        config,
      };

      const result = await createIntegration(payload);

      if (result.status === 'success') {
        setCreatedIntegrationId(result.integration_id);

        // Trigger real-time update of integrations list
        mutate('/api/integrations/list');

        toast.success('Integration created successfully!');
        handleNext();
      } else {
        throw new Error(result.error || 'Failed to create integration');
      }
    } catch (error) {
      console.error('Create integration error:', error);
      toast.error(error.message || 'Failed to create integration');
    } finally {
      setIsCreating(false);
    }
  }, [watch, config, handleNext]);

  const handleCompleteOAuth = useCallback(() => {
    if (oauthUrl) {
      // Store integration ID for OAuth callback
      localStorage.setItem('pendingIntegrationId', createdIntegrationId);

      // Redirect to OAuth provider
      window.location.href = oauthUrl;
    }
  }, [oauthUrl, createdIntegrationId]);

  const handleSkipOAuth = useCallback(() => {
    toast.info('You can complete OAuth setup later from the integrations list');
    router.push('/dashboard/integration/list');
  }, [router]);

  const renderProviderStep = (
    <Stack spacing={3}>
      <Typography variant="h6" textAlign="center">
        Choose an Integration Provider
      </Typography>

      <Box
        gap={2}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
      >
        {INTEGRATION_PROVIDERS.map((provider) => (
          <Card
            key={provider.id}
            sx={{
              p: 3,
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-4px)',
                boxShadow: theme.customShadows.z12,
              },
            }}
            onClick={() => handleProviderSelect(provider)}
          >
            <Stack alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'background.neutral',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify
                  icon={provider.icon}
                  width={40}
                  sx={{ color: provider.color }}
                />
              </Box>

              <Typography variant="h6" textAlign="center">
                {provider.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                textAlign="center"
              >
                {provider.description}
              </Typography>
            </Stack>
          </Card>
        ))}
      </Box>
    </Stack>
  );

  const renderTypeStep = (
    <Stack spacing={3}>
      <Typography variant="h6" textAlign="center">
        Select Integration Type for {selectedProvider?.name}
      </Typography>

      <Box
        gap={2}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)' }}
      >
        {selectedProvider?.types.map((type) => (
          <Card
            key={type.id}
            sx={{
              p: 3,
              cursor: 'pointer',
              border: '2px solid transparent',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                transform: 'translateY(-4px)',
              },
            }}
            onClick={() => handleTypeSelect(type)}
          >
            <Stack alignItems="center" spacing={2}>
              <Iconify
                icon={type.icon}
                width={48}
                sx={{ color: 'primary.main' }}
              />
              <Typography variant="h6">{type.name}</Typography>
            </Stack>
          </Card>
        ))}
      </Box>
    </Stack>
  );

  const renderConfigStep = (
    <Stack spacing={3}>
      <Typography variant="h6" textAlign="center">
        Configure Your {selectedProvider?.name} Integration
      </Typography>

      <IntegrationConfigForm
        provider={selectedProvider?.id}
        integrationType={selectedType?.id}
        onConfigChange={handleConfigChange}
        storeId={watch('storeId')}
        companyId={watch('companyId')}
      />
    </Stack>
  );

  const renderCompleteStep = (
    <Stack spacing={3} alignItems="center">
      <Iconify
        icon="eva:checkmark-circle-2-fill"
        width={80}
        sx={{ color: 'success.main' }}
      />

      <Typography variant="h5" textAlign="center">
        Integration Created Successfully!
      </Typography>

      <Alert severity="info" sx={{ width: '100%' }}>
        <AlertTitle>Next Steps</AlertTitle>
        Complete the OAuth authorization to activate your integration.
        This will securely connect your {selectedProvider?.name} account.
      </Alert>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ width: '100%', justifyContent: 'center' }}
      >
        <Button
          variant="contained"
          size="large"
          startIcon={<Iconify icon="eva:external-link-fill" />}
          onClick={handleCompleteOAuth}
          disabled={oauthUrlLoading || !oauthUrl}
          sx={{ minWidth: 200 }}
        >
          {oauthUrlLoading ? 'Loading...' : 'Complete OAuth Setup'}
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={handleSkipOAuth}
          sx={{ minWidth: 200 }}
        >
          Skip for Now
        </Button>
      </Stack>
    </Stack>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderProviderStep;
      case 1:
        return renderTypeStep;
      case 2:
        return renderConfigStep;
      case 3:
        return renderCompleteStep;
      default:
        return 'Unknown step';
    }
  };

  return (
    <DashboardContent>
      <Container maxWidth="lg">
        <CustomBreadcrumbs
          heading="New Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integrations', href: '/dashboard/integration/list' },
            { name: 'New' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card sx={{ p: { xs: 3, md: 5 } }}>
          <Stepper
            activeStep={activeStep}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ mb: 5 }}
          >
            {STEPS.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                {isMobile && (
                  <StepContent>
                    {index === activeStep && (
                      <Box sx={{ py: 2 }}>
                        {getStepContent(activeStep)}
                      </Box>
                    )}
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>

          {!isMobile && (
            <Box sx={{ minHeight: 400 }}>
              {getStepContent(activeStep)}
            </Box>
          )}

          {!isMobile && activeStep < 3 && (
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mt: 4 }}
            >
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                startIcon={<Iconify icon="eva:arrow-left-fill" />}
              >
                Back
              </Button>

              {activeStep === 2 ? (
                <Button
                  variant="contained"
                  onClick={handleCreateIntegration}
                  disabled={isCreating}
                  endIcon={<Iconify icon="eva:arrow-right-fill" />}
                >
                  {isCreating ? 'Creating...' : 'Create Integration'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && !selectedProvider) ||
                    (activeStep === 1 && !selectedType)
                  }
                  endIcon={<Iconify icon="eva:arrow-right-fill" />}
                >
                  Next
                </Button>
              )}
            </Stack>
          )}
        </Card>
      </Container>
    </DashboardContent>
  );
}

