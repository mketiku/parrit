import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock Supabase client globally — prevents `supabaseUrl is required`
// from crashing test suites that import Supabase at module level.
vi.mock('@/lib/supabase');

// Mock zustand persist middleware globally for all tests to handle localStorage unavailability
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('zustand/middleware', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    persist: (config: any) => (set: any, get: any, api: any) =>
      config(set, get, api),
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any */

// cleanup after each test
afterEach(() => {
  cleanup();
});
