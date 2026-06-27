import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const isNativeApp = Capacitor.isNativePlatform();

export async function getAuthToken() {
  if (isNativeApp) {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value ?? null;
  }

  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export async function setAuthToken(accessToken) {
  if (isNativeApp) {
    if (accessToken) {
      await Preferences.set({ key: STORAGE_KEY, value: accessToken });
    } else {
      await Preferences.remove({ key: STORAGE_KEY });
    }
    return;
  }

  if (typeof window === 'undefined') return;

  if (accessToken) {
    sessionStorage.setItem(STORAGE_KEY, accessToken);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export async function removeAuthToken() {
  await setAuthToken(null);
}
