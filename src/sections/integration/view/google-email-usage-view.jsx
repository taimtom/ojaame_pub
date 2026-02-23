import { useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Typography,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import { useListIntegrations } from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// import { GmailCompose } from '../components/gmail-compose';
import { EmailComposer } from '../components/email-composer';

// ----------------------------------------------------------------------

export function GoogleEmailUsageView({ integration }) {
  const [loading, setLoading] = useState(false);
  const openGmailCompose = useBoolean();
  const { integrations } = useListIntegrations({ provider: 'google' });

  // Get Gmail integration if not passed as prop
  const emailIntegration = integration || integrations?.find(
    (item) => item.provider === 'google' && item.integration_type === 'email'
  );

  const handleRefresh = async () => {
    try {
      setLoading(true);
      // Add refresh logic here
      toast.success('Email data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing email data:', error);
      toast.error('Failed to refresh email data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>
              Google Email Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Send emails, invoices, and meeting invites through Gmail
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<Iconify icon="logos:gmail" />}
              label="Active"
              color="success"
              variant="soft"
            />
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Email Composer */}
      <EmailComposer integration={integration} onRefresh={handleRefresh} standalone />
    </Stack>
  );
}

