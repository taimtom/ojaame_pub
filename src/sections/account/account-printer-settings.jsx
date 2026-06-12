import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useBluetoothPrinter } from 'src/hooks/use-bluetooth-printer';
import {
  getPreferredThermalWidthMm,
  normalizeThermalWidthMm,
  setPreferredThermalWidthMm,
} from 'src/utils/receipt-preferences';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function AccountPrinterSettings() {
  const {
    isSupported,
    isPaired,
    printerName,
    autoPrint,
    status,
    pair,
    forget,
    setAutoPrintEnabled,
    testPrint,
  } = useBluetoothPrinter();

  const thermalWidthMm = getPreferredThermalWidthMm();

  const handlePair = async () => {
    try {
      const paired = await pair();
      toast.success(`Paired with ${paired.name}`);
    } catch (err) {
      if (err?.name === 'NotFoundError') return;
      toast.error(err?.message || 'Could not pair Bluetooth printer.');
    }
  };

  const handleTestPrint = async () => {
    try {
      await testPrint();
      toast.success('Test receipt sent to printer.');
    } catch (err) {
      toast.error(err?.message || 'Test print failed.');
    }
  };

  const handleForget = () => {
    forget();
    toast.info('Bluetooth printer removed.');
  };

  const handleWidthChange = (_event, value) => {
    if (value !== null) {
      setPreferredThermalWidthMm(normalizeThermalWidthMm(value));
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6">Receipt printer (Bluetooth)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Pair a thermal printer once on Android Chrome. Future sales can print automatically
              without a separate receipt app.
            </Typography>
          </Box>

          {!isSupported && (
            <Alert severity="info">
              Direct Bluetooth printing is available on Android Chrome (and Chrome desktop for testing).
              On iPhone or unsupported browsers, receipts will use PDF share or print instead.
            </Alert>
          )}

          {isSupported && (
            <>
              <Alert severity={isPaired ? 'success' : 'warning'}>
                {isPaired
                  ? `Paired printer: ${printerName || 'Bluetooth printer'}`
                  : 'No printer paired yet. Tap Pair printer and select your device from the list.'}
              </Alert>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mdi:bluetooth" />}
                  onClick={() => void handlePair()}
                  disabled={status === 'connecting' || status === 'printing'}
                >
                  Pair printer
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
                  onClick={() => void handleTestPrint()}
                  disabled={!isPaired || status === 'printing'}
                >
                  Test print
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleForget}
                  disabled={!isPaired}
                >
                  Forget printer
                </Button>
              </Stack>

              <FormControlLabel
                control={
                  <Switch
                    checked={autoPrint}
                    onChange={(e) => setAutoPrintEnabled(e.target.checked)}
                    disabled={!isPaired}
                  />
                }
                label="Auto-print after each completed sale"
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Paper width
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={thermalWidthMm}
                  onChange={handleWidthChange}
                >
                  <ToggleButton value={80}>80mm</ToggleButton>
                  <ToggleButton value={58}>58mm</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
