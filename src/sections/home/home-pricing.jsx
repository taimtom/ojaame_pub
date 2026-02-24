import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PLANS = [
  {
    title: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for small shops just getting started.',
    color: 'default',
    popular: false,
    features: [
      '1 store',
      'Up to 50 products',
      'Quick Sale dashboard',
      'Basic invoicing',
      'Sales reports',
      'Email support',
    ],
    disabled: [],
  },
  {
    title: 'Growth',
    price: '₦9,900',
    period: 'per month',
    description: 'For growing businesses that need more power.',
    color: 'primary',
    popular: true,
    features: [
      'Up to 3 stores',
      'Unlimited products & services',
      'Credit tracking',
      'Advanced analytics',
      'Customer management',
      'Priority support',
      'Invoice customisation',
    ],
    disabled: [],
  },
  {
    title: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For chains and businesses with complex needs.',
    color: 'default',
    popular: false,
    features: [
      'Unlimited stores',
      'Unlimited everything',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-site training',
      'API access',
    ],
    disabled: [],
  },
];

// ----------------------------------------------------------------------

export function HomePricing() {
  const theme = useTheme();

  return (
    <Box
      id="pricing"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
        scrollMarginTop: 64,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, display: 'block', mb: 1.5 }}
          >
            Pricing
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Simple, Transparent Pricing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
            No hidden fees. No surprises. Start free and upgrade when your business grows.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ md: 'stretch' }}
        >
          {PLANS.map((plan) => {
            const isPopular = plan.popular;
            return (
              <Box key={plan.title} sx={{ flex: 1, position: 'relative' }}>
                {isPopular && (
                  <Box sx={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', zIndex: 1 }}>
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 700, fontSize: 11, px: 1 }}
                    />
                  </Box>
                )}
                <Card
                  sx={{
                    p: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: isPopular
                      ? `2px solid ${theme.palette.primary.main}`
                      : `1px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    boxShadow: isPopular ? `0 16px 48px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    {plan.title}
                  </Typography>

                  <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ mt: 1.5, mb: 1 }}>
                    <Typography variant="h3" fontWeight={800} lineHeight={1}>
                      {plan.price}
                    </Typography>
                    {plan.period !== 'forever' && plan.price !== 'Custom' && (
                      <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                        /{plan.period}
                      </Typography>
                    )}
                    {(plan.period === 'forever' || plan.price === 'Custom') && (
                      <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                        {plan.period}
                      </Typography>
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Divider sx={{ mb: 3 }} />

                  <Stack spacing={1.5} sx={{ mb: 4, flex: 1 }}>
                    {plan.features.map((feature) => (
                      <Stack key={feature} direction="row" alignItems="center" spacing={1}>
                        <Iconify
                          icon="solar:check-circle-bold"
                          width={18}
                          sx={{ color: isPopular ? 'primary.main' : 'success.main', flexShrink: 0 }}
                        />
                        <Typography variant="body2">{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    component={RouterLink}
                    href={plan.price === 'Custom' ? '/#contact' : paths.auth.jwt.signUp}
                    fullWidth
                    size="large"
                    variant={isPopular ? 'contained' : 'outlined'}
                    color="primary"
                    sx={{ borderRadius: 2, fontWeight: 700, py: 1.5 }}
                  >
                    {plan.price === 'Custom' ? 'Contact Sales' : plan.price === 'Free' ? 'Get Started Free' : 'Start 14-Day Trial'}
                  </Button>
                </Card>
              </Box>
            );
          })}
        </Stack>
      </Container>
    </Box>
  );
}
