import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Card,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useListIntegrations } from 'src/actions/integration';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { JumiaIntegration, GoogleIntegration } from '../components';

// ----------------------------------------------------------------------

export function IntegrationDetailsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const companyId = user?.company_id || null;

  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch integrations and find the specific one
  const {
    integrations,
    integrationsLoading,
    integrationsError,
  } = useListIntegrations({ companyId });

  useEffect(() => {
    if (!integrationsLoading && integrations.length > 0) {
      const foundIntegration = integrations.find((int) => int.id === parseInt(id, 10));
      setIntegration(foundIntegration || null);
      setLoading(false);
    } else if (!integrationsLoading) {
      setLoading(false);
    }
  }, [integrations, integrationsLoading, id]);

  const handleRefresh = () => {
    // Force a refresh of the data
    window.location.reload();
  };

  if (loading || integrationsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!integration) {
    return (
      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Integration Not Found"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'Details' },
          ]}
        />
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Integration not found
          </Typography>
          <Typography color="text.secondary" gutterBottom>
            The integration you are looking for does not exist or has been removed.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate(paths.dashboard.integration.root)}
            startIcon={<Iconify icon="eva:arrow-back-outline" />}
          >
            Back to Integrations
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <>
      <Helmet>
        <title>Integration Details | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading={integration.name}
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: integration.name },
          ]}
          action={
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => navigate(paths.dashboard.integration.edit(id))}
                startIcon={<Iconify icon="eva:edit-fill" />}
              >
                Edit
              </Button>
              {integration.is_active && (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={() => {
                      const { provider, integration_type } = integration;
                      if (provider === 'google') {
                        switch (integration_type) {
                          case 'email':
                            navigate(paths.dashboard.integration.google.email);
                            break;
                          case 'drive':
                            navigate(paths.dashboard.integration.google.drive);
                            break;
                          case 'calendar':
                            navigate(paths.dashboard.integration.google.calendar);
                            break;
                          case 'meet':
                            navigate(paths.dashboard.integration.google.meet);
                            break;
                          default:
                            console.warn('Unknown Google integration type:', integration_type);
                        }
                      } else if (provider === 'jumia') {
                        navigate(paths.dashboard.integration.jumia.products);
                      }
                    }}
                    startIcon={<Iconify icon="eva:external-link-fill" />}
                  >
                    Use Integration
                  </Button>
                  
                  {/* Usage Analytics Button for Google integrations */}
                  {integration.provider === 'google' && (
                    <Button
                      variant="outlined"
                      onClick={() => navigate(paths.dashboard.integration.usage(integration.id))}
                      startIcon={<Iconify icon="eva:bar-chart-fill" />}
                    >
                      View Usage
                    </Button>
                  )}
                </Stack>
              )}
              <Button
                variant="outlined"
                onClick={() => navigate(paths.dashboard.integration.list)}
                startIcon={<Iconify icon="eva:arrow-back-outline" />}
              >
                Back to List
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Stack spacing={3}>
          {/* Integration Status Card */}
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Integration Status</Typography>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Provider
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {integration.provider}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {integration.integration_type}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography
                    variant="body1"
                    color={integration.is_active ? 'success.main' : 'error.main'}
                  >
                    {integration.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body1">
                    {new Date(integration.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Card>

          {/* Provider-specific Integration Components */}
          {integration.provider === 'google' && (
            <GoogleIntegration integration={integration} onRefresh={handleRefresh} />
          )}

          {integration.provider === 'jumia' && (
            <JumiaIntegration integration={integration} onRefresh={handleRefresh} />
          )}

          {/* Fallback for unsupported providers */}
          {!['google', 'jumia'].includes(integration.provider) && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Integration Details
              </Typography>
              <Typography color="text.secondary">
                This integration type ({integration.provider}) is not yet supported in the UI.
                Please contact support for assistance.
              </Typography>
            </Card>
          )}
        </Stack>
      </Box>
    </>
  );
}

