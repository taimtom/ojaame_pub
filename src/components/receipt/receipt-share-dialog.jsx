import { useCallback, useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  buildReceiptFile,
  buildReceiptShareCaption,
  downloadReceiptBlob,
  shareReceiptFile,
} from 'src/utils/receipt-output';
import {
  getPreferredShareFormat,
  setPreferredShareFormat,
} from 'src/utils/receipt-preferences';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ReceiptShareDialog({
  open,
  onClose,
  receipt,
  loading = false,
  receiptFormat = 'thermal',
  pdfFlavor = 'pos',
  thermalWidthMm,
  currentStatus,
  shareText,
}) {
  const [shareFormat, setShareFormat] = useState(() => getPreferredShareFormat());
  const [generating, setGenerating] = useState(false);
  const [shareBlob, setShareBlob] = useState(null);
  const [shareFileName, setShareFileName] = useState('');
  const [shareMimeType, setShareMimeType] = useState('application/pdf');
  const [sharing, setSharing] = useState(false);

  const previewUrl = useMemo(
    () => (shareBlob ? URL.createObjectURL(shareBlob) : null),
    [shareBlob]
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    if (!open) {
      setShareBlob(null);
      setShareFileName('');
      return undefined;
    }

    if (!receipt || loading) {
      return undefined;
    }

    let cancelled = false;

    const generate = async () => {
      setGenerating(true);
      try {
        const file = await buildReceiptFile({
          receipt,
          format: shareFormat,
          receiptFormat,
          pdfFlavor,
          thermalWidthMm,
          currentStatus: currentStatus ?? receipt?.status,
        });

        if (cancelled) return;

        setShareBlob(file.blob);
        setShareFileName(file.fileName);
        setShareMimeType(file.mimeType);
      } catch (error) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error('Receipt share file generation failed:', error);
          toast.error('Could not generate receipt for sharing.');
        }
      } finally {
        if (!cancelled) {
          setGenerating(false);
        }
      }
    };

    generate();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    receipt,
    loading,
    shareFormat,
    receiptFormat,
    pdfFlavor,
    thermalWidthMm,
    currentStatus,
  ]);

  const handleFormatChange = (_event, value) => {
    if (value !== null) {
      setShareFormat(value);
      setPreferredShareFormat(value);
    }
  };

  const handleClose = useCallback(() => {
    setShareBlob(null);
    onClose?.();
  }, [onClose]);

  const handleShare = useCallback(async () => {
    if (!shareBlob || sharing) return;

    setSharing(true);
    try {
      const result = await shareReceiptFile({
        blob: shareBlob,
        fileName: shareFileName,
        mimeType: shareMimeType,
        text: shareText ?? buildReceiptShareCaption(receipt),
      });

      if (result === 'shared') {
        handleClose();
      } else if (result === 'downloaded') {
        toast.info('Direct sharing is unavailable on this browser. File downloaded.');
        handleClose();
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        toast.error('Sharing was blocked by the browser. Try again.');
      }
    } finally {
      setSharing(false);
    }
  }, [shareBlob, shareFileName, shareMimeType, shareText, receipt, sharing, handleClose]);

  const handleDownload = useCallback(() => {
    if (!shareBlob) return;
    downloadReceiptBlob(shareBlob, shareFileName);
    toast.success('Receipt downloaded.');
  }, [shareBlob, shareFileName]);

  const isLoading = loading || generating;
  const isPdf = shareMimeType === 'application/pdf';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share receipt</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={shareFormat}
            onChange={handleFormatChange}
            disabled={isLoading}
          >
            <ToggleButton value="whatsapp">
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Iconify icon="mdi:whatsapp" width={18} />
                <span>WhatsApp</span>
              </Stack>
            </ToggleButton>
            <ToggleButton value="pdf">
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Iconify icon="mdi:file-pdf-box" width={18} />
                <span>PDF</span>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="body2" color="text.secondary">
            WhatsApp format is optimized for sending to customers. They can view it directly in
            chat.
          </Typography>

          {isLoading ? (
            <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={32} />
            </Box>
          ) : previewUrl ? (
            isPdf ? (
              <Box
                component="iframe"
                title="Receipt PDF preview"
                src={previewUrl}
                sx={{
                  width: 1,
                  height: { xs: 360, sm: 480 },
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                }}
              />
            ) : (
              <Box
                component="img"
                alt="Receipt preview"
                src={previewUrl}
                sx={{
                  width: 1,
                  height: 'auto',
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              />
            )
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
              Preview not available
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button color="inherit" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="outlined" onClick={handleDownload} disabled={!shareBlob || isLoading}>
          Download
        </Button>
        <Button
          variant="contained"
          onClick={handleShare}
          disabled={!shareBlob || isLoading || sharing}
        >
          {sharing ? 'Sharing…' : 'Share now'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
