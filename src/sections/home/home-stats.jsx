import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

const STATS = [
  { value: '500+', label: 'Businesses Using Ojaame', icon: '🏪' },
  { value: '₦2B+', label: 'Transactions Processed', icon: '💳' },
  { value: '99.9%', label: 'Uptime Guarantee', icon: '⚡' },
  { value: '4.9★', label: 'Average Rating', icon: '⭐' },
];

// ----------------------------------------------------------------------

export function HomeStats() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 5, md: 7 },
        bgcolor: alpha(theme.palette.primary.main, 0.04),
        borderTop: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
          }
          spacing={{ xs: 4, sm: 0 }}
        >
          {STATS.map((stat) => (
            <Box
              key={stat.label}
              sx={{
                flex: 1,
                textAlign: 'center',
                px: { sm: 3 },
              }}
            >
              <Typography sx={{ fontSize: 28, mb: 0.5 }}>{stat.icon}</Typography>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
