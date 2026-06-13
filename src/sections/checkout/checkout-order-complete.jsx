import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { OrderCompleteIllustration } from 'src/assets/illustrations';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CheckoutOrderComplete({ open, onReset, onDownloadPDF, orderResult, storeSlug }) {
  return (
    <Dialog
      fullWidth
      fullScreen
      open={open}
      PaperProps={{
        sx: {
          width: { md: `calc(100% - 48px)` },
          height: { md: `calc(100% - 48px)` },
        },
      }}
    >
      <Box
        gap={4}
        display="flex"
        alignItems="center"
        flexDirection="column"
        sx={{
          py: 5,
          m: 'auto',
          maxWidth: 480,
          textAlign: 'center',
          px: { xs: 2, sm: 0 },
        }}
      >
        <Typography variant="h4">Thank you for your purchase!</Typography>

        <OrderCompleteIllustration />

        <Stack spacing={1} alignItems="center">
          <Typography variant="body1">Thanks for placing your order.</Typography>

          {orderResult?.invoice_number ? (
            <Typography variant="body2" color="text.secondary">
              Order reference:{' '}
              <Typography component="span" variant="subtitle2" color="text.primary">
                {orderResult.invoice_number}
              </Typography>
            </Typography>
          ) : (
            <Link sx={{ typography: 'body2' }}>
              01dc1370-3df6-11eb-b378-0242ac130002
            </Link>
          )}

          {orderResult?.total_amount && (
            <Typography variant="body2" color="text.secondary">
              Total:{' '}
              <Typography component="span" variant="subtitle2" color="text.primary">
                {fCurrency(orderResult.total_amount)}
              </Typography>
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            We will send you a notification within 5 business days when it ships.
            <br />
            If you have any questions, please contact us.
          </Typography>
        </Stack>

        <Divider sx={{ width: 1, borderStyle: 'dashed' }} />

        <Box gap={2} display="flex" flexWrap="wrap" justifyContent="center">
          {storeSlug ? (
            <Button
              size="large"
              color="inherit"
              variant="outlined"
              component={RouterLink}
              href={paths.publicStore(storeSlug)}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              Back to store
            </Button>
          ) : (
            <Button
              size="large"
              color="inherit"
              variant="outlined"
              onClick={onReset}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              Continue shopping
            </Button>
          )}

          <Button
            size="large"
            variant="contained"
            startIcon={<Iconify icon="eva:cloud-download-fill" />}
            onClick={onDownloadPDF}
          >
            Download as PDF
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
