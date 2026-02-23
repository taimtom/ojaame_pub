import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Stack,
  Button,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { createIntegration } from 'src/actions/integration';
import { STATIC_GOOGLE_OAUTH_CONFIG } from 'src/config/google-oauth-static';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const PROVIDERS = [
  { value: 'google', label: 'Google' },
  { value: 'jumia', label: 'Jumia' },
];

const TYPE_OPTIONS = {
  google: [
    { value: 'email', label: 'Email' },
    { value: 'drive', label: 'Drive' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'meet', label: 'Meet' },
  ],
  jumia: [
    { value: 'ecommerce', label: 'E-commerce' },
  ],
};

const CONFIG_TEMPLATES = {
  google: {
    email: {
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: STATIC_GOOGLE_OAUTH_CONFIG.redirect_uri
    },
    drive: {
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: STATIC_GOOGLE_OAUTH_CONFIG.redirect_uri
    },
    calendar: {
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: STATIC_GOOGLE_OAUTH_CONFIG.redirect_uri
    },
    meet: {
      client_secrets: STATIC_GOOGLE_OAUTH_CONFIG.client_secrets,
      redirect_uri: STATIC_GOOGLE_OAUTH_CONFIG.redirect_uri
    },
  },
  jumia: {
    ecommerce: {
      client_id: 'YOUR_JUMIA_CLIENT_ID',
      client_secret: 'YOUR_JUMIA_CLIENT_SECRET',
      base_url: 'https://vendor-api-staging.jumia.com',
      redirect_uri: 'YOUR_REDIRECT_URI',
    },
  },
};

// ----------------------------------------------------------------------

export function IntegrationCreateView() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    integration_type: '',
    description: '',
    config: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Auto-update config template when provider or type changes
      if (name === 'provider' || name === 'integration_type') {
        const provider = name === 'provider' ? value : prev.provider;
        const type = name === 'integration_type' ? value : prev.integration_type;

        if (provider && type && CONFIG_TEMPLATES[provider]?.[type]) {
          newData.config = JSON.stringify(CONFIG_TEMPLATES[provider][type], null, 2);
        }
      }

      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);

      // Validate JSON config
      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(formData.config || '{}');
      } catch (err) {
        toast.error('Invalid JSON configuration');
        return;
      }

      const payload = {
        name: formData.name,
        provider: formData.provider,
        integration_type: formData.integration_type,
        description: formData.description,
        config: parsedConfig,
        company_id: user?.company_id,
      };

      const result = await createIntegration(payload);
      toast.success('Integration created successfully!');
      navigate(paths.dashboard.integration.details(result.id));
    } catch (err) {
      console.error('Error creating integration:', err);
      toast.error('Failed to create integration');
    } finally {
      setCreating(false);
    }
  };

  const availableTypes = formData.provider ? TYPE_OPTIONS[formData.provider] || [] : [];

  return (
    <>
      <Helmet>
        <title>Create Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Create Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'List', href: paths.dashboard.integration.list },
            { name: 'Create' },
          ]}
          sx={{ mb: 5 }}
        />

        <Card sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Typography variant="h6" gutterBottom>
                Integration Information
              </Typography>

              <TextField
                name="name"
                label="Integration Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="e.g., My Google Email Integration"
              />

              <FormControl fullWidth required>
                <InputLabel>Provider</InputLabel>
                <Select
                  name="provider"
                  value={formData.provider}
                  label="Provider"
                  onChange={handleInputChange}
                >
                  {PROVIDERS.map((provider) => (
                    <MenuItem key={provider.value} value={provider.value}>
                      {provider.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required disabled={!formData.provider}>
                <InputLabel>Integration Type</InputLabel>
                <Select
                  name="integration_type"
                  value={formData.integration_type}
                  label="Integration Type"
                  onChange={handleInputChange}
                >
                  {availableTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
                placeholder="Optional description for this integration"
              />

              <TextField
                name="config"
                label="Configuration (JSON)"
                value={formData.config}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={15}
                required
                helperText="Configuration will be auto-populated based on provider and type selection"
              />

              <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={creating}
                  startIcon={creating ? <CircularProgress size={20} /> : <Iconify icon="eva:plus-fill" />}
                >
                  {creating ? 'Creating...' : 'Create Integration'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate(paths.dashboard.integration.list)}
                  disabled={creating}
                  startIcon={<Iconify icon="eva:arrow-back-fill" />}
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </form>
        </Card>
      </Box>
    </>
  );
}

