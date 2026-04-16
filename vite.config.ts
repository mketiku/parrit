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
      testTimeout: 10000,
      // Auto-clear mock call history between every test — prevents subtle
      // ordering bugs where a test passes only because a prior test set up state.
      clearMocks: true,

      // ── Speed: worker_threads — eliminates per-test fork overhead.
      pool: 'threads',
      maxWorkers: 8,

      // ── Speed: pre-bundle heavy deps once per run instead of re-parsing
      //    in every worker. Only include deps that are actually used in tests
      //    (mocked modules don't benefit).
      deps: {
        optimizer: {
          ssr: {
            enabled: true,
            include: [
              '@tanstack/react-query',
              'react',
              'react-dom',
              'zustand',
              '@dnd-kit/core',
              '@dnd-kit/sortable',
            ],
          },
        },
      },

      projects: [
        // ── Unit: pure Node environment — store slices, utils, helpers, algorithms.
        //    No DOM, no framer-motion mock, no cleanup. Fastest feedback loop.
        {
          extends: true,
          test: {
            name: 'unit',
            environment: 'node',
            setupFiles: ['./src/test/setup-unit.ts'],
            include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
            exclude: [
              'node_modules/**',
              'tests/e2e/**',
              // Tests that reference window/document — move to component tier
              'src/features/pairing/hooks/useHistoryAnalytics.test.ts',
              'src/store/useThemeStore.test.ts',
            ],
          },
        },

        // ── Component: jsdom environment — render/renderHook tests and anything
        //    that touches window/document/localStorage.
        {
          extends: true,
          test: {
            name: 'component',
            environment: 'jsdom',
            setupFiles: ['./src/test/setup-component.ts'],
            include: [
              'src/**/*.test.tsx',
              // Hook/store tests that use renderHook or DOM APIs
              'src/features/pairing/hooks/useHistoryAnalytics.test.ts',
              'src/store/useThemeStore.test.ts',
            ],
            exclude: ['node_modules/**'],
          },
        },
      ],

      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'json-summary', 'html'],
        thresholds: {
          // Global floor — keeps the overall codebase healthy.
          lines: 70,
          statements: 70,
          branches: 70,
          functions: 60,

          // ── Critical paths — tighter enforcement on code that is hard to
          //    debug in production and where regressions are most costly.

          // Core pairing algorithm — business logic heart of the app.
          'src/features/pairing/utils/pairingLogic.ts': {
            lines: 90,
            statements: 90,
            branches: 80,
            functions: 90,
          },
          // Auth store — session/role handling, workspace name derivation.
          'src/features/auth/store/useAuthStore.ts': {
            lines: 90,
            statements: 90,
            branches: 80,
            functions: 90,
          },
          // Store slices — stateful workflows (lifecycle, session, boards).
          'src/features/pairing/store/slices/lifecycleSlice.ts': {
            lines: 90,
            statements: 90,
            branches: 85,
            functions: 90,
          },
          'src/features/pairing/store/slices/sessionSlice.ts': {
            lines: 90,
            statements: 90,
            branches: 85,
            functions: 90,
          },
          'src/features/pairing/store/slices/boardsSlice.ts': {
            lines: 90,
            statements: 90,
            branches: 85,
            functions: 90,
          },
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
