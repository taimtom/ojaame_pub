import { useRef, useState, useEffect, useCallback } from 'react';

import {
  NETWORK_QUALITY,
  classifyConnection,
  probeApiReachability,
  getRecentAverageLatency,
  getConnectionQualityMessage,
  getBrowserConnectionSnapshot,
} from 'src/utils/network-quality';

import { CONFIG } from 'src/config-global';

/**
 * Tracks online/offline + connection quality (poor / slow / good).
 *
 * Returns:
 *   isOnline, wasOffline – existing offline-sync helpers
 *   quality – 'offline' | 'poor' | 'slow' | 'good'
 *   message – user-facing explanation when not good (else null)
 *   isDegraded – true when offline, poor, or slow
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [quality, setQuality] = useState(() =>
    classifyConnection({
      ...getBrowserConnectionSnapshot(),
      recentLatencyMs: getRecentAverageLatency(),
    })
  );
  const prevOnlineRef = useRef(navigator.onLine);

  const refreshQuality = useCallback((onlineOverride) => {
    const snapshot = getBrowserConnectionSnapshot();
    const online = onlineOverride ?? snapshot.online;
    const next = classifyConnection({
      ...snapshot,
      online,
      recentLatencyMs: getRecentAverageLatency(),
    });
    setQuality(next);
    return next;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!prevOnlineRef.current) {
        setWasOffline(true);
      }
      prevOnlineRef.current = true;
      refreshQuality(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      prevOnlineRef.current = false;
      setQuality(NETWORK_QUALITY.OFFLINE);
    };

    const handleConnectionChange = () => {
      refreshQuality(navigator.onLine);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    conn?.addEventListener?.('change', handleConnectionChange);

    // Periodic quality refresh from latency samples + optional reachability probe
    const intervalId = setInterval(async () => {
      if (!navigator.onLine) {
        setQuality(NETWORK_QUALITY.OFFLINE);
        return;
      }

      const probe = await probeApiReachability(CONFIG.site.serverUrl, { timeoutMs: 7000 });
      if (!probe.ok) {
        // Unreachable or timed out — treat as weak network (not browser-offline).
        setQuality(NETWORK_QUALITY.POOR);
        return;
      }

      refreshQuality(true);
    }, 45000);

    refreshQuality(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      conn?.removeEventListener?.('change', handleConnectionChange);
      clearInterval(intervalId);
    };
  }, [refreshQuality]);

  // Reset wasOffline after one render so it acts as a one-shot trigger
  useEffect(() => {
    if (wasOffline) {
      const id = setTimeout(() => setWasOffline(false), 0);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [wasOffline]);

  const message = getConnectionQualityMessage(quality);
  const isDegraded = quality !== NETWORK_QUALITY.GOOD;

  return {
    isOnline,
    wasOffline,
    quality,
    message,
    isDegraded,
    isSlow: quality === NETWORK_QUALITY.SLOW,
    isPoor: quality === NETWORK_QUALITY.POOR || quality === NETWORK_QUALITY.OFFLINE,
  };
}
