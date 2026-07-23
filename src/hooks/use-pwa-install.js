import { useState, useEffect } from 'react';

/**
 * Captures the browser's beforeinstallprompt event so the install
 * dialog can be triggered on demand rather than immediately.
 *
 * Returns:
 *   isInstallable – true when the browser has a deferred prompt ready
 *   install       – fn() that triggers the native install prompt
 */
export function usePwaInstall() {
  const [prompt, setPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setPrompt(null);
    }
  };

  return { isInstallable, install };
}
