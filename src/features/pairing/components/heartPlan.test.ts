import { describe, it, expect } from 'vitest';
import { getGreeting, getBoardAccentColor } from '../utils/visualHelpers';

// Note: These helpers are currently internal to the files but we can test them
// if we export them, or we can test the behavior via the component.
// For now, I'll move them to helpers or export them to make them testable.

describe('Pairing UI Helpers', () => {
  describe('getGreeting', () => {
    it('returns morning greeting before 12pm', () => {
      expect(getGreeting(5, 'Team')).toBe(
        "Morning, Team! Who's pairing today?"
      );
      expect(getGreeting(11, 'Team')).toBe(
        "Morning, Team! Who's pairing today?"
      );
    });

    it('returns afternoon greeting between 12pm and 5:59pm', () => {
      expect(getGreeting(12, 'Team')).toBe(
        'Good afternoon, Team. Ready to rotate?'
      );
      expect(getGreeting(17, 'Team')).toBe(
        'Good afternoon, Team. Ready to rotate?'
      );
    });

    it('returns evening greeting from 6pm onwards', () => {
      expect(getGreeting(18, 'Team')).toBe('Good evening, Team. Late session?');
      expect(getGreeting(23, 'Team')).toBe('Good evening, Team. Late session?');
      expect(getGreeting(0, 'Team')).toBe(
        "Morning, Team! Who's pairing today?"
      ); // 0 is < 12
    });
  });

  describe('getBoardAccentColor', () => {
    it('returns a stable color for the same ID', () => {
      const id = 'board-123';
      const color1 = getBoardAccentColor(id);
      const color2 = getBoardAccentColor(id);
      expect(color1).toBe(color2);
      expect(color1).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns different colors for different IDs', () => {
      const colorA = getBoardAccentColor('board-a');
      const colorB = getBoardAccentColor('board-b');
      // While collisions are possible with a simple hash, they should generally differ
      expect(colorA).not.toBe(colorB);
    });
  });
});
