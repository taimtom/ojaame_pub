import { useState, useEffect, useRef } from 'react';

/**
 * Tracks browser online/offline status.
 *
 * Returns:
 *   isOnline   – current network reachability (seeded from navigator.onLine)
 *   wasOffline – true for one render cycle after transitioning back online;
 *                consumers can use this as a trigger to start syncing.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const prevOnlineRef = useRef(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!prevOnlineRef.current) {
        setWasOffline(true);
      }
      prevOnlineRef.current = true;
    };

    const handleOffline = () => {
      setIsOnline(false);
      prevOnlineRef.current = false;
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset wasOffline after one render so it acts as a one-shot trigger
  useEffect(() => {
    if (wasOffline) {
      const id = setTimeout(() => setWasOffline(false), 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [wasOffline]);

  return { isOnline, wasOffline };
}
