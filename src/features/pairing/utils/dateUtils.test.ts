import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatToday,
  formatLocalDate,
  parseLocalDate,
  isSameDay,
} from './dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatToday', () => {
    it('formats today properly (March 21, 2026)', () => {
      const date = new Date(2026, 2, 21);
      vi.setSystemTime(date);
      expect(formatToday()).toBe('Saturday, March 21st');
    });
  });

  describe('formatLocalDate', () => {
    it('formats a date to YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 1);
      expect(formatLocalDate(date)).toBe('2024-01-01');
    });

    it('defaults to now', () => {
      const date = new Date(2024, 0, 1);
      vi.setSystemTime(date);
      expect(formatLocalDate()).toBe('2024-01-01');
    });
  });

  describe('parseLocalDate', () => {
    it('parses YYYY-MM-DD string', () => {
      const date = parseLocalDate('2024-01-01');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('handles T00:00:00Z format', () => {
      const date = parseLocalDate('2024-01-01T12:00:00Z');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it('falls back to today if null or empty', () => {
      const today = new Date(2024, 0, 1);
      vi.setSystemTime(today);
      const parsed = parseLocalDate(null);
      expect(parsed.getFullYear()).toBe(2024);
    });

    it('falls back to today if invalid string', () => {
      const today = new Date(2024, 0, 1);
      vi.setSystemTime(today);
      const parsed = parseLocalDate('invalid');
      expect(parsed.getFullYear()).toBe(2024);
    });
  });

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      const d1 = new Date(2024, 0, 1, 10, 0);
      const d2 = new Date(2024, 0, 1, 15, 0);
      expect(isSameDay(d1, d2)).toBe(true);
    });

    it('returns false for different days', () => {
      const d1 = new Date(2024, 0, 1);
      const d2 = new Date(2024, 0, 2);
      expect(isSameDay(d1, d2)).toBe(false);
    });
  });
});
