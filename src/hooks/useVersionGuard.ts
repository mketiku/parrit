import { useEffect, useState, useCallback } from 'react';

/**
 * Compares two semantic version strings (e.g. "1.1.0" vs "1.1.1").
 * Returns 1 if v1 > v2, -1 if v1 < v2, and 0 if v1 == v2.
 */
function compareVersions(v1: string, v2: string): number {
  if (!v1 || !v2) return 0;

  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

export function useVersionGuard() {
  const [isOutdated, setIsOutdated] = useState(false);

  const triggerHardUpdate = useCallback(async () => {
    console.warn(
      'Critical version mismatch detected. Performing hard upgrade...'
    );

    try {
      // 1. Clear caches
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }

      // 2. Unregister ALL service workers (sometimes multiple are registered if PWA changes)
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      // 3. Clear session storage (but not local storage, to keep auth if possible)
      // Actually, clearing local storage might be too much, but session storage is safe.
      window.sessionStorage.clear();

      // 4. Forced hard reload from server
      window.location.reload();
    } catch (err) {
      console.error('Hard update failed', err);
      window.location.reload();
    }
  }, []);

  const checkVersion = useCallback(async () => {
    try {
      // Fetch version from the server (bypass cache)
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
      });

      if (!response.ok) return;

      const data = await response.json();
      const { min_required } = data;

      // If the current version is less than the minimum required version,
      // trigger the outdated status.
      if (compareVersions(__APP_VERSION__, min_required) < 0) {
        setIsOutdated(true);
      } else {
        setIsOutdated(false);
      }
    } catch (error) {
      console.error('Error checking application version:', error);
    }
  }, []);

  useEffect(() => {
    // Only run in production to avoid infinite reloads during dev
    if (import.meta.env.DEV && !import.meta.env.VITEST) return;

    // Initial check on mount
    const onMount = async () => {
      await checkVersion();
    };
    onMount();

    // Periodic check every 15 minutes (900,000 ms)
    const intervalId = setInterval(checkVersion, 900 * 1000);

    // Visibility-based check: when user comes back to the tab, check immediately
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkVersion]);

  return { isOutdated, triggerHardUpdate };
}
