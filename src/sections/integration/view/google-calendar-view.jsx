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

import { CalendarView } from 'src/sections/calendar/view';

import { GoogleCalendarUsageView } from '../components/google-calendar-usage-view';

// ----------------------------------------------------------------------

export function GoogleCalendarView() {
  const [currentTab, setCurrentTab] = useState('integration');
  const { integrations } = useListIntegrations({ provider: 'google' });

  // Get Calendar integration status
  const calendarIntegration = integrations?.find(
    (item) => item.provider === 'google' && item.integration_type === 'calendar'
  );

  const isConnected = calendarIntegration?.is_active || false;

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleConnect = () => {
    // Redirect to integration setup
    window.location.href = '/dashboard/integration/new?provider=google&type=calendar';
  };

  return (
    <>
      <Helmet>
        <title>Google Calendar Integration | Dashboard - {CONFIG.site.name}</title>
      </Helmet>

      <Box sx={{ p: 3 }}>
        <CustomBreadcrumbs
          heading="Google Calendar Integration"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Integration', href: paths.dashboard.integration.root },
            { name: 'Google Calendar' },
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
                  startIcon={<Iconify icon="logos:google-calendar" />}
                  onClick={handleConnect}
                >
                  Connect Calendar
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
            Google Calendar integration is not connected. Connect your Google Calendar to create events, sync meetings, and access the full calendar interface.
          </Alert>
        )}

        {/* Integration Info */}
        {isConnected && calendarIntegration && (
          <Card sx={{ p: 3, mb: 3, bgcolor: 'success.lighter' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Iconify icon="logos:google-calendar" width={32} />
              <Box>
                <Typography variant="h6">Google Calendar Connected</Typography>
                <Typography variant="body2" color="text.secondary">
                  Connected as: {calendarIntegration.account_email || 'Unknown'} •
                  Last synced: {calendarIntegration.last_sync ? new Date(calendarIntegration.last_sync).toLocaleString() : 'Never'}
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
            <Tab label="Integration Features" value="integration" />
            <Tab label="Calendar Interface" value="calendar" />
          </Tabs>
        </Card>

        {currentTab === 'integration' && <GoogleCalendarUsageView />}
        {currentTab === 'calendar' && (
          <Box sx={{ mt: 3 }}>
            <CalendarView />
          </Box>
        )}
      </Box>
    </>
  );
}

