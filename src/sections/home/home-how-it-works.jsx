import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STEPS = [
  {
    number: '01',
    icon: 'solar:shop-bold-duotone',
    title: 'Set Up Your Store',
    description:
      'Create your account and set up your store in under 2 minutes. Add your business name, currency and payment methods.',
  },
  {
    number: '02',
    icon: 'solar:box-bold-duotone',
    title: 'Add Products & Services',
    description:
      'Quickly upload your catalogue. Add prices, stock levels, SKUs and photos. Import existing inventory in bulk.',
  },
  {
    number: '03',
    icon: 'solar:bolt-bold-duotone',
    title: 'Start Selling',
    description:
      'Use Quick Sale to process transactions in seconds, issue invoices and get real-time reports — all instantly.',
  },
];

// ----------------------------------------------------------------------

export function HomeHowItWorks() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: alpha(theme.palette.grey[900], 0.03),
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, display: 'block', mb: 1.5 }}
          >
            Simple Process
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}
          >
            Up & Running in Minutes
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            No technical knowledge required. Ojaame is designed to be simple enough for anyone.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 0 }}
          alignItems={{ md: 'flex-start' }}
        >
          {STEPS.map((step, index) => (
            <Box key={step.number} sx={{ flex: 1, position: 'relative' }}>
              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <Box
                  sx={{
                    display: { xs: 'none', md: 'block' },
                    position: 'absolute',
                    top: 32,
                    left: '60%',
                    right: '-10%',
                    height: 2,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(
                      theme.palette.primary.main,
                      0.2
                    )})`,
                    zIndex: 0,
                  }}
                />
              )}

              <Box sx={{ px: { md: 3 }, textAlign: { xs: 'center', md: 'left' }, position: 'relative', zIndex: 1 }}>
                {/* Icon + Number */}
                <Stack direction="row" alignItems="center" spacing={2} justifyContent={{ xs: 'center', md: 'flex-start' }} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon={step.icon} width={28} sx={{ color: 'common.white' }} />
                  </Box>
                  <Typography
                    variant="h1"
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: alpha(theme.palette.primary.main, 0.15),
                      lineHeight: 1,
                    }}
                  >
                    {step.number}
                  </Typography>
                </Stack>

                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                  {step.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
