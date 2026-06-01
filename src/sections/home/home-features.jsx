import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const FEATURES = [
  {
    icon: 'solar:bolt-bold-duotone',
    color: 'warning',
    title: 'Quick Sale Dashboard',
    description:
      'Process a complete sale in under 30 seconds. Search products, add to cart, collect payment and record — all from one screen.',
  },
  {
    icon: 'solar:box-bold-duotone',
    color: 'info',
    title: 'Inventory Management',
    description:
      'Real-time stock tracking across all your products. Get low-stock alerts and maintain accurate inventory at all times.',
  },
  {
    icon: 'solar:document-text-bold-duotone',
    color: 'primary',
    title: 'Smart Invoicing',
    description:
      'Create professional invoices in seconds. Track paid, credit and overdue invoices. Send receipts directly to customers.',
  },
  {
    icon: 'solar:hand-stars-bold-duotone',
    color: 'success',
    title: 'Service Management',
    description:
      'Manage all your services alongside products. Book appointments, bill clients and track service history.',
  },
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'error',
    title: 'Credit Tracking',
    description:
      'Know exactly who owes you and how much. Record credit sales, track repayments and manage customer balances effortlessly.',
  },
  {
    icon: 'solar:chart-square-bold-duotone',
    color: 'secondary',
    title: 'Business Analytics',
    description:
      'Real-time sales reports, top-selling products, peak hours and revenue trends — all in one intuitive dashboard.',
  },
  {
    icon: 'solar:people-nearby-bold-duotone',
    color: 'warning',
    title: 'Customer Management',
    description:
      'Build a rich customer database. Track purchase history, outstanding balances and customer preferences.',
  },
  {
    icon: 'solar:smartphone-2-bold-duotone',
    color: 'info',
    title: 'Works on Any Device',
    description:
      'Use Ojaame on desktop, tablet or mobile. Our responsive design ensures smooth operation everywhere.',
  },
  {
    icon: 'solar:shield-check-bold-duotone',
    color: 'success',
    title: 'Secure & Reliable',
    description:
      '99.9% uptime with bank-grade security. Your data is encrypted and backed up automatically every day.',
  },
];

// ----------------------------------------------------------------------

export function HomeFeatures() {
  const theme = useTheme();

  return (
    <Box
      id="features"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
        scrollMarginTop: 64,
      }}
    >
      <Container maxWidth="lg">
        {/* Section header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{
              color: 'primary.main',
              fontWeight: 700,
              letterSpacing: 2,
              display: 'block',
              mb: 1.5,
            }}
          >
            Everything You Need
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}
          >
            Built for Real Businesses
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 560, mx: 'auto', lineHeight: 1.8 }}
          >
            From a single shop to a chain of stores — Ojaame gives you every tool to run your
            business smarter and faster.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {FEATURES.map((feature) => (
            <Grid key={feature.title} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3.5,
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2.5,
                  transition: 'all 0.25s',
                  '&:hover': {
                    borderColor: `${feature.color}.main`,
                    boxShadow: `0 8px 32px ${alpha(theme.palette[feature.color].main, 0.18)}`,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette[feature.color].main, 0.12),
                    mb: 2.5,
                  }}
                >
                  <Iconify
                    icon={feature.icon}
                    width={26}
                    sx={{ color: `${feature.color}.main` }}
                  />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.75}>
                  {feature.description}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
