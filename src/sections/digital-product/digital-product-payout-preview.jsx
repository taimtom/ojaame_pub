import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { computePayoutPreview } from 'src/actions/digital-product';
import { useCurrencyFormat } from 'src/hooks/use-currency-format';

export function DigitalProductPayoutPreview({ price }) {
  const { fCurrency } = useCurrencyFormat();
  const payout = computePayoutPreview(price);

  if (payout.gross_amount <= 0) {
    return (
      <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
        <Typography variant="subtitle2">Free product</Typography>
        <Typography variant="body2" color="text.secondary">
          No platform fee applies.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.neutral' }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Payout preview
      </Typography>
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Customer pays
          </Typography>
          <Typography variant="body2">{fCurrency(payout.gross_amount)}</Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            Platform fee ({payout.platform_fee_percent}%)
          </Typography>
          <Typography variant="body2" color="error.main">
            −{fCurrency(payout.platform_fee_amount)}
          </Typography>
        </Stack>
        <Box sx={{ borderTop: '1px dashed', borderColor: 'divider', pt: 1 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle2">You&apos;ll receive</Typography>
            <Typography variant="subtitle1" color="success.main">
              {fCurrency(payout.merchant_payout_amount)}
            </Typography>
          </Stack>
        </Box>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Payment processing is handled by Ojaame; your payout is 90% of the list price.
      </Typography>
    </Box>
  );
}
