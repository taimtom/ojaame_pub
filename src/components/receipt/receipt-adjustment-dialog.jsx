import { useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import {
  buildDisplaySnapshot,
  suggestDisplayLines,
  updateLinePrice,
  updateLineTotal,
  createCustomDisplayLine,
  SERVICE_CHARGE_DESCRIPTION,
  serializeDisplayItemsForApi,
} from 'src/utils/receipt-display-adjustment';
import { saveReceiptAdjustment } from 'src/hooks/use-receipt-adjustment-setting';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ReceiptAdjustmentDialog({
  open,
  onClose,
  receipt,
  storeId,
  onApplied,
}) {
  const actualTotal = Number(receipt?.total_amount ?? 0);
  const [targetTotal, setTargetTotal] = useState('');
  const [displayLines, setDisplayLines] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const resetState = useCallback(() => {
    setTargetTotal('');
    setDisplayLines([]);
    setNotes('');
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  const applyTargetToLines = useCallback(() => {
    const value = Number(targetTotal);
    if (!Number.isFinite(value) || value <= actualTotal) {
      toast.error(`Enter a display total greater than ${fCurrency(actualTotal)}.`);
      return;
    }
    const suggested = suggestDisplayLines(receipt, value);
    if (suggested) {
      setDisplayLines(suggested);
    }
  }, [actualTotal, receipt, targetTotal]);

  const snapshot = useMemo(
    () => (displayLines.length ? buildDisplaySnapshot(receipt, displayLines) : null),
    [displayLines, receipt]
  );

  const targetValue = Number(targetTotal);
  const hasValidTarget = Number.isFinite(targetValue) && targetValue > actualTotal;

  const handleLinePriceChange = (key, value) => {
    setDisplayLines((lines) =>
      lines.map((line) => (line.key === key ? updateLinePrice(line, value) : line))
    );
  };

  const handleLineTotalChange = (key, value) => {
    setDisplayLines((lines) =>
      lines.map((line) => (line.key === key ? updateLineTotal(line, value) : line))
    );
  };

  const handleLineDescriptionChange = (key, value) => {
    setDisplayLines((lines) =>
      lines.map((line) => (line.key === key ? { ...line, description: value } : line))
    );
  };

  const handleRemoveLine = (key) => {
    setDisplayLines((lines) => lines.filter((line) => line.key !== key));
  };

  const ensureBaseLines = useCallback(() => {
    if (displayLines.length) return displayLines;
    if (!hasValidTarget) return [];
    return suggestDisplayLines(receipt, targetValue) || [];
  }, [displayLines, hasValidTarget, receipt, targetValue]);

  const handleAddServiceLine = () => {
    const baseLines = ensureBaseLines();
    if (!baseLines.length) {
      toast.error('Enter a target total and distribute to lines first.');
      return;
    }
    const currentSnapshot = buildDisplaySnapshot(receipt, baseLines);
    const delta =
      hasValidTarget && currentSnapshot
        ? Math.max(0, Math.round((targetValue - currentSnapshot.display_total) * 100) / 100)
        : 0;
    setDisplayLines([
      ...baseLines,
      {
        ...createCustomDisplayLine(SERVICE_CHARGE_DESCRIPTION),
        price: delta,
        total: delta,
      },
    ]);
  };

  const handleAddCustomLine = () => {
    const baseLines = ensureBaseLines();
    setDisplayLines([...baseLines, createCustomDisplayLine('Additional item')]);
  };

  const handleSkip = () => {
    onApplied?.({ useOriginal: true, receipt });
  };

  const handleApply = async () => {
    if (!snapshot || !storeId || !receipt?.id) {
      toast.error('Set a target total, distribute to lines, and ensure the receipt total is higher than the sale.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveReceiptAdjustment(storeId, receipt.id, {
        display_total: snapshot.display_total,
        notes,
        display_items: serializeDisplayItemsForApi(displayLines),
      });
      onApplied?.({
        useOriginal: false,
        receipt: {
          ...receipt,
          receipt_display_adjustment: saved,
        },
        adjustment: saved,
      });
    } catch (error) {
      const detail = error?.response?.data?.detail;
      toast.error(
        typeof detail === 'string' ? detail : 'Could not save receipt adjustment.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Adjust receipt display total</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Set a target total, review each line, and edit prices so the receipt copy looks
            believable. The sale record and reports stay on the actual amount.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Actual sale total
              </Typography>
              <Typography variant="h6">{fCurrency(actualTotal)}</Typography>
            </Box>

            <TextField
              label="Target display total"
              type="number"
              value={targetTotal}
              onChange={(e) => setTargetTotal(e.target.value)}
              sx={{ minWidth: 200 }}
              inputProps={{ min: actualTotal + 0.01, step: '0.01' }}
            />

            <Button
              variant="outlined"
              onClick={applyTargetToLines}
              disabled={!hasValidTarget}
            >
              Distribute to lines
            </Button>
          </Stack>

          {displayLines.length > 0 && (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Was</TableCell>
                    <TableCell align="right">Display price</TableCell>
                    <TableCell align="right">Display total</TableCell>
                    <TableCell width={48} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayLines.map((line) => (
                    <TableRow key={line.key}>
                      <TableCell>
                        {line.is_custom ? (
                          <TextField
                            size="small"
                            value={line.description}
                            onChange={(e) => handleLineDescriptionChange(line.key, e.target.value)}
                            fullWidth
                          />
                        ) : (
                          line.description
                        )}
                      </TableCell>
                      <TableCell align="right">{line.quantity}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>
                        {line.original_total != null ? fCurrency(line.original_total) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.price}
                          onChange={(e) => handleLinePriceChange(line.key, e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={line.total}
                          onChange={(e) => handleLineTotalChange(line.key, e.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {line.is_custom && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveLine(line.key)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button size="small" variant="soft" onClick={handleAddServiceLine}>
              Add service / handling line
            </Button>
            <Button size="small" variant="soft" onClick={handleAddCustomLine}>
              Add custom line
            </Button>
          </Stack>

          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {snapshot ? (
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
              <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="subtitle2">
                  Receipt copy total: {fCurrency(snapshot.display_total)}
                </Typography>
                {hasValidTarget && (
                  <Typography
                    variant="caption"
                    color={
                      Math.abs(snapshot.display_total - targetValue) < 0.02
                        ? 'success.main'
                        : 'warning.main'
                    }
                  >
                    Target: {fCurrency(targetValue)}
                    {Math.abs(snapshot.display_total - targetValue) >= 0.02 &&
                      ` (${fCurrency(snapshot.display_total - targetValue)} difference)`}
                  </Typography>
                )}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Edit line prices above, or add a service/handling line for part of the increase.
              </Typography>
            </Box>
          ) : (
            displayLines.length > 0 && (
              <Typography variant="caption" color="error">
                Receipt copy total must be greater than {fCurrency(actualTotal)}.
              </Typography>
            )
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button color="inherit" onClick={handleSkip} disabled={saving}>
          Use original
        </Button>
        <Button variant="contained" onClick={handleApply} disabled={!snapshot || saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : 'Apply & continue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
