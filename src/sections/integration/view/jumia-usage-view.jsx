import { useState } from 'react';

import {
  Box,
  Tab,
  Tabs,
  Card,
  Chip,
  // Alert,
  Stack,
  Button,
  Typography,
  // CircularProgress,
} from '@mui/material';

// import { useListIntegrations } from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { JumiaIntegration } from '../components/jumia-integration';
// import { JumiaIntegrationTest } from '../components/jumia-integration-test';

// ----------------------------------------------------------------------

export function JumiaUsageView({ integration, activeTab = 'products' }) {
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      // Add refresh logic here
      toast.success('Jumia data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing Jumia data:', error);
      toast.error('Failed to refresh Jumia data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>
              Jumia E-commerce Integration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your Jumia products, orders, and inventory
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              icon={<Iconify icon="simple-icons:jumia" />}
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

      {/* Navigation Tabs */}
      <Card sx={{ p: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Products" value="products" />
          <Tab label="Orders" value="orders" />
          <Tab label="Inventory" value="inventory" />
        </Tabs>

        {/* Tab Content */}
        <Box>
          {currentTab === 'products' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Product Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sync and manage your products with Jumia marketplace
              </Typography>
              <JumiaIntegration integration={integration} onRefresh={handleRefresh} />
            </Box>
          )}

          {currentTab === 'orders' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Order Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                View and process orders from Jumia
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:refresh-fill" />}
                  onClick={() => toast.info('Order sync feature coming soon!')}
                >
                  Sync Orders
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No orders found. Orders will appear here once they are synced from Jumia.
                </Typography>
              </Stack>
            </Box>
          )}

          {currentTab === 'inventory' && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Inventory Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage inventory levels and stock synchronization
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:sync-fill" />}
                  onClick={() => toast.info('Inventory sync feature coming soon!')}
                >
                  Sync Inventory
                </Button>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  No inventory data found. Inventory will be displayed here once synced.
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      </Card>
    </Stack>
  );
}

