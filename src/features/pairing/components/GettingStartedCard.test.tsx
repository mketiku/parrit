import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { GettingStartedCard } from './GettingStartedCard';
import { useWorkspacePrefsStore } from '../../../store/useWorkspacePrefsStore';
import { createBoard, createPerson } from '../../../test/factories';

vi.mock('../../../store/useWorkspacePrefsStore');

const mockUseWorkspacePrefsStore = vi.mocked(useWorkspacePrefsStore);
const mockSetGettingStartedDismissed = vi.fn();

describe('GettingStartedCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseWorkspacePrefsStore.mockReturnValue({
      gettingStartedDismissed: false,
      setGettingStartedDismissed: mockSetGettingStartedDismissed,
    } as unknown as ReturnType<typeof useWorkspacePrefsStore>);
  });

  it('renders incomplete checklist state and progress', () => {
    render(
      <GettingStartedCard people={[]} boards={[]} hasSessionSaved={false} />
    );

    expect(screen.getByText(/getting started/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 5 done/i)).toBeInTheDocument();
    expect(screen.getByText(/add your teammates/i)).toBeInTheDocument();
    expect(screen.getByText(/save your first session/i)).toBeInTheDocument();
  });

  it('renders all steps completed and allows dismissing the guide', () => {
    render(
      <GettingStartedCard
        people={[createPerson({ name: 'Alice' })]}
        boards={[
          createBoard({
            name: 'Platform',
            assignedPersonIds: ['person-1'],
            goals: ['Ship auth'],
          }),
        ]}
        hasSessionSaved
      />
    );

    expect(screen.getByText(/5 of 5 done/i)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /the flock is ready/i })
    );

    expect(mockSetGettingStartedDismissed).toHaveBeenCalledWith(true);
  });

  it('collapses and expands the checklist', () => {
    render(
      <GettingStartedCard people={[]} boards={[]} hasSessionSaved={false} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: /collapse getting started/i })
    );

    expect(screen.queryByText(/add your teammates/i)).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /expand getting started/i })
    );

    expect(screen.getByText(/add your teammates/i)).toBeInTheDocument();
  });

  it('renders nothing after the guide has been dismissed', () => {
    mockUseWorkspacePrefsStore.mockReturnValue({
      gettingStartedDismissed: true,
      setGettingStartedDismissed: mockSetGettingStartedDismissed,
    } as unknown as ReturnType<typeof useWorkspacePrefsStore>);

    const { container } = render(
      <GettingStartedCard people={[]} boards={[]} hasSessionSaved={false} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
