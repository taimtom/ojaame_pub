import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CONTACT_ITEMS = [
  {
    icon: 'solar:letter-bold-duotone',
    label: 'Email',
    value: 'hello@ojaame.com',
    href: 'mailto:hello@ojaame.com',
  },
  {
    icon: 'solar:phone-bold-duotone',
    label: 'Phone / WhatsApp',
    value: '+234 800 000 0000',
    href: 'tel:+2348000000000',
  },
  {
    icon: 'solar:map-point-bold-duotone',
    label: 'Office',
    value: 'Lagos, Nigeria',
    href: null,
  },
];

// ----------------------------------------------------------------------

export function HomeCta() {
  const theme = useTheme();

  return (
    <>
      {/* Final CTA banner */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, #0f172a 50%, ${alpha(
            theme.palette.primary.dark,
            0.95
          )} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.15)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              color: 'common.white',
              fontWeight: 800,
              mb: 2.5,
              fontSize: { xs: '1.8rem', md: '2.8rem' },
            }}
          >
            Ready to Transform Your Business?
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: alpha('#fff', 0.65), fontWeight: 400, mb: 5, lineHeight: 1.7 }}
          >
            Join 500+ businesses already using Ojaame. Start free — no credit card required.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={RouterLink}
              href={paths.auth.jwt.signUp}
              size="large"
              variant="contained"
              color="primary"
              endIcon={<Iconify icon="eva:arrow-forward-fill" />}
              sx={{
                px: 5,
                py: 1.75,
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.5)}`,
              }}
            >
              Get Started Free
            </Button>
            <Button
              component={RouterLink}
              href={paths.auth.jwt.signIn}
              size="large"
              variant="outlined"
              sx={{
                px: 5,
                py: 1.75,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2,
                borderColor: alpha('#fff', 0.3),
                color: 'common.white',
                '&:hover': { borderColor: 'common.white', bgcolor: alpha('#fff', 0.07) },
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Contact section */}
      <Box
        id="contact"
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
              Get In Touch
            </Typography>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
              We&apos;d Love to Hear from You
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480, mx: 'auto' }}>
              Have questions? Need a demo? Our team responds within 24 hours.
            </Typography>
          </Box>

          <Grid container spacing={6} alignItems="flex-start">
            {/* Contact info */}
            <Grid xs={12} md={4}>
              <Stack spacing={3}>
                {CONTACT_ITEMS.map((item) => (
                  <Stack key={item.label} direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon={item.icon} width={22} sx={{ color: 'primary.main' }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {item.label}
                      </Typography>
                      {item.href ? (
                        <Typography
                          component="a"
                          href={item.href}
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
                        >
                          {item.value}
                        </Typography>
                      ) : (
                        <Typography variant="body2" fontWeight={600}>
                          {item.value}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}

                <Divider />

                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Follow Us
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {[
                      { icon: 'eva:twitter-fill', href: '#', label: 'Twitter' },
                      { icon: 'eva:facebook-fill', href: '#', label: 'Facebook' },
                      { icon: 'skill-icons:instagram', href: '#', label: 'Instagram' },
                      { icon: 'mingcute:linkedin-fill', href: '#', label: 'LinkedIn' },
                    ].map((social) => (
                      <Box
                        key={social.label}
                        component="a"
                        href={social.href}
                        aria-label={social.label}
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 1.5,
                          border: `1px solid ${theme.palette.divider}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'text.secondary',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            borderColor: 'primary.main',
                            color: 'common.white',
                          },
                        }}
                      >
                        <Iconify icon={social.icon} width={18} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            {/* Contact form */}
            <Grid xs={12} md={8}>
              <Stack
                spacing={2.5}
                component="form"
                onSubmit={(e) => e.preventDefault()}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.background.neutral, 0.6),
                }}
              >
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <TextField fullWidth label="Your Name" size="small" />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField fullWidth label="Email Address" size="small" type="email" />
                  </Grid>
                  <Grid xs={12}>
                    <TextField fullWidth label="Phone Number" size="small" />
                  </Grid>
                  <Grid xs={12}>
                    <TextField fullWidth label="Subject" size="small" />
                  </Grid>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      multiline
                      rows={4}
                      size="small"
                      placeholder="Tell us about your business and how we can help…"
                    />
                  </Grid>
                </Grid>
                <Button
                  type="submit"
                  size="large"
                  variant="contained"
                  color="primary"
                  endIcon={<Iconify icon="eva:paper-plane-fill" />}
                  sx={{ alignSelf: 'flex-start', px: 4, borderRadius: 2, fontWeight: 700 }}
                >
                  Send Message
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
}
