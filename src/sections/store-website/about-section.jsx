import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

export function AboutSection({ content, theme: themeConfig }) {
  const muiTheme = useTheme();
  const { title, body } = content || {};

  if (!title && !body) return null;

  const accentColor = themeConfig?.accentColor || muiTheme.palette.primary.main;

  return (
    <Box
      component="section"
      id="about"
      sx={{
        py: { xs: 8, md: 12 },
        bgcolor: alpha(accentColor, 0.04),
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            borderLeft: `4px solid ${accentColor}`,
            pl: 3,
          }}
        >
          <Typography
            component="h2"
            variant="h3"
            sx={{ mb: 3, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {title || 'About us'}
          </Typography>
          {body && (
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', lineHeight: 1.9, whiteSpace: 'pre-line', fontSize: '1.05rem' }}
            >
              {body}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
}
