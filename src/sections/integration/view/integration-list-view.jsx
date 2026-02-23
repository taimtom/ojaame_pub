// src/sections/integration/view/IntegrationListView.jsx

// import { mutate } from 'swr';
import { Helmet } from 'react-helmet-async';
import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Stack,
  // Paper,
  // Table,
  Alert,
  Button,
  Select,
  Dialog,
  MenuItem,
  // TableRow,
  // TableHead,
  TextField,
  // TableCell,
  // TableBody,
  InputLabel,
  // IconButton,
  Typography,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  OutlinedInput,
  // useTheme,
  // useMediaQuery,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

// import axiosInstance, { endpoints } from 'src/utils/axios';
// import { exchangeOAuthCode } from 'src/utils/integration'; // ← Import the exchange function

import { googleOAuthConfig } from 'src/utils/google-oauth-config';

import { CONFIG } from 'src/config-global';
import { useGetStores } from 'src/actions/store';
import {
  createIntegration,
  exchangeOAuthCode,
  deleteIntegration,
  useListIntegrations,
} from 'src/actions/integration';
import {
  // GOOGLE_OAUTH_SCOPES,
  INTEGRATION_SCOPE_SETS,
  STATIC_GOOGLE_OAUTH_CONFIG
}
   from 'src/config/google-oauth-static';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { OAuthSetupValidation } from 'src/components/integration/oauth-setup-validation';

import { useAuthContext } from 'src/auth/hooks';

import { IntegrationList } from '../integration-list';
import { IntegrationSetupGuide, IntegrationConfigForm } from '../components';

// ----------------------------------------------------------------------
// Supported providers
const PROVIDERS = [
  { value: 'google', label: 'Google' },
  { value: 'jumia', label: 'Jumia' },
];

// Mapping provider → allowed types
const TYPE_OPTIONS = {
  google: [
    { value: 'email', label: 'Email' },
    { value: 'drive', label: 'Drive' },
  ],
  jumia: [{ value: 'ecommerce', label: 'E-commerce' }],
};

// Use static Google OAuth configuration

// Predefined JSON templates for each provider + type
const TEMPLATES = {
  google: {
    email: JSON.stringify({
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: 'http://localhost:3030/app/integration/oauth-success',
      scopes: INTEGRATION_SCOPE_SETS.email
    }, null, 2),
    drive: JSON.stringify({
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: 'http://localhost:3030/app/integration/oauth-success',
      scopes: INTEGRATION_SCOPE_SETS.drive
    }, null, 2),
  },
  jumia: {
    ecommerce: `{
  "client_id": "YOUR_JUMIA_CLIENT_ID",
  "client_secret": "YOUR_JUMIA_CLIENT_SECRET",
  "base_url": "https://vendor-api-staging.jumia.com",
  "redirect_uri": "${window.location.origin}/dashboard/integration/list"
}`,
  },
};

// ----------------------------------------------------------------------

export function IntegrationListView() {
  const { user } = useAuthContext();
  const companyId = user?.company_id || null;

  // react-router hooks for OAuth‐callback handling
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch all stores for this company
  const { stores, storesLoading, storesError } = useGetStores();

  // react-hook-form setup for single-select store
  const { control, watch, setValue } = useForm({
    defaultValues: {
      store_id: '',
    },
  });

  // Keep an internal state for the selected store
  const selectedStore = watch('store_id');

  // When stores load, set default to the first store
  useEffect(() => {
    if (!storesLoading && stores.length > 0) {
      setValue('store_id', stores[0].id);
    }
  }, [stores, storesLoading, setValue]);

  // Fetch integrations for the selected store (and company)
  const {
    integrations,
    integrationsLoading,
    integrationsError,
    integrationsValidating,
    integrationsEmpty,
  } = useListIntegrations({
    storeId: selectedStore,
    companyId,
  });

  // Dialog state for "Create Integration"
  const [openDialog, setOpenDialog] = useState(false);

  // Form state for new integration
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    provider: '',
    integration_type: '',
    config: '{}',
  });

  // Create button loading
  const [creating, setCreating] = useState(false);

  // Setup guide state
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [setupGuideProvider, setSetupGuideProvider] = useState('');

  // Destructure provider and integration_type so we can depend on them directly
  const { provider, integration_type } = newIntegration;

  // When provider or integration_type changes, enforce allowed type rules and auto-fill config
  useEffect(() => {
    // Enforce type based on provider
    if (provider === 'jumia') {
      if (integration_type !== 'ecommerce') {
        setNewIntegration((prev) => ({
          ...prev,
          integration_type: 'ecommerce',
        }));
      }
    } else if (provider === 'google') {
      if (!['email', 'drive'].includes(integration_type)) {
        setNewIntegration((prev) => ({ ...prev, integration_type: '' }));
      }
    } else if (integration_type) {
      // No provider selected but integration_type is set
      setNewIntegration((prev) => ({ ...prev, integration_type: '' }));
    }

    // Auto-inject template JSON once both provider and integration_type are valid
    if (
      provider &&
      integration_type &&
      TEMPLATES[provider] &&
      TEMPLATES[provider][integration_type]
    ) {
      setNewIntegration((prev) => ({
        ...prev,
        config: TEMPLATES[provider][integration_type],
      }));
    }
  }, [provider, integration_type]);

  // Detect OAuth callback query params (e.g. ?code=...&integration_id=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const integrationId = params.get('integration_id');

    if (code && integrationId) {
      // Exchange the authorization code for tokens on the backend
      exchangeOAuthCode(integrationId, code)
        .then((data) => {
          if (data.status === 'success') {
            // After successful exchange, remove query params and reload integrations
            navigate('/dashboard/integration/list', { replace: true });
          } else {
            alert('OAuth exchange failed');
          }
        })
        .catch((err) => {
          console.error(err);
          alert('Error exchanging OAuth code');
        });
    }
    // We only want to run this effect when the query string changes
  }, [location.search, navigate]);

  // Handle form field changes for new integration
  const handleFieldChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewIntegration((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Submit new integration
  const handleCreate = async () => {
    if (!selectedStore) return;
    setCreating(true);
    try {
      const payload = {
        name: newIntegration.name,
        provider: newIntegration.provider,
        integration_type: newIntegration.integration_type,
        store_id: selectedStore,
        company_id: companyId,
        config: JSON.parse(newIntegration.config || '{}'),
      };
      await createIntegration(payload);
      setOpenDialog(false);
      setNewIntegration({ name: '', provider: '', integration_type: '', config: '{}' });

      // Force a refresh of the integrations list
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to create integration');
    } finally {
      setCreating(false);
    }
  };

  // Delete an integration
  const handleDelete = async (integrationId) => {
    if (!window.confirm('Are you sure you want to delete this integration?')) return;
    try {
      await deleteIntegration(integrationId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete integration');
    }
  };

  // Activate integration: generate OAuth URL with correct state and redirect
  const handleActivate = async (integrationId) => {
    try {
      // Find the integration to get its type
      const integration = integrations.find(int => int.id === integrationId);
      const integrationType = integration?.integration_type || 'email';

      // Use the Google OAuth config to generate the proper URL with correct state
      const authUrl = googleOAuthConfig.generateAuthUrl(integrationId, integrationType);

      if (authUrl) {
        // Store integration ID as backup in localStorage
        localStorage.setItem('pendingIntegrationId', integrationId);

        // Redirect to Google OAuth
        window.location.href = authUrl;
      } else {
        alert('Failed to generate OAuth URL');
      }
    } catch (err) {
      console.error('Error generating OAuth URL:', err);
      alert(`Error generating OAuth URL: ${err.message}`);
    }
  };

  // Deactivate integration: delete as stand-in for deactivation
  const handleDeactivate = async (integrationId) => {
    try {
      await deleteIntegration(integrationId);
    } catch (err) {
      console.error(err);
      alert('Error deactivating integration');
    }
  };

  return (
    <>
      <Helmet>
        <title>Integration List | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="List"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'List' },
          ]}
          action={
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 1, md: 2 }}
              sx={{
                width: { xs: '100%', md: 'auto' },
                '& .MuiButton-root': {
                  fontSize: { xs: '0.875rem', md: '1rem' },
                  minWidth: { xs: 'auto', md: 120 }
                }
              }}
            >
              <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 180 } }}>
                <InputLabel id="select-store-label">Store</InputLabel>
                <Controller
                  name="store_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="select-store-label"
                      label="Store"
                      disabled={storesLoading || !!storesError}
                      input={<OutlinedInput label="Store" />}
                      renderValue={(selected) => {
                        const selectedStoreObj = stores.find((s) => s.id === selected);
                        return selectedStoreObj
                          ? selectedStoreObj.storeName || selectedStoreObj.name
                          : '';
                      }}
                    >
                      <MenuItem value="" disabled>
                        <em>Select a store</em>
                      </MenuItem>
                      {stores.map((store) => (
                        <MenuItem key={store.id} value={store.id}>
                          {store.storeName || store.name}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ width: { xs: '100%', md: 'auto' } }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSetupGuideProvider('google');
                    setShowSetupGuide(true);
                  }}
                  startIcon={<Iconify icon="logos:google" />}
                >
                  Google Setup
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setSetupGuideProvider('jumia');
                    setShowSetupGuide(true);
                  }}
                  startIcon={<Iconify icon="simple-icons:jumia" />}
                >
                  Jumia Setup
                </Button>
              </Stack>

              <Button
                variant="contained"
                onClick={() => setOpenDialog(true)}
                startIcon={<Iconify icon="eva:plus-fill" />}
                size="small"
              >
                New Integration
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {/* OAuth Configuration Status - Only show for administrators or if there are configuration issues */}
        {!googleOAuthConfig.isConfigured() && (
          <OAuthSetupValidation sx={{ mb: 3 }} />
        )}

        {/* Mobile-responsive content */}
        {integrationsLoading || integrationsValidating ? (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Loading integrations…</Typography>
          </Card>
        ) : integrationsError ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading integrations: {integrationsError.message}
          </Alert>
        ) : integrationsEmpty ? (
          <Card sx={{ p: 5, textAlign: 'center' }}>
            <Iconify
              icon="eva:inbox-outline"
              width={64}
              sx={{ color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No Integrations Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get started by creating your first integration with Google or Jumia.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
              startIcon={<Iconify icon="eva:plus-fill" />}
            >
              Create First Integration
            </Button>
          </Card>
        ) : (
          <IntegrationList
            integrations={integrations}
            onView={(id) => {
              // Navigate to integration detail view
              navigate(paths.dashboard.integration.details(id));
            }}
            onEdit={(id) => {
              // Navigate to edit integration
              navigate(paths.dashboard.integration.edit(id));
            }}
            onDelete={handleDelete}
            onSetup={handleActivate}
          />
        )}

        {/* Setup Guide */}
        {showSetupGuide && (
          <Box sx={{ mt: 3 }}>
            <IntegrationSetupGuide
              provider={setupGuideProvider}
              onClose={() => setShowSetupGuide(false)}
            />
          </Box>
        )}

        {/* Create Integration Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>New Integration</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                name="name"
                label="Integration Name"
                value={newIntegration.name}
                onChange={handleFieldChange}
                fullWidth
              />

              <FormControl fullWidth size="small">
                <InputLabel id="provider-label">Provider</InputLabel>
                <Select
                  name="provider"
                  value={newIntegration.provider}
                  label="Provider"
                  onChange={handleFieldChange}
                >
                  {PROVIDERS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel id="type-label">Integration Type</InputLabel>
                <Select
                  name="integration_type"
                  value={newIntegration.integration_type}
                  label="Integration Type"
                  onChange={handleFieldChange}
                  disabled={!newIntegration.provider}
                >
                  {(newIntegration.provider
                    ? TYPE_OPTIONS[newIntegration.provider]
                    : []
                  ).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

<IntegrationConfigForm
  provider={newIntegration.provider}
  onConfigChange={(newConfig) =>
    setNewIntegration((prev) => ({ ...prev, config: JSON.stringify(newConfig, null, 2) }))
  }
/>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} variant="contained" disabled={creating}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
}
