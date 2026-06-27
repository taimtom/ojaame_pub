import ReactDOM from 'react-dom/client';
import { Suspense, StrictMode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';

import App from './app';
import { CONFIG } from './config-global';
import { isNativeApp } from 'src/utils/platform';
import { initNativeApp } from 'src/utils/native-init';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={CONFIG.site.basePath}>
        <Suspense>
          <App />
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);

initNativeApp();

const isAppHost =
  import.meta.env.DEV ||
  window.location.hostname === 'app.ojaa.me' ||
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

if (isAppHost && !isNativeApp) {
  registerSW({
    onNeedRefresh() {
      console.log('[PWA] New content available, auto-updating...');
    },
    onOfflineReady() {
      console.log('[PWA] App is ready for offline use');
    },
  });
}
