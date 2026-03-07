import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function HomeHero() {
  const theme = useTheme();

  return (
    <Box
      id="home"
      sx={{
        minHeight: { xs: '100vh', md: '90vh' },
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, #0f172a 50%, ${alpha(
          theme.palette.primary.dark,
          0.9
        )} 100%)`,
        pt: { xs: 12, md: 8 },
        pb: { xs: 8, md: 0 },
      }}
    >
      {/* Background blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: { xs: 200, md: 420 },
          height: { xs: 200, md: 420 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '5%',
          left: '0%',
          width: { xs: 160, md: 300 },
          height: { xs: 160, md: 300 },
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.success.main, 0.2)} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems="center"
          spacing={{ xs: 6, md: 8 }}
        >
          {/* Left: Text */}
          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            {/* Badge */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ mb: 3 }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 10,
                  border: `1px solid ${alpha(theme.palette.primary.light, 0.4)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'success.light',
                    boxShadow: `0 0 8px ${theme.palette.success.light}`,
                  }}
                />
                <Typography variant="caption" sx={{ color: 'primary.light', fontWeight: 600 }}>
                  Trusted by 500+ Businesses
                </Typography>
              </Box>
            </Stack>

            <Typography
              variant="h1"
              sx={{
                color: 'common.white',
                fontWeight: 800,
                lineHeight: 1.15,
                fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.5rem', lg: '4rem' },
                mb: 2.5,
              }}
            >
              The{' '}
              <Box
                component="span"
                sx={{
                  background: `linear-gradient(90deg, ${theme.palette.primary.light}, ${theme.palette.success.light})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Smartest POS
              </Box>
              <br />
              for Your Business
            </Typography>

            <Typography
              variant="h6"
              sx={{
                color: alpha('#fff', 0.7),
                fontWeight: 400,
                lineHeight: 1.7,
                mb: 4,
                maxWidth: 500,
                mx: { xs: 'auto', md: 0 },
              }}
            >
              Manage sales, inventory, invoices, credit customers and analytics — all from one
              powerful dashboard. Process a sale in under 30 seconds.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              sx={{ mb: 5 }}
            >
              <Button
                component={RouterLink}
                href={paths.auth.jwt.signUp}
                size="large"
                variant="contained"
                color="primary"
                endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                sx={{
                  px: 4,
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
                }}
              >
                Start Free Today
              </Button>
              <Button
                component={RouterLink}
                href={paths.auth.jwt.signIn}
                size="large"
                variant="outlined"
                sx={{
                  px: 4,
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderColor: alpha('#fff', 0.3),
                  color: 'common.white',
                  '&:hover': {
                    borderColor: 'common.white',
                    bgcolor: alpha('#fff', 0.07),
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>

            {/* Trust row */}
            <Stack
              direction="row"
              spacing={3}
              justifyContent={{ xs: 'center', md: 'flex-start' }}
              flexWrap="wrap"
              useFlexGap
            >
              {[
                { icon: 'solar:shield-check-bold', label: 'No credit card needed' },
                { icon: 'solar:clock-circle-bold', label: 'Setup in 2 minutes' },
                { icon: 'solar:star-bold', label: 'Free forever plan' },
              ].map((item) => (
                <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
                  <Iconify icon={item.icon} width={16} sx={{ color: 'success.light' }} />
                  <Typography variant="caption" sx={{ color: alpha('#fff', 0.6) }}>
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Right: Dashboard mockup */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: '100%',
                maxWidth: 520,
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha('#fff', 0.12)}`,
                boxShadow: `0 32px 80px ${alpha('#000', 0.5)}`,
                bgcolor: alpha(theme.palette.grey[900], 0.8),
                backdropFilter: 'blur(12px)',
                p: 3,
              }}
            >
              {/* Mock top bar */}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                  <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
                ))}
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.4) }}>
                  ⚡ Quick Dashboard
                </Typography>
              </Stack>

              {/* Mock stats row */}
              <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                {[
                  { label: "Today's Revenue", value: '₦48,500', color: 'success.main' },
                  { label: 'Transactions', value: '23', color: 'info.main' },
                  { label: 'Top Item', value: 'Phone Case', color: 'warning.main' },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      flex: 1,
                      borderRadius: 1.5,
                      p: 1.5,
                      bgcolor: alpha('#fff', 0.05),
                      border: `1px solid ${alpha('#fff', 0.07)}`,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.45), display: 'block' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: s.color, fontWeight: 700 }}>
                      {s.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              {/* Mock cart */}
              <Box
                sx={{
                  borderRadius: 1.5,
                  p: 2,
                  bgcolor: alpha('#fff', 0.04),
                  border: `1px solid ${alpha('#fff', 0.07)}`,
                  mb: 2,
                }}
              >
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), mb: 1, display: 'block' }}>
                  Cart · 3 items
                </Typography>
                {[
                  { name: 'Coca-Cola 50cl', qty: 2, price: '₦600' },
                  { name: 'Phone Charging', qty: 1, price: '₦200' },
                ].map((item) => (
                  <Stack key={item.name} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                      {item.name} ×{item.qty}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'success.light', fontWeight: 600 }}>
                      {item.price}
                    </Typography>
                  </Stack>
                ))}
              </Box>

              {/* Mock complete button */}
              <Box
                sx={{
                  borderRadius: 1.5,
                  py: 1.5,
                  textAlign: 'center',
                  bgcolor: theme.palette.primary.main,
                  cursor: 'default',
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'common.white', fontWeight: 700 }}>
                  💳 Complete Sale · ₦800
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
