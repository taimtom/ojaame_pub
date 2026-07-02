import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PLAN_TIERS = [
  {
    tier: 'basic',
    title: 'Basic',
    basePrice: '₦3,000',
    seatPrice: '₦1,000',
    description: 'For small shops getting started with Ojaame.',
    features: [
      'Full POS, inventory & customer management',
      'Essential reports & receipt printing',
      'Up to 3 team members per store (₦1,000/seat for seats 2–3)',
      'Roles & per-user permissions',
      'First store included free',
      '₦3,000/month per additional store',
    ],
    highlighted: false,
  },
  {
    tier: 'standard',
    title: 'Standard',
    basePrice: '₦10,000',
    seatPrice: '₦2,000',
    description: 'For growing businesses that need more capacity.',
    features: [
      'Everything in Basic',
      'Unlimited team size',
      'Custom roles',
      'Advanced & company reports',
      'Integrations, store website & digital products',
      'Finance settings, service log & usage dashboard',
    ],
    highlighted: true,
  },
  {
    tier: 'enterprise',
    title: 'Enterprise',
    basePrice: 'Custom',
    seatPrice: 'Custom',
    description: 'Tailored pricing for larger operations.',
    features: [
      'Custom base subscription',
      'Custom per-seat pricing',
      'First store included free',
      '₦3,000/month per additional store',
      'Managed by Ojaame team',
    ],
    highlighted: false,
  },
];

const EXAMPLES = [
  {
    name: 'Example A — Basic',
    details: '1 store, 1 seat',
    basic: '₦3,000/month',
    standard: '₦10,000/month',
    formula: 'Base only — no extra stores or seats',
  },
  {
    name: 'Example B — Basic',
    details: '2 stores, 2 seats in first store, 1 seat in second',
    basic: '₦7,000/month',
    standard: '₦15,000/month',
    formula: 'Base + 1 extra store (₦3,000) + 1 extra seat',
  },
  {
    name: 'Example C — Basic',
    details: '1 store, 4 seats',
    basic: '₦6,000/month',
    standard: '₦16,000/month',
    formula: 'Base + 3 extra seats',
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
            Choose Your Plan
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
            Pick Basic or Standard and pay for extra staff and stores as you grow. Enterprise plans
            are set up by our team. First recurring charge starts about 1 month after signup.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ md: 'stretch' }}
        >
          {PLAN_TIERS.map((plan) => (
            <Box key={plan.tier} sx={{ flex: 1 }}>
              <Card
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: plan.highlighted
                    ? `2px solid ${theme.palette.primary.main}`
                    : `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  position: 'relative',
                }}
              >
                {plan.highlighted && (
                  <Chip
                    label="Popular"
                    size="small"
                    color="primary"
                    sx={{ position: 'absolute', top: 16, right: 16 }}
                  />
                )}

                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                  {plan.title}
                </Typography>

                <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ mt: 1.5, mb: 0.5 }}>
                  <Typography variant="h3" fontWeight={800} lineHeight={1}>
                    {plan.basePrice}
                  </Typography>
                  {plan.tier !== 'enterprise' && (
                    <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                      /month
                    </Typography>
                  )}
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {plan.tier !== 'enterprise'
                    ? `+ ${plan.seatPrice}/seat/month beyond included seat`
                    : 'Contact us for custom rates'}
                </Typography>

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
                        sx={{ color: 'success.main', flexShrink: 0 }}
                      />
                      <Typography variant="body2">{feature}</Typography>
                    </Stack>
                  ))}
                </Stack>

                {plan.tier !== 'enterprise' ? (
                  <Button
                    component={RouterLink}
                    href={paths.auth.jwt.signUp}
                    size="large"
                    variant={plan.highlighted ? 'contained' : 'outlined'}
                    color="primary"
                    fullWidth
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Get Started
                  </Button>
                ) : (
                  <Button
                    component="a"
                    href="mailto:support@ojaame.com"
                    size="large"
                    variant="outlined"
                    color="inherit"
                    fullWidth
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Contact Sales
                  </Button>
                )}
              </Card>
            </Box>
          ))}
        </Stack>

        <Card
          sx={{
            mt: 4,
            p: { xs: 3, md: 4 },
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            How billing works
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Every plan includes one free seat per store. Additional stores cost ₦3,000/month each
            (first store is free). Extra staff seats are billed per store at your plan&apos;s seat rate.
          </Typography>

          <Stack spacing={2.5}>
            {EXAMPLES.map((example) => (
              <Box key={example.name}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {example.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {example.details} — {example.formula}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 0.5 }}>
                  <Typography variant="body2">
                    <strong>Basic:</strong> {example.basic}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Standard:</strong> {example.standard}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      </Container>
    </Box>
  );
}
