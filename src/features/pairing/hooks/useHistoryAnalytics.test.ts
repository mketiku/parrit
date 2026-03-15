import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHistoryAnalytics } from './useHistoryAnalytics';
import { createPerson } from '../../../test/factories';

// Correct mocking approach for Vitest: define the implementation as a variable outside
const mockSelect = vi.fn().mockReturnThis();

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

// Mock Auth Store
vi.mock('../../auth/store/useAuthStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'test-user' },
  })),
}));

describe('useHistoryAnalytics Hook', () => {
  const mockPeople = [
    createPerson({ id: 'p1', name: 'Alice' }),
    createPerson({ id: 'p2', name: 'Bob' }),
  ];

  it('should fetch history and calculate stats correctly', async () => {
    // Setup mock response
    const mockHistoryData = [
      {
        person_id: 'p1',
        board_id: 'b1',
        session_id: 's1',
        created_at: '2024-01-01T10:00:00Z',
        people: { name: 'Alice', avatar_color_hex: '#111' },
      },
      {
        person_id: 'p2',
        board_id: 'b1',
        session_id: 's1',
        created_at: '2024-01-01T10:00:00Z',
        people: { name: 'Bob', avatar_color_hex: '#222' },
      },
    ];

    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi
          .fn()
          .mockResolvedValue({ data: mockHistoryData, error: null }),
      }),
    } as unknown as ReturnType<typeof mockSelect>);

    const { result } = renderHook(() => useHistoryAnalytics(mockPeople));

    // Wait for data to load
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const { personStats, matrix } = result.current;

    // Check stats for Alice (p1)
    expect(personStats['p1']).toBeDefined();
    expect(personStats['p1'].name).toBe('Alice');
    expect(personStats['p1'].partnerCounts['p2'].count).toBe(1);

    expect(matrix.counts['p1']['p2']).toBe(1);
  });

  it('should handle empty history correctly', async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    } as unknown as ReturnType<typeof mockSelect>);

    const { result } = renderHook(() => useHistoryAnalytics(mockPeople));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // With empty history the hook returns no stats
    expect(result.current.personStats).toEqual({});
  });
});
