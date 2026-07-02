import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { toast } from 'src/components/snackbar';
import { itemOnHand } from 'src/utils/consignment-permissions';

export function buildPartnerSaleLines(consignment) {
  return (consignment?.items || [])
    .map((item) => ({
      item_id: item.id,
      product_name: item.product_name,
      available: itemOnHand(item),
      qty_sold: '',
      sell_price: item.sell_price != null ? String(item.sell_price) : '',
    }))
    .filter((line) => line.available > 0);
}

export function PartnerSaleDialog({
  open,
  onClose,
  consignment,
  consignmentLoading,
  submitting,
  onSubmit,
}) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (open && consignment) {
      setLines(buildPartnerSaleLines(consignment));
    }
    if (!open) {
      setLines([]);
    }
  }, [open, consignment]);

  const handleFillAll = () => {
    setLines((prev) => prev.map((line) => ({ ...line, qty_sold: String(line.available) })));
  };

  const handleSubmit = async () => {
    if (!consignment) return;

    const payload = lines
      .map((line) => ({
        item_id: line.item_id,
        qty_sold: Number(line.qty_sold),
        sell_price: line.sell_price !== '' ? Number(line.sell_price) : undefined,
      }))
      .filter((line) => line.qty_sold > 0);

    if (!payload.length) {
      toast.error('Enter a sold quantity for at least one item.');
      return;
    }

    const stockErrors = payload
      .map((line) => {
        const source = lines.find((row) => row.item_id === line.item_id);
        if (line.qty_sold > Number(source?.available || 0)) {
          return `${source?.product_name}: sold ${line.qty_sold}, only ${source?.available} with partner`;
        }
        return null;
      })
      .filter(Boolean);

    if (stockErrors.length) {
      toast.error(stockErrors[0]);
      return;
    }

    await onSubmit(consignment.id, payload);
  };

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Record partner sale</DialogTitle>
      <DialogContent>
        {consignmentLoading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Record how many units your partner sold. Unsold stock can still be returned later.
              </Typography>
              {lines.length > 0 && (
                <Button size="small" variant="outlined" onClick={handleFillAll} disabled={submitting}>
                  Sell all with partner
                </Button>
              )}
            </Stack>
            {!lines.length && (
              <Typography variant="body2" color="text.secondary">
                No items with partner are available to record as sold.
              </Typography>
            )}
            {lines.map((line, idx) => {
              const soldQty = Number(line.qty_sold || 0);
              const hasQtyError = soldQty > 0 && soldQty > Number(line.available || 0);

              return (
                <Stack
                  key={line.item_id}
                  spacing={1}
                  sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Typography variant="subtitle2">{line.product_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    With partner: {line.available}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      label="Qty sold"
                      type="number"
                      value={line.qty_sold}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...next[idx], qty_sold: e.target.value };
                        setLines(next);
                      }}
                      inputProps={{ min: 0, max: line.available }}
                      error={hasQtyError}
                      helperText={hasQtyError ? `Only ${line.available} available` : undefined}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Sell price"
                      type="number"
                      value={line.sell_price}
                      onChange={(e) => {
                        const next = [...lines];
                        next[idx] = { ...next[idx], sell_price: e.target.value };
                        setLines(next);
                      }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleSubmit}
          disabled={submitting || consignmentLoading || !lines.length}
        >
          Record sale
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PartnerSaleDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  consignment: PropTypes.object,
  consignmentLoading: PropTypes.bool,
  submitting: PropTypes.bool,
  onSubmit: PropTypes.func,
};
