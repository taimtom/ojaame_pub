import { buildReceiptEscPos } from './escpos/build-receipt-escpos';
import {
  BluetoothUnsupportedError,
  PrinterDisconnectedError,
  PrinterNotPairedError,
} from './bluetooth-printer-errors';

export {
  BluetoothUnsupportedError,
  PrinterDisconnectedError,
  PrinterNotPairedError,
} from './bluetooth-printer-errors';

// ----------------------------------------------------------------------

export const BLUETOOTH_PRINTER_CHANGE_EVENT = 'ojaa-bluetooth-printer-change';

const GATT_PROFILES = [
  {
    service: '000018f0-0000-1000-8000-00805f9b34fb',
    characteristic: '00002af1-0000-1000-8000-00805f9b34fb',
  },
  {
    service: '49535343-fe7d-4ae5-8fa9-9fafcf6e6adc',
    characteristic: '49535343-1e4d-4bd9-a61b-c23c14749e85',
  },
];

const CHUNK_SIZE = 20;
const CHUNK_DELAY_MS = 25;

let cachedConnection = null;

// ----------------------------------------------------------------------

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function notifyBluetoothPrinterChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BLUETOOTH_PRINTER_CHANGE_EVENT));
  }
}

export function isBluetoothPrintSupported() {
  if (typeof window === 'undefined') return false;
  if (!window.isSecureContext) return false;
  if (!navigator.bluetooth) return false;

  // Web Bluetooth for printers is practical on Android Chrome / desktop Chrome.
  const ua = navigator.userAgent || '';
  const isAndroidChrome = /Android/i.test(ua) && /Chrome/i.test(ua) && !/Edg/i.test(ua);
  const isDesktopChrome = /Chrome/i.test(ua) && !/Mobile/i.test(ua) && !/Edg/i.test(ua);
  return isAndroidChrome || isDesktopChrome;
}

async function resolveWritableCharacteristic(server) {
  const errors = [];

  const characteristic = await GATT_PROFILES.reduce(async (prevPromise, profile) => {
    const found = await prevPromise;
    if (found) return found;

    try {
      const service = await server.getPrimaryService(profile.service);
      const char = await service.getCharacteristic(profile.characteristic);
      if (char.properties.write || char.properties.writeWithoutResponse) {
        return char;
      }
    } catch (err) {
      errors.push(err);
    }
    return null;
  }, Promise.resolve(null));

  if (!characteristic) {
    throw PrinterDisconnectedError(
      errors[0]?.message || 'Could not find a writable printer characteristic.'
    );
  }
  return characteristic;
}

async function connectDevice(device) {
  if (!device?.gatt) {
    throw PrinterDisconnectedError('Invalid Bluetooth device.');
  }

  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  const characteristic = await resolveWritableCharacteristic(server);

  return { device, server, characteristic };
}

export async function writeEscPos(characteristic, bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const useWithoutResponse = characteristic.properties.writeWithoutResponse;
  const chunkCount = Math.ceil(data.length / CHUNK_SIZE);
  const chunks = Array.from({ length: chunkCount }, (_, index) =>
    data.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
  );

  await chunks.reduce(async (prevPromise, chunk, index) => {
    await prevPromise;
    if (useWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
    if (index + 1 < chunks.length) {
      await delay(CHUNK_DELAY_MS);
    }
  }, Promise.resolve());
}

export async function requestAndPairPrinter() {
  if (!isBluetoothPrintSupported()) {
    throw BluetoothUnsupportedError();
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: GATT_PROFILES.map((p) => p.service),
  });

  const connection = await connectDevice(device);
  cachedConnection = connection;

  return {
    id: device.id,
    name: device.name || 'Bluetooth printer',
    device,
    ...connection,
  };
}

export async function connectPairedPrinter(deviceId) {
  if (!isBluetoothPrintSupported()) {
    throw BluetoothUnsupportedError();
  }
  if (!deviceId) {
    throw PrinterNotPairedError();
  }

  if (cachedConnection?.device?.id === deviceId && cachedConnection.device.gatt?.connected) {
    return cachedConnection;
  }

  const devices = await navigator.bluetooth.getDevices();
  const device = devices.find((d) => d.id === deviceId);
  if (!device) {
    cachedConnection = null;
    throw PrinterNotPairedError(
      'Paired printer not found. Tap Pair printer and select your device again.'
    );
  }

  const connection = await connectDevice(device);
  cachedConnection = connection;
  return connection;
}

export function clearCachedPrinterConnection() {
  cachedConnection = null;
}

export async function printEscPosBytes(bytes, deviceId) {
  const connection = await connectPairedPrinter(deviceId);
  await writeEscPos(connection.characteristic, bytes);
}

export async function printReceiptViaBluetooth(receipt, options = {}) {
  const bytes = buildReceiptEscPos(receipt, options);
  const deviceId = options.deviceId;
  if (!deviceId) {
    throw PrinterNotPairedError();
  }
  await printEscPosBytes(bytes, deviceId);
}
