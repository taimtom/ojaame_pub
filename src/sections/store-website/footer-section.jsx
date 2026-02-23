import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function FooterSection({ content }) {
  const { copyrightText, links } = content || {};

  return (
    <Box component="footer" sx={{ py: 3, bgcolor: 'grey.900', color: 'grey.100' }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
        >
          <Typography variant="body2">
            {copyrightText || '© Your Store. All rights reserved.'}
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {(links || []).map((link) => (
              <Link
                key={link.href || link.label}
                href={link.href}
                underline="hover"
                color="inherit"
                variant="body2"
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

