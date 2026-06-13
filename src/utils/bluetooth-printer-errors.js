// ----------------------------------------------------------------------

function createBluetoothPrinterError(name, defaultMessage) {
  return (message = defaultMessage) => {
    const error = new Error(message);
    error.name = name;
    return error;
  };
}

export const BluetoothUnsupportedError = createBluetoothPrinterError(
  'BluetoothUnsupportedError',
  'Web Bluetooth is not available on this device.'
);

export const PrinterNotPairedError = createBluetoothPrinterError(
  'PrinterNotPairedError',
  'No Bluetooth printer is paired.'
);

export const PrinterDisconnectedError = createBluetoothPrinterError(
  'PrinterDisconnectedError',
  'Bluetooth printer is not connected.'
);
