import { useEffect } from 'react';

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
  useEffect(() => {
    // Only run in production to avoid infinite reloads during dev
    if (import.meta.env.DEV) return;

    const checkVersion = async () => {
      try {
        // Fetch version from the server (bypass cache)
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-cache',
        });

        if (!response.ok) return;

        const data = await response.json();
        const { min_required } = data;

        // If the current version is less than the minimum required version,
        // perform a hard refresh after clearing local caches and service workers.
        if (compareVersions(__APP_VERSION__, min_required) < 0) {
          console.warn(
            'Critical version mismatch detected. Performing hard upgrade...'
          );

          // 1. Clear caches
          if ('caches' in window) {
            const cacheKeys = await window.caches.keys();
            await Promise.all(
              cacheKeys.map((key) => window.caches.delete(key))
            );
          }

          // 2. Unregister all service workers
          if ('serviceWorker' in navigator) {
            const registrations =
              await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((reg) => reg.unregister()));
          }

          // 3. Forced hard reload from server
          window.location.reload();
        }
      } catch (error) {
        console.error('Error checking application version:', error);
      }
    };

    checkVersion();
  }, []);
}
