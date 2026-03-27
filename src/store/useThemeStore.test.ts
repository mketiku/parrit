import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from './useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    // Reset store state
    useThemeStore.setState({
      theme: 'macaw-elite',
      isDark: false,
    });
    // Reset DOM state
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
    vi.clearAllMocks();
  });

  it('should have correct default values', () => {
    const state = useThemeStore.getState();
    expect(state.theme).toBe('macaw-elite');
    expect(state.isDark).toBe(false);
  });

  it('should set theme and update data-theme attribute', () => {
    const { setTheme } = useThemeStore.getState();

    setTheme('night-parrot');
    expect(useThemeStore.getState().theme).toBe('night-parrot');
    expect(document.documentElement.getAttribute('data-theme')).toBe(
      'night-parrot'
    );

    setTheme('macaw-elite');
    expect(useThemeStore.getState().theme).toBe('macaw-elite');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('should toggle dark mode and update classList', () => {
    const { toggleDark } = useThemeStore.getState();

    toggleDark();
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    toggleDark();
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply specific dark mode state', () => {
    const { applyDark } = useThemeStore.getState();

    applyDark(true);
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyDark(false);
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
