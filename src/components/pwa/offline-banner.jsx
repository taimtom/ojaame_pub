import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

import { usePathname } from 'src/routes/hooks';

import { useNetworkStatus } from 'src/hooks/use-network-status';

import { toast, isNetworkAdvisoryMessage } from 'src/components/snackbar';

import { NETWORK_QUALITY } from 'src/utils/network-quality';

// ----------------------------------------------------------------------

const DISMISS_KEY = 'ojaame_network_banner_dismissed';

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

function readDismissedQuality() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) || '';
  } catch {
    return '';
  }
}

function writeDismissedQuality(quality) {
  try {
    sessionStorage.setItem(DISMISS_KEY, quality);
  } catch {
    /* ignore */
  }
}

/**
 * Detects when the on-screen keyboard is open (mobile) via Visual Viewport.
 * Banner hides while the keyboard is up so it does not steal keypad space.
 */
function useKeyboardOpen() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const vv = window.visualViewport;
    let baseline = window.innerHeight;

    const update = () => {
      const focused = document.activeElement;
      const isEditable =
        focused &&
        (focused.tagName === 'INPUT' ||
          focused.tagName === 'TEXTAREA' ||
          focused.tagName === 'SELECT' ||
          focused.isContentEditable);

      if (!isEditable) {
        setKeyboardOpen(false);
        baseline = vv?.height || window.innerHeight;
        return;
      }

      if (vv) {
        // Keyboard typically shrinks visual viewport by >120px
        const shrink = baseline - vv.height;
        setKeyboardOpen(shrink > 120);
      } else {
        setKeyboardOpen(true);
      }
    };

    const onFocusIn = () => {
      baseline = vv?.height || window.innerHeight;
      // Defer so viewport can settle after keyboard animates
      window.setTimeout(update, 180);
    };

    const onFocusOut = () => {
      window.setTimeout(update, 180);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    vv?.addEventListener('resize', update);
    vv?.addEventListener('scroll', update);

    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      vv?.removeEventListener('resize', update);
      vv?.removeEventListener('scroll', update);
    };
  }, []);

  return keyboardOpen;
}

/**
 * Fixed bottom banner when offline / weak / slow.
 * Dismissible for the session; hidden while the mobile keyboard is open.
 */
export function OfflineBanner() {
  const pathname = usePathname();
  const { quality } = useNetworkStatus();
  const keyboardOpen = useKeyboardOpen();
  const [dismissedQuality, setDismissedQuality] = useState(readDismissedQuality);

  const showOnAuth =
    pathname?.startsWith('/auth') ||
    pathname === '/' ||
    pathname?.includes('sign-in') ||
    pathname?.includes('sign-up');
  const showInApp = pathname?.startsWith('/app');

  const handleClose = useCallback(() => {
    writeDismissedQuality(quality);
    setDismissedQuality(quality);
  }, [quality]);

  // Clear dismissal when quality improves or worsens to a different state
  useEffect(() => {
    if (!quality || quality === NETWORK_QUALITY.GOOD) {
      if (dismissedQuality) {
        writeDismissedQuality('');
        setDismissedQuality('');
      }
      return;
    }
    // If we were dismissed for "slow" but are now "offline", show again
    if (dismissedQuality && dismissedQuality !== quality) {
      writeDismissedQuality('');
      setDismissedQuality('');
    }
  }, [quality, dismissedQuality]);

  // Kill any top-right network toasts while connection is degraded (banner is enough).
  useEffect(() => {
    if (quality === NETWORK_QUALITY.GOOD) return undefined;

    const dismissNetworkToasts = () => {
      const root = document.querySelector('[data-sonner-toaster]');
      if (!root) return;

      root.querySelectorAll('[data-sonner-toast]').forEach((el) => {
        const text = el.textContent || '';
        if (!isNetworkAdvisoryMessage(text)) return;

        const id = el.getAttribute('data-sonner-toast');
        if (id) {
          toast.dismiss(id);
          return;
        }
        el.querySelector('[data-close-button]')?.click();
      });
    };

    dismissNetworkToasts();
    const root = document.querySelector('[data-sonner-toaster]');
    const observer =
      root &&
      new MutationObserver(() => {
        dismissNetworkToasts();
      });
    if (root && observer) {
      observer.observe(root, { childList: true, subtree: true });
    }

    return () => observer?.disconnect();
  }, [quality]);

  if (!showOnAuth && !showInApp) return null;

  const copy = bannerCopy(quality, pathname);
  if (!copy) return null;
  if (dismissedQuality === quality) return null;
  if (keyboardOpen) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        pb: 'env(safe-area-inset-bottom, 0px)',
        pointerEvents: 'none',
      }}
    >
      <Alert
        severity={copy.severity}
        variant="filled"
        onClose={handleClose}
        sx={{
          borderRadius: 0,
          justifyContent: 'center',
          py: 0.5,
          pointerEvents: 'auto',
          boxShadow: (theme) => theme.customShadows?.z8 || theme.shadows[8],
          '& .MuiAlert-message': {
            flex: 1,
            textAlign: 'center',
          },
        }}
      >
        {copy.text}
      </Alert>
    </Box>
  );
}
