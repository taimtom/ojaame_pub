import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import { getAuthToken, removeAuthToken, setAuthToken } from './auth-storage';

// ----------------------------------------------------------------------

export const isNativeApp = Capacitor.isNativePlatform();
export const isWeb = !isNativeApp;
export const platform = Capacitor.getPlatform();

export { getAuthToken, setAuthToken, removeAuthToken };

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

/**
 * Share content via Capacitor Share on native, navigator.share on web.
 * @returns {'shared' | 'cancelled' | 'unavailable'}
 */
export async function shareContent({ blob, fileName, mimeType, title, text }) {
  if (isNativeApp && blob && fileName) {
    const base64 = await blobToBase64(blob);
    const safeName = fileName.replace(/[^\w.-]/g, '_');
    const filePath = `share/${Date.now()}-${safeName}`;

    const { uri } = await Filesystem.writeFile({
      path: filePath,
      data: base64,
      directory: Directory.Cache,
    });

    try {
      await Share.share({
        title: title || fileName.replace(/\.(png|pdf)$/i, ''),
        text: text || '',
        files: [uri],
        dialogTitle: 'Share receipt',
      });
      return 'shared';
    } catch (err) {
      if (err?.message?.includes('cancel') || err?.name === 'AbortError') {
        return 'cancelled';
      }
      throw err;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share && blob && fileName) {
    const file = new File([blob], fileName, { type: mimeType });

    if (!navigator.canShare?.({ files: [file] })) {
      return 'unavailable';
    }

    try {
      await navigator.share({
        title: title || fileName.replace(/\.(png|pdf)$/i, ''),
        text: text || '',
        files: [file],
      });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      throw err;
    }
  }

  return 'unavailable';
}
