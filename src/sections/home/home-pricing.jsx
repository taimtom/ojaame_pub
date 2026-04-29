import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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

const PRICING_COMPONENTS = [
  {
    title: 'Base subscription',
    price: '₦3,000',
    period: 'per month',
    description: 'Core monthly company subscription.',
    features: [
      'Charged once per company',
      'Currency billed in NGN',
    ],
  },
  {
    title: 'Additional store',
    price: '₦3,000',
    period: 'per month',
    description: 'Charged for each store after your first store.',
    features: [
      'First store has no store fee',
      'Each extra store adds ₦3,000/month',
    ],
  },
  {
    title: 'Extra seats',
    price: '₦1,000',
    period: 'per seat/month',
    description: 'Seat charge applies only beyond the included seat.',
    features: [
      'Each store includes 1 seat',
      'Each seat above 1 in any store is billed',
    ],
  },
];

const EXAMPLES = [
  {
    name: 'Example A',
    details: '1 store, 1 seat in that store',
    total: '₦3,000/month',
    formula: 'Base ₦3,000 + Store fees ₦0 + Extra seats ₦0',
  },
  {
    name: 'Example B',
    details: '2 stores, 2 seats in first store, 1 seat in second store',
    total: '₦7,000/month',
    formula: 'Base ₦3,000 + 1 extra store ₦3,000 + 1 extra seat ₦1,000',
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
            Usage-Based Pricing
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
            Your monthly total is calculated from clear billing components. First recurring charge starts about 1
            month after signup.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ md: 'stretch' }}
        >
          {PRICING_COMPONENTS.map((item) => (
            <Box key={item.title} sx={{ flex: 1 }}>
              <Card
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                }}
              >
                <Typography variant="overline" color="text.secondary" fontWeight={700}>
                  {item.title}
                </Typography>

                <Stack direction="row" alignItems="flex-end" spacing={0.5} sx={{ mt: 1.5, mb: 1 }}>
                  <Typography variant="h3" fontWeight={800} lineHeight={1}>
                    {item.price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ pb: 0.5 }}>
                    /{item.period}
                  </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {item.description}
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={1.5} sx={{ mb: 4, flex: 1 }}>
                  {item.features.map((feature) => (
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
              </Card>
            </Box>
          ))}
        </Stack>

        <Card
          sx={{
            mt: 3,
            p: { xs: 3, md: 4 },
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
            Example monthly totals
          </Typography>
          <Stack spacing={2.5}>
            {EXAMPLES.map((example) => (
              <Box key={example.name}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {example.name}: {example.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {example.details}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {example.formula}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Button
            component={RouterLink}
            href={paths.auth.jwt.signUp}
            size="large"
            variant="contained"
            color="primary"
            sx={{ mt: 3, borderRadius: 2, fontWeight: 700, py: 1.5, px: 4 }}
          >
            Get Started
          </Button>
        </Card>
      </Container>
    </Box>
  );
}
