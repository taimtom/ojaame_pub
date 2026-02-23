// import { useState } from 'react';

// import {
//   Box,
//   Card,
//   Chip,
//   Stack,
//   Button,
//   Typography,
// } from '@mui/material';

import { useListIntegrations } from 'src/actions/integration';

// import { toast } from 'src/components/snackbar';
// import { Iconify } from 'src/components/iconify';

import { GoogleCalendarIntegration } from './google-calendar-integration';

// ----------------------------------------------------------------------

export function GoogleCalendarUsageView({ integration }) {
  const { integrations } = useListIntegrations({ provider: 'google' });

  // Get Calendar integration if not passed as prop
  const calendarIntegration = integration || integrations?.find(
    (item) => item.provider === 'google' && item.integration_type === 'calendar'
  );

  const handleRefresh = () => {
    // Trigger refresh of calendar data
    console.log('Refreshing calendar data...');
  };

  return (
    <GoogleCalendarIntegration
      integration={calendarIntegration}
      onRefresh={handleRefresh}
    />
  );
}

