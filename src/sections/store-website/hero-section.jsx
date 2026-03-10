import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

export function HeroSection({ content, theme: themeConfig }) {
  const { slug } = useParams();
  const muiTheme = useTheme();

  const {
    title,
    subtitle,
    ctaLabel,
    ctaUrl,
    backgroundImage,
  } = content || {};

  const accentColor = themeConfig?.accentColor || muiTheme.palette.primary.main;
  const hasImage = Boolean(backgroundImage);
  const finalCtaUrl = ctaUrl || (slug ? paths.publicStoreProducts(slug) : '#products');

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 10, md: 16 },
        minHeight: { xs: 340, md: 480 },
        display: 'flex',
        alignItems: 'center',
        backgroundImage: hasImage
          ? `url(${backgroundImage})`
          : `linear-gradient(135deg, ${alpha(accentColor, 0.12)} 0%, ${alpha(muiTheme.palette.background.default, 1)} 60%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for images */}
      {hasImage && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.45)',
          }}
        />
      )}

      {/* Decorative circle */}
      <Box
        sx={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 400,
          height: 400,
          borderRadius: '50%',
          bgcolor: alpha(accentColor, 0.08),
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={3} sx={{ maxWidth: 620 }}>
          <Typography
            component="h1"
            variant="h2"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              color: hasImage ? 'common.white' : 'text.primary',
            }}
          >
            {title || 'Welcome to our store'}
          </Typography>

          {subtitle && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                color: hasImage ? alpha('#fff', 0.85) : 'text.secondary',
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
          )}

          {ctaLabel && (
            <Box>
              <Button
                component={finalCtaUrl.startsWith('#') ? 'a' : RouterLink}
                href={finalCtaUrl}
                size="large"
                variant="contained"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: accentColor,
                  '&:hover': {
                    bgcolor: accentColor,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${alpha(accentColor, 0.4)}`,
                  },
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                {ctaLabel}
              </Button>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
