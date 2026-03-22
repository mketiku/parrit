import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatToday } from './dateUtils';

describe('dateUtils formatToday', () => {
  beforeEach(() => {
    // Tell vitest we are mocking time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original timers
    vi.useRealTimers();
  });

  it('formats today properly (March 21, 2026)', () => {
    // Mock today to Saturday, March 21, 2026
    const date = new Date(2026, 2, 21); // March is 2
    vi.setSystemTime(date);

    expect(formatToday()).toBe('Saturday, March 21st');
  });

  it('formats another day properly (January 1, 2026)', () => {
    // Mock today to Thursday, January 1, 2026
    const date = new Date(2026, 0, 1);
    vi.setSystemTime(date);

    expect(formatToday()).toBe('Thursday, January 1st');
  });
});
