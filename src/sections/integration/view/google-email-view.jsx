import { useState } from 'react';
import { Helmet } from 'react-helmet-async';

import {
  Box,
  Tab,
  Tabs,
  Card,
  Chip,
  Alert,
  Stack,
  Button,
  Typography,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';
import { useListIntegrations } from 'src/actions/integration';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MailView } from 'src/sections/mail/view';
import { EmailLogs } from 'src/sections/integration/components/email-logs';

import { GoogleEmailUsageView } from './google-email-usage-view';

// ----------------------------------------------------------------------

export function GoogleEmailView() {
  const [currentTab, setCurrentTab] = useState('compose');
  const { integrations } = useListIntegrations({ provider: 'google' });

  // Get Gmail integration status
  const emailIntegration = integrations?.find(
    (item) => item.provider === 'google' && item.integration_type === 'email'
  );

  const isConnected = emailIntegration?.is_active || false;

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleConnect = () => {
    // Redirect to integration setup
    window.location.href = '/dashboard/integration/new?provider=google&type=email';
  };

  return (
    <>
      <Helmet>
        <title>Google Email Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Google Email Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'Google Email' },
          ]}
          action={
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                icon={<Iconify icon={isConnected ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-fill'} />}
                label={isConnected ? 'Connected' : 'Disconnected'}
                color={isConnected ? 'success' : 'error'}
                variant="filled"
              />
              {!isConnected && (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="logos:google-gmail" />}
                  onClick={handleConnect}
                >
                  Connect Gmail
                </Button>
              )}
            </Stack>
          }
          sx={{ mb: 3 }}
        />

        {/* Connection Status Alert */}
        {!isConnected && (
          <Alert
            severity="warning"
            action={
              <Button
                size="small"
                variant="outlined"
                onClick={handleConnect}
                startIcon={<Iconify icon="eva:external-link-fill" />}
              >
                Setup Now
              </Button>
            }
            sx={{ mb: 3 }}
          >
            Gmail integration is not connected. Connect your Gmail account to send emails, view logs, and access the full mail interface.
          </Alert>
        )}

        {/* Integration Info */}
        {isConnected && emailIntegration && (
          <Card sx={{ p: 3, mb: 3, bgcolor: 'success.lighter' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Iconify icon="logos:google-gmail" width={32} />
              <Box>
                <Typography variant="h6">Gmail Connected</Typography>
                <Typography variant="body2" color="text.secondary">
                  Connected as: {emailIntegration.account_email || 'Unknown'} •
                  Last synced: {emailIntegration.last_sync ? new Date(emailIntegration.last_sync).toLocaleString() : 'Never'}
                </Typography>
              </Box>
            </Stack>
          </Card>
        )}

        <Card sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Compose & Send" value="compose" />
            <Tab label="Mail Interface" value="mail" />
            <Tab label="Email Logs" value="logs" />
          </Tabs>
        </Card>

        {currentTab === 'compose' && <GoogleEmailUsageView />}
        {currentTab === 'mail' && (
          <Box sx={{ mt: 3 }}>
            <MailView />
          </Box>
        )}
        {currentTab === 'logs' && (
          <Box sx={{ mt: 3 }}>
            <EmailLogs />
          </Box>
        )}
      </Box>
    </>
  );
}

