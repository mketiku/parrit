import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import { VitePWA } from 'vite-plugin-pwa';

function getBuildDate(): string {
  return new Date().toISOString().slice(0, 10); // e.g. "2026-04-15"
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isTest = mode === 'test' || process.env.VITEST === 'true';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __APP_BUILD_DATE__: JSON.stringify(getBuildDate()),
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(!isTest
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              filename: 'sw-v2.js',
              includeAssets: ['favicon.svg'],
              manifest: {
                name: 'Parrit - Modern Pairing',
                short_name: 'Parrit',
                description:
                  'A fast, beautiful pairing board for engineering teams.',
                theme_color: '#3b82f6',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                  {
                    src: 'favicon.svg',
                    sizes: '192x192 512x512',
                    type: 'image/svg+xml',
                    purpose: 'any maskable',
                  },
                ],
              },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      strictPort: false,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'animation-vendor': ['framer-motion', '@floating-ui/react-dom'],
            'dnd-vendor': [
              '@dnd-kit/core',
              '@dnd-kit/sortable',
              '@dnd-kit/utilities',
            ],
            'db-vendor': ['@supabase/supabase-js'],
            'data-vendor': ['@tanstack/react-query', 'zod', 'zustand'],
            'ui-vendor': ['lucide-react', 'date-fns'],
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      testTimeout: 10000,
      exclude: ['node_modules', 'tests/e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        thresholds: {
          lines: 70,
          statements: 70,
          branches: 70,
          functions: 60,
        },
        exclude: [
          'node_modules/',
          'dist/',
          'tests/',
          'supabase/',
          '**/*.d.ts',
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          'src/test/**',
          'src/main.tsx',
          'vite.config.ts',
          'playwright.config.ts',
          'postcss.config.js',
          'tailwind.config.js',
          'eslint.config.js',
          'scripts/generate-coverage-badge.mjs',
          'scripts/update-version.js',
          // Static/content-only/Boilerplate — no unique logic to test
          'src/App.tsx',
          'src/main.tsx',
          'src/features/pairing/types.ts',
          'src/features/static/components/**',
          'src/components/layout/**',
          'src/components/pwa/**',
          'src/components/ui/Toaster.tsx',
          'src/lib/supabase.ts',
        ],
      },
    },
  };
});
