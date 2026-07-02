import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

export function ReceiptCopyChoiceDialog({
  open,
  onClose,
  receipt,
  adjustment,
  onChoose,
}) {
  const actualTotal = Number(
    adjustment?.actual_total ?? receipt?.total_amount ?? 0
  );
  const displayTotal = Number(adjustment?.display_total ?? 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Choose receipt copy</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This sale has a saved display adjustment. Which copy should be used?
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="body2">
              Actual sale: <strong>{fCurrency(actualTotal)}</strong>
            </Typography>
            <Typography variant="body2">
              Adjusted copy: <strong>{fCurrency(displayTotal)}</strong>
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
        <Button
          variant="contained"
          onClick={() => onChoose?.('adjusted')}
        >
          Use adjusted copy ({fCurrency(displayTotal)})
        </Button>
        <Button
          variant="outlined"
          onClick={() => onChoose?.('original')}
        >
          Use original ({fCurrency(actualTotal)})
        </Button>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
