import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme =
  | 'macaw-elite'
  | 'night-parrot'
  | 'cyber-cockatoo'
  | 'sunset-parakeet';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  isDark: boolean;
  toggleDark: () => void;
  applyDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'macaw-elite',
      isDark: false,
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
      toggleDark: () => {
        const newDark = !get().isDark;
        set({ isDark: newDark });
        if (typeof document !== 'undefined') {
          if (newDark) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      },
      applyDark: (dark: boolean) => {
        set({ isDark: dark });
        if (typeof document !== 'undefined') {
          if (dark) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'parrit-theme-storage',
    }
  )
);
