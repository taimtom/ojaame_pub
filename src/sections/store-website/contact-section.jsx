import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export function ContactSection({ content }) {
  const { title, address, phoneNumber, email, mapEmbedUrl } = content || {};

  return (
    <Box component="section" id="contact" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Typography component="h2" variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          {title || 'Contact us'}
        </Typography>
        <Stack spacing={1.5}>
          {address && (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {address}
            </Typography>
          )}
          {phoneNumber && (
            <Typography variant="body1">
              Phone:{' '}
              <Link href={`tel:${phoneNumber}`} underline="hover">
                {phoneNumber}
              </Link>
            </Typography>
          )}
          {email && (
            <Typography variant="body1">
              Email:{' '}
              <Link href={`mailto:${email}`} underline="hover">
                {email}
              </Link>
            </Typography>
          )}
        </Stack>
        {mapEmbedUrl && (
          <Box sx={{ mt: 3 }}>
            <Box
              component="iframe"
              title="Store location map"
              src={mapEmbedUrl}
              sx={{ border: 0, width: '100%', height: 320 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}

