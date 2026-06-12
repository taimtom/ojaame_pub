import { useCallback, useEffect, useState } from 'react';

import { buildTestReceiptEscPos } from 'src/utils/escpos/build-receipt-escpos';
import {
  BLUETOOTH_PRINTER_CHANGE_EVENT,
  clearCachedPrinterConnection,
  isBluetoothPrintSupported,
  notifyBluetoothPrinterChange,
  printEscPosBytes,
  printReceiptViaBluetooth,
  requestAndPairPrinter,
} from 'src/utils/bluetooth-printer';
import {
  clearBluetoothPrinter,
  getAutoPrintBluetooth,
  getBluetoothPrinterId,
  getBluetoothPrinterName,
  getPreferredThermalWidthMm,
  setAutoPrintBluetooth,
  setBluetoothPrinter,
} from 'src/utils/receipt-preferences';

// ----------------------------------------------------------------------

export function useBluetoothPrinter() {
  const [isSupported] = useState(() => isBluetoothPrintSupported());
  const [printerId, setPrinterId] = useState(() => getBluetoothPrinterId());
  const [printerName, setPrinterName] = useState(() => getBluetoothPrinterName());
  const [autoPrint, setAutoPrint] = useState(() => getAutoPrintBluetooth());
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const refreshFromStorage = useCallback(() => {
    setPrinterId(getBluetoothPrinterId());
    setPrinterName(getBluetoothPrinterName());
    setAutoPrint(getAutoPrintBluetooth());
  }, []);

  useEffect(() => {
    const handleChange = () => refreshFromStorage();
    window.addEventListener(BLUETOOTH_PRINTER_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(BLUETOOTH_PRINTER_CHANGE_EVENT, handleChange);
  }, [refreshFromStorage]);

  const pair = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    try {
      const paired = await requestAndPairPrinter();
      setBluetoothPrinter(paired.id, paired.name);
      notifyBluetoothPrinterChange();
      setStatus('idle');
      return paired;
    } catch (err) {
      setStatus('error');
      setError(err);
      throw err;
    }
  }, []);

  const forget = useCallback(() => {
    clearBluetoothPrinter();
    clearCachedPrinterConnection();
    notifyBluetoothPrinterChange();
    setStatus('idle');
    setError(null);
  }, []);

  const setAutoPrintEnabled = useCallback((enabled) => {
    setAutoPrintBluetooth(enabled);
    notifyBluetoothPrinterChange();
  }, []);

  const printReceipt = useCallback(
    async (receipt, options = {}) => {
      const deviceId = getBluetoothPrinterId();
      if (!deviceId) {
        throw new Error('No Bluetooth printer paired.');
      }

      setStatus('printing');
      setError(null);
      try {
        await printReceiptViaBluetooth(receipt, {
          ...options,
          deviceId,
          paperWidthMm: options.paperWidthMm ?? getPreferredThermalWidthMm(),
        });
        setStatus('idle');
      } catch (err) {
        setStatus('error');
        setError(err);
        throw err;
      }
    },
    []
  );

  const testPrint = useCallback(async () => {
    const deviceId = getBluetoothPrinterId();
    if (!deviceId) {
      throw new Error('No Bluetooth printer paired.');
    }

    setStatus('printing');
    setError(null);
    try {
      const bytes = buildTestReceiptEscPos(getPreferredThermalWidthMm());
      await printEscPosBytes(bytes, deviceId);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err);
      throw err;
    }
  }, []);

  return {
    isSupported,
    isPaired: Boolean(printerId),
    printerId,
    printerName,
    autoPrint,
    status,
    error,
    pair,
    forget,
    setAutoPrintEnabled,
    printReceipt,
    testPrint,
  };
}
