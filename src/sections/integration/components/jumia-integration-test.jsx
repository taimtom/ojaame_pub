import { useState } from 'react';

import {
  Box,
  Card,
  Stack,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { JumiaIntegration } from './jumia-integration';

// ----------------------------------------------------------------------

// Mock integration data for testing
const MOCK_INTEGRATION = {
  id: 1,
  name: 'Test Jumia Store',
  provider: 'jumia',
  integration_type: 'ecommerce',
  is_active: true,
  account_email: 'test@jumia.com',
  created_at: new Date().toISOString(),
  config: {
    shop_id: 'test-shop',
    api_key: '***',
  },
};

// ----------------------------------------------------------------------

export function JumiaIntegrationTest() {
  const [showIntegration, setShowIntegration] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTestIntegration = async () => {
    setLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowIntegration(true);
      toast.success('Jumia integration loaded successfully!');
    } catch (error) {
      toast.error('Failed to load integration');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.info('Refreshing integration data...');
  };

  return (
    <Stack spacing={3}>
      {/* Test Control Panel */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Jumia Integration Test</Typography>
          <Typography variant="body2" color="text.secondary">
            Use this panel to test the Jumia integration component display
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:play-circle-fill" />}
              onClick={handleTestIntegration}
              disabled={loading || showIntegration}
            >
              {loading ? 'Loading...' : 'Load Integration'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={() => {
                setShowIntegration(false);
                setTimeout(() => setShowIntegration(true), 100);
              }}
              disabled={!showIntegration}
            >
              Reload Component
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="eva:close-fill" />}
              onClick={() => setShowIntegration(false)}
              disabled={!showIntegration}
            >
              Hide Integration
            </Button>
          </Stack>
          
          {loading && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="body2">Loading integration component...</Typography>
            </Box>
          )}
        </Stack>
      </Card>

      {/* Integration Status */}
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Integration Status</Typography>
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Component Loaded: 
            </Typography>
            <Typography variant="body2" color={showIntegration ? 'success.main' : 'error.main'}>
              {showIntegration ? 'Yes' : 'No'}
            </Typography>
          </Stack>
          
          {showIntegration && (
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">Mock Integration Data:</Typography>
              <Box component="pre" sx={{ fontSize: '0.75rem', bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
                {JSON.stringify(MOCK_INTEGRATION, null, 2)}
              </Box>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Actual Integration Component */}
      {showIntegration && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Jumia Integration Component
          </Typography>
          <JumiaIntegration 
            integration={MOCK_INTEGRATION} 
            onRefresh={handleRefresh} 
          />
        </Box>
      )}
    </Stack>
  );
}

