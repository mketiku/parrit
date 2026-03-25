import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DraggablePerson } from './DraggablePerson';
import type { Person } from '../types';

// Mock dnd-kit
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: { 'aria-roledescription': 'draggable' },
    listeners: { onPointerDown: vi.fn() },
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
}));

// Mock workspace prefs
vi.mock('../../../store/useWorkspacePrefsStore', () => ({
  useWorkspacePrefsStore: () => ({ showFullName: false }),
}));

describe('DraggablePerson Component', () => {
  const mockPerson: Person = {
    id: 'p1',
    name: 'Ada Lovelace',
    avatarColorHex: '#f00',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the person initials correctly initially', () => {
    render(<DraggablePerson person={mockPerson} sourceId="board1" />);
    // With showFullName mocked to false, initials "AL" should render.
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(
      <DraggablePerson
        person={mockPerson}
        sourceId="board1"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows tooltip on mouse enter after delay', () => {
    render(<DraggablePerson person={mockPerson} sourceId="board1" />);

    const button = screen.getByRole('button');

    act(() => {
      fireEvent.mouseEnter(button);
    });

    // Fast forward enough for tooltip to appear (600ms)
    act(() => {
      vi.advanceTimersByTime(650);
    });

    // Tooltip has role="tooltip" containing the full name
    expect(screen.getByRole('tooltip')).toHaveTextContent('Ada Lovelace');
  });
});
