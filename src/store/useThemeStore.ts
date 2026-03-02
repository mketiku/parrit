import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'macaw-elite' | 'night-parrot';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'macaw-elite',
      setTheme: (theme) => {
        set({ theme });
        // Update data-theme on html tag
        if (typeof document !== 'undefined') {
          if (theme === 'macaw-elite') {
            document.documentElement.removeAttribute('data-theme');
          } else {
            document.documentElement.setAttribute('data-theme', theme);
          }
        }
      },
    }),
    {
      name: 'parrit-theme-storage',
    }
  )
);
