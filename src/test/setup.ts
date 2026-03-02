import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// cleanup after each test
afterEach(() => {
  cleanup();
});
