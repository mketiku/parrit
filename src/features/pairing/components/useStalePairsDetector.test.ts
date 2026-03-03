import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useStalePairsDetector } from './useStalePairsDetector';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          {
            session_id: 's1',
            board_id: 'b1',
            person_id: 'p1',
            created_at: '2024-01-02T10:00:00Z',
          },
          {
            session_id: 's1',
            board_id: 'b1',
            person_id: 'p2',
            created_at: '2024-01-02T10:00:00Z',
          },
          {
            session_id: 's2',
            board_id: 'b1',
            person_id: 'p1',
            created_at: '2024-01-01T10:00:00Z',
          },
          {
            session_id: 's2',
            board_id: 'b1',
            person_id: 'p3',
            created_at: '2024-01-01T10:00:00Z',
          },
        ],
        error: null,
      }),
    })),
  },
}));

// Mock Workspace Prefs
vi.mock('../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: () => ({ stalePairThreshold: 2 }),
}));

describe('useStalePairsDetector', () => {
  it('identifies recent pairs correctly', async () => {
    const { result } = renderHook(() => useStalePairsDetector());

    // Wait for internal load() to finish
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // (p1, p2) were paired in s1 (index 0, most recent)
    // stalePairThreshold is 2, so index 0 < 2 is true
    expect(result.current.isRecentPair('p1', 'p2')).toBe(true);

    // (p1, p3) were paired in s2 (index 1)
    // 1 < 2 is true
    expect(result.current.isRecentPair('p1', 'p3')).toBe(true);

    // (p2, p3) never paired
    expect(result.current.isRecentPair('p2', 'p3')).toBe(false);

    expect(result.current.getPairRecency('p1', 'p2')).toBe(0);
    expect(result.current.getPairRecency('p1', 'p3')).toBe(1);
    expect(result.current.getPairRecency('unknown', 'user')).toBeUndefined();
  });
});
