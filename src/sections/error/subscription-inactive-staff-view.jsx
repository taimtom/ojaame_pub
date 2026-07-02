import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { MaintenanceIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

// ----------------------------------------------------------------------

export function SubscriptionInactiveStaffView() {
  return (
    <Container component={MotionContainer} sx={{ py: 10, textAlign: 'center' }}>
      <m.div variants={varBounce().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Subscription inactive
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
          Your company&apos;s subscription is inactive. Please contact your administrator to restore
          full access.
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <MaintenanceIllustration sx={{ my: { xs: 5, sm: 8 } }} />
      </m.div>

      <Button
        component={RouterLink}
        href={paths.dashboard.quickDashboard}
        size="large"
        variant="contained"
      >
        Go to Quick Dashboard
      </Button>
    </Container>
  );
}
