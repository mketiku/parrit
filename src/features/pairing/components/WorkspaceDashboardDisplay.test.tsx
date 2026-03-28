import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import React from 'react';
import { WorkspaceDashboardDisplay } from './WorkspaceDashboardDisplay';
import { createBoard, createPerson } from '../../../test/factories';

describe('WorkspaceDashboardDisplay', () => {
  it('renders boards, goals, and assigned people in admin view', () => {
    render(
      <WorkspaceDashboardDisplay
        isAdminView
        boards={[
          createBoard({
            id: 'board-1',
            name: 'Platform',
            goals: ['Ship auth', 'Review alerts'],
            assignedPersonIds: ['person-1'],
          }),
        ]}
        people={[
          createPerson({
            id: 'person-1',
            name: 'Alice',
            avatarColorHex: '#ff0000',
          }),
        ]}
      />
    );

    expect(screen.getByText(/secure admin view/i)).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText(/ship auth/i)).toBeInTheDocument();
    expect(screen.getByText(/review alerts/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows no active focus when a board has no goals', () => {
    render(
      <WorkspaceDashboardDisplay
        boards={[createBoard({ id: 'board-1', name: 'Support', goals: [] })]}
        people={[]}
      />
    );

    expect(screen.getByText(/no active focus/i)).toBeInTheDocument();
  });

  it('renders teammates on standby for unpaired people', () => {
    render(
      <WorkspaceDashboardDisplay
        boards={[
          createBoard({
            id: 'board-1',
            name: 'Platform',
            assignedPersonIds: ['person-1'],
          }),
        ]}
        people={[
          createPerson({ id: 'person-1', name: 'Alice' }),
          createPerson({ id: 'person-2', name: 'Bob' }),
        ]}
      />
    );

    expect(screen.getByText(/teammates on standby/i)).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('omits the standby section when everyone is assigned', () => {
    render(
      <WorkspaceDashboardDisplay
        boards={[
          createBoard({
            id: 'board-1',
            name: 'Platform',
            assignedPersonIds: ['person-1'],
          }),
        ]}
        people={[createPerson({ id: 'person-1', name: 'Alice' })]}
      />
    );

    expect(screen.queryByText(/teammates on standby/i)).not.toBeInTheDocument();
  });
});
