import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

export function HeroSection({ content, theme }) {
  const { slug } = useParams();
  const {
    title,
    subtitle,
    ctaLabel,
    ctaUrl,
    backgroundImage,
    layoutVariant = 'image-right',
  } = content || {};

  const hasImage = Boolean(backgroundImage);
  
  // Default to product list page if no URL specified
  const defaultCtaUrl = slug ? paths.publicStoreProducts(slug) : '#products';
  const finalCtaUrl = ctaUrl || defaultCtaUrl;

  return (
    <Box
      component="header"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: theme?.primaryBgColor || 'background.paper',
        color: theme?.primaryTextColor || 'text.primary',
        backgroundImage: hasImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: layoutVariant === 'image-right' ? 'row' : 'column' }}
          spacing={4}
          alignItems="flex-start"
        >
          <Box sx={{ maxWidth: 600 }}>
            <Typography component="h1" variant="h3" sx={{ mb: 2, fontWeight: 700 }}>
              {title || 'Welcome to our store'}
            </Typography>
            {subtitle && (
              <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                {subtitle}
              </Typography>
            )}
            {ctaLabel && (
              <Button
                component={finalCtaUrl.startsWith('#') ? 'a' : RouterLink}
                href={finalCtaUrl.startsWith('#') ? finalCtaUrl : undefined}
                to={!finalCtaUrl.startsWith('#') ? finalCtaUrl : undefined}
                size="large"
                variant="contained"
                sx={{ borderRadius: 999 }}
              >
                {ctaLabel}
              </Button>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}

