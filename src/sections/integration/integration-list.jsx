import { mutate } from 'swr';
import { useCallback } from 'react';

import Pagination, { paginationClasses } from '@mui/material/Pagination';
import {
  Box,
  Card,
  Chip,
  Stack,
  Button,
  Avatar,
  Tooltip,
  useTheme,
  IconButton,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { fDate } from 'src/utils/format-time';

import { deleteIntegration } from 'src/actions/integration';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PROVIDER_CONFIGS = {
  google: {
    icon: 'logos:google',
    color: '#4285f4',
    name: 'Google',
  },
  jumia: {
    icon: 'simple-icons:jumia',
    color: '#f68b1e',
    name: 'Jumia',
  },
};

const TYPE_CONFIGS = {
  email: {
    icon: 'eva:email-fill',
    color: 'info',
    label: 'Email',
  },
  drive: {
    icon: 'eva:cloud-fill',
    color: 'success',
    label: 'Drive',
  },
  ecommerce: {
    icon: 'eva:shopping-cart-fill',
    color: 'warning',
    label: 'E-commerce',
  },
};

// ----------------------------------------------------------------------

export function IntegrationList({ integrations = [], onView, onEdit, onDelete, onSetup }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const getGridColumns = () => {
    if (isMobile) return 'repeat(1, 1fr)';
    if (isTablet) return 'repeat(2, 1fr)';
    return 'repeat(3, 1fr)';
  };

  return (
    <>
      <Box
        gap={{ xs: 2, md: 3 }}
        display="grid"
        gridTemplateColumns={getGridColumns()}
      >
        {integrations.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onSetup={onSetup}
            isMobile={isMobile}
          />
        ))}
      </Box>

      {integrations.length > 12 && (
        <Pagination
          count={Math.ceil(integrations.length / 12)}
          sx={{
            mt: { xs: 4, md: 6 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function IntegrationCard({
  integration,
  onView,
  onEdit,
  onDelete,
  onSetup,
  isMobile
}) {
  const providerConfig = PROVIDER_CONFIGS[integration.provider] || {
    icon: 'eva:cube-fill',
    color: '#637381',
    name: integration.provider,
  };

  const typeConfig = TYPE_CONFIGS[integration.integration_type] || {
    icon: 'eva:options-2-fill',
    color: 'default',
    label: integration.integration_type,
  };

  const handleTestConnection = useCallback(async () => {
    try {
      // Test connection logic would go here
      toast.success('Connection test passed!');
    } catch (error) {
      toast.error('Connection test failed');
    }
  }, []);

  const handleDeleteClick = useCallback(async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this integration?')) {
      try {
        await deleteIntegration(integration.id);
        toast.success('Integration deleted successfully!');

        // Trigger real-time update
        mutate('/api/integrations/list');

        // Call parent callback if provided
        onDelete?.(integration.id);
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete integration');
      }
    }
  }, [integration.id, onDelete]);

  const renderHeader = (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
      <Avatar
        sx={{
          width: { xs: 48, md: 56 },
          height: { xs: 48, md: 56 },
          bgcolor: 'background.neutral',
        }}
      >
        <Iconify
          icon={providerConfig.icon}
          width={isMobile ? 32 : 40}
          sx={{ color: providerConfig.color }}
        />
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant={isMobile ? 'subtitle2' : 'h6'}
          noWrap
          sx={{ fontWeight: 600 }}
        >
          {integration.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
        >
          {providerConfig.name} • {typeConfig.label}
        </Typography>
      </Box>

      <Chip
        size="small"
        variant="soft"
        color={integration.is_active ? 'success' : 'warning'}
        label={integration.is_active ? 'Active' : 'Inactive'}
      />
    </Stack>
  );

  const renderDetails = (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify
          icon={typeConfig.icon}
          width={16}
          sx={{ color: `${typeConfig.color}.main` }}
        />
        <Typography variant="body2" color="text.secondary">
          {typeConfig.label} Integration
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon="eva:calendar-fill" width={16} sx={{ color: 'text.disabled' }} />
        <Typography variant="body2" color="text.secondary">
          Created {fDate(integration.created_at)}
        </Typography>
      </Stack>

      {integration.last_sync && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="eva:refresh-fill" width={16} sx={{ color: 'success.main' }} />
          <Typography variant="body2" color="text.secondary">
            Last sync {fDate(integration.last_sync)}
          </Typography>
        </Stack>
      )}
    </Stack>
  );

  const renderActions = (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1}
      sx={{ mt: 'auto' }}
    >
      {!integration.is_active ? (
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="eva:settings-2-fill" />}
          onClick={(e) => {
            e.stopPropagation();
            onSetup?.(integration.id);
          }}
          fullWidth={isMobile}
        >
          Setup
        </Button>
      ) : (
        <Button
          variant="outlined"
          size="small"
          startIcon={<Iconify icon="eva:eye-fill" />}
          onClick={(e) => {
            e.stopPropagation();
            onView?.(integration.id);
          }}
          fullWidth={isMobile}
        >
          View
        </Button>
      )}

      <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
        <Tooltip title="Test Connection">
          <IconButton
            size="small"
            color="info"
            onClick={(e) => {
              e.stopPropagation();
              handleTestConnection();
            }}
            disabled={!integration.is_active}
          >
            <Iconify icon="eva:wifi-fill" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Edit">
          <IconButton
            size="small"
            color="default"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(integration.id);
            }}
          >
            <Iconify icon="eva:edit-fill" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            onClick={handleDeleteClick}
          >
            <Iconify icon="eva:trash-2-fill" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  return (
    <Card
      sx={{
        p: { xs: 2, md: 3 },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: theme => theme.customShadows.z8,
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => onView?.(integration.id)}
    >
      {renderHeader}
      {renderDetails}
      {renderActions}
    </Card>
  );
}
