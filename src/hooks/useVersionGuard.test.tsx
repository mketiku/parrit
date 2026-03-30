import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useVersionGuard } from './useVersionGuard';

describe('useVersionGuard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('marks the app as outdated when the deployed minimum version is newer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ min_required: '999.0.0' }),
      })
    );

    const { result } = renderHook(() => useVersionGuard());

    await waitFor(() => expect(result.current.isOutdated).toBe(true));
  });

  it('rechecks the version when the document becomes visible again', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ min_required: '0.0.1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ min_required: '999.0.0' }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const visibilitySpy = vi.spyOn(document, 'visibilityState', 'get');
    visibilitySpy.mockReturnValue('hidden');

    const { result } = renderHook(() => useVersionGuard());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(result.current.isOutdated).toBe(false);

    visibilitySpy.mockReturnValue('visible');
    window.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.isOutdated).toBe(true));
  });

  it('clears caches, unregisters service workers, and reloads on hard update', async () => {
    const deleteCache = vi.fn().mockResolvedValue(true);
    const unregister = vi.fn().mockResolvedValue(true);
    const reload = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ min_required: '0.0.1' }),
      })
    );

    Object.defineProperty(window, 'caches', {
      value: {
        keys: vi.fn().mockResolvedValue(['v1']),
        delete: deleteCache,
      },
      configurable: true,
    });

    Object.defineProperty(window, 'location', {
      value: { reload },
      configurable: true,
    });

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistrations: vi.fn().mockResolvedValue([{ unregister }]),
      },
      configurable: true,
    });

    window.sessionStorage.setItem('draft', '1');
    const { result } = renderHook(() => useVersionGuard());

    await result.current.triggerHardUpdate();

    expect(deleteCache).toHaveBeenCalledWith('v1');
    expect(unregister).toHaveBeenCalled();
    expect(window.sessionStorage.getItem('draft')).toBeNull();
    expect(reload).toHaveBeenCalled();
  });

  it('handles errors during hard update and reloads anyway', async () => {
    const reload = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    Object.defineProperty(window, 'location', {
      value: { reload },
      configurable: true,
    });

    Object.defineProperty(window, 'caches', {
      get: () => {
        throw new Error('Caches broken');
      },
      configurable: true,
    });

    const { result } = renderHook(() => useVersionGuard());
    await result.current.triggerHardUpdate();

    expect(reload).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Hard update failed',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it('marks app as not outdated when versions are equal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ min_required: __APP_VERSION__ }),
      })
    );

    const { result } = renderHook(() => useVersionGuard());
    await waitFor(() => expect(result.current.isOutdated).toBe(false));
  });

  it('handles errors during version check', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Fetch failed'))
    );

    renderHook(() => useVersionGuard());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking application version:',
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });
});
