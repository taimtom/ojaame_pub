import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { usePlanFeatures } from 'src/hooks/use-plan-features';

// ----------------------------------------------------------------------

export function PlanFeatureGuard({ feature, title, children }) {
  const { hasPlanFeature, statusLoading } = usePlanFeatures();

  if (statusLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (hasPlanFeature(feature)) {
    return children;
  }

  return (
    <Card sx={{ p: 4, maxWidth: 520, mx: 'auto', mt: 4, textAlign: 'center' }}>
      <Stack spacing={2} alignItems="center">
        <Iconify icon="solar:lock-keyhole-bold-duotone" width={48} sx={{ color: 'warning.main' }} />
        <Typography variant="h6">{title || 'Available on Standard'}</Typography>
        <Typography variant="body2" color="text.secondary">
          Upgrade to the Standard plan to unlock this feature for your business.
        </Typography>
        <Button
          component={RouterLink}
          href={`${paths.dashboard.user.account}?tab=billing`}
          variant="contained"
        >
          View plans
        </Button>
      </Stack>
    </Card>
  );
}

PlanFeatureGuard.propTypes = {
  feature: PropTypes.string.isRequired,
  title: PropTypes.string,
  children: PropTypes.node,
};
