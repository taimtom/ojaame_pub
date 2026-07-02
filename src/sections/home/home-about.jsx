import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const VALUES = [
  {
    icon: 'solar:target-bold-duotone',
    color: 'primary',
    title: 'Our Mission',
    body: 'To give every African business owner — from market stalls to multi-location chains — the technology they need to thrive.',
  },
  {
    icon: 'solar:eye-bold-duotone',
    color: 'success',
    title: 'Our Vision',
    body: "A future where running a business in Africa is as seamless as anywhere else in the world. No paper, no guesswork.",
  },
  {
    icon: 'solar:heart-bold-duotone',
    color: 'error',
    title: 'Built With Care',
    body: 'Every feature in Ojaame was built based on real feedback from real business owners. We listen, we build, we improve.',
  },
];

// ----------------------------------------------------------------------

export function HomeAbout() {
  const theme = useTheme();

  return (
    <Box
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: 'background.default',
        scrollMarginTop: 64,
      }}
    >
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 6, md: 10 }} alignItems="center">
          {/* Left */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, display: 'block', mb: 1.5 }}
            >
              About Ojaame
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              Built for African Businesses, by Africans
            </Typography>
            <Typography variant="body1" color="text.secondary" lineHeight={1.9} sx={{ mb: 3 }}>
              Ojaame was born out of frustration. We watched small and medium business owners across
              Nigeria struggle with spreadsheets, manual records, and expensive imported software that
              didn&apos;t understand how business works here.
            </Typography>
            <Typography variant="body1" color="text.secondary" lineHeight={1.9} sx={{ mb: 4 }}>
              We built Ojaame to change that. A modern, affordable, and genuinely useful POS system
              designed for the realities of African commerce — from cash and credit sales to
              multi-store management and local currency support.
            </Typography>

            <Stack spacing={2}>
              {[
                'Founded in Nigeria, serving Africa-wide',
                'Used by 500+ businesses across 8 states',
                'Processing over ₦2 billion in transactions',
              ].map((item) => (
                <Stack key={item} direction="row" alignItems="center" spacing={1.5}>
                  <Iconify icon="solar:check-circle-bold" width={20} sx={{ color: 'success.main', flexShrink: 0 }} />
                  <Typography variant="body2">{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Right: value cards */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Stack spacing={3}>
              {VALUES.map((v) => (
                <Stack
                  key={v.title}
                  direction="row"
                  spacing={2.5}
                  sx={{
                    p: 3,
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette[v.color].main, 0.04),
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: theme.shadows[4] },
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette[v.color].main, 0.12),
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon={v.icon} width={24} sx={{ color: `${v.color}.main` }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                      {v.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.75}>
                      {v.body}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
