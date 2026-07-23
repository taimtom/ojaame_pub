import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { mutate } from 'swr';

import { isNativeApp } from './platform';

// ----------------------------------------------------------------------

export async function initNativeApp() {
  if (!isNativeApp) return;

  document.body.classList.add('native-app');

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1C252E' });
  } catch {
    /* status bar not available on all platforms */
  }

  try {
    await SplashScreen.hide();
  } catch {
    /* splash may already be hidden */
  }

  App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
      mutate(() => true, undefined, { revalidate: true });
    }
  });
}
