import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Rating from '@mui/material/Rating';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const TESTIMONIALS = [
  {
    name: 'Tunde Adeyemi',
    role: 'Owner, Adeyemi Electronics',
    location: 'Lagos, Nigeria',
    avatar: 'T',
    avatarColor: '#2196f3',
    rating: 5,
    review:
      "Ojaame transformed how I run my shop. I used to spend hours doing accounts at night — now it takes me 10 minutes. The quick sale feature is incredible. My staff loves it too.",
  },
  {
    name: 'Amaka Okafor',
    role: 'Manager, Glow Beauty Salon',
    location: 'Abuja, Nigeria',
    avatar: 'A',
    avatarColor: '#e91e63',
    rating: 5,
    review:
      "Managing our services and tracking credit customers was a nightmare before Ojaame. Now I know exactly who owes us, how much, and we've cut bad debts by 60% in 3 months.",
  },
  {
    name: 'Chidi Nwosu',
    role: 'Owner, Nwosu Supermarket',
    location: 'Enugu, Nigeria',
    avatar: 'C',
    avatarColor: '#4caf50',
    rating: 5,
    review:
      "I have 2 stores and managing inventory across both was chaos. Ojaame gives me a clear view of stock levels, top sellers and daily revenue for each store. Highly recommend.",
  },
  {
    name: 'Fatima Yusuf',
    role: 'Co-founder, Yusuf Pharmacy',
    location: 'Kano, Nigeria',
    avatar: 'F',
    avatarColor: '#ff9800',
    rating: 5,
    review:
      "The invoice management and the ability to track overdue payments is exactly what a pharmacy needs. Ojaame is intuitive — even our older staff members picked it up in a day.",
  },
  {
    name: 'Segun Balogun',
    role: 'CEO, Balogun Distributors',
    location: 'Ibadan, Nigeria',
    avatar: 'S',
    avatarColor: '#9c27b0',
    rating: 5,
    review:
      "We process over 200 transactions a day and Ojaame handles it all without breaking a sweat. The analytics dashboard helps us make better buying decisions every week.",
  },
  {
    name: 'Ngozi Eze',
    role: 'Owner, Ngozi Fashion House',
    location: 'Port Harcourt, Nigeria',
    avatar: 'N',
    avatarColor: '#00bcd4',
    rating: 5,
    review:
      "From inventory to customer management and sales reports — Ojaame covers everything. The mobile-friendly design means I can check my business from anywhere.",
  },
];

// ----------------------------------------------------------------------

export function HomeTestimonials() {
  const theme = useTheme();

  return (
    <Box
      id="testimonials"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: alpha(theme.palette.primary.main, 0.03),
        borderTop: `1px solid ${theme.palette.divider}`,
        scrollMarginTop: 64,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2, display: 'block', mb: 1.5 }}
          >
            Customer Stories
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Loved by Business Owners
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Join hundreds of businesses across Nigeria and Africa who trust Ojaame to run their operations.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {TESTIMONIALS.map((t) => (
            <Grid key={t.name} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  p: 3.5,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: `1px solid ${theme.vars.palette.divider}`,
                  borderRadius: 2.5,
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                {/* Quote icon */}
                <Iconify
                  icon="solar:quote-up-bold-duotone"
                  width={32}
                  sx={{ color: 'primary.light', opacity: 0.5, mb: 2 }}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  lineHeight={1.8}
                  sx={{ flex: 1, mb: 3, fontStyle: 'italic' }}
                >
                  &ldquo;{t.review}&rdquo;
                </Typography>

                <Box>
                  <Rating value={t.rating} readOnly size="small" sx={{ mb: 2 }} />
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ bgcolor: t.avatarColor, width: 42, height: 42, fontWeight: 700 }}>
                      {t.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {t.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.role}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                        {t.location}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
