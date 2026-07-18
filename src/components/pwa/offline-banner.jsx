import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import { usePathname } from 'src/routes/hooks';

import { useNetworkStatus } from 'src/hooks/use-network-status';

import { NETWORK_QUALITY } from 'src/utils/network-quality';

function bannerCopy(quality, pathname) {
  const inApp = pathname?.startsWith('/app');

  if (quality === NETWORK_QUALITY.OFFLINE) {
    return {
      severity: 'warning',
      text: inApp
        ? 'You are offline. POS sales are queued and will sync when you reconnect.'
        : 'You are offline. Check your internet connection before continuing.',
    };
  }

  if (quality === NETWORK_QUALITY.POOR) {
    return {
      severity: 'warning',
      text: 'Weak internet connection detected. The app may feel slow or fail to load — this is your network, not Ojaame.',
    };
  }

  if (quality === NETWORK_QUALITY.SLOW) {
    return {
      severity: 'info',
      text: 'Slow internet connection detected. Pages and actions may take longer than usual.',
    };
  }

  return null;
}

/**
 * Shows a fixed banner when the device is offline or the connection is weak/slow.
 * Visible on auth screens and inside the app.
 */
export function OfflineBanner() {
  const pathname = usePathname();
  const { quality } = useNetworkStatus();

  const showOnAuth = pathname?.startsWith('/auth') || pathname === '/' || pathname?.includes('sign-in') || pathname?.includes('sign-up');
  const showInApp = pathname?.startsWith('/app');

  if (!showOnAuth && !showInApp) return null;

  const copy = bannerCopy(quality, pathname);
  if (!copy) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
      }}
    >
      <Alert
        severity={copy.severity}
        variant="filled"
        sx={{ borderRadius: 0, justifyContent: 'center', py: 0.5 }}
      >
        {copy.text}
      </Alert>
    </Box>
  );
}
