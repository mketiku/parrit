/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamScreen } from './TeamScreen';
import { usePairingStore } from '../../pairing/store/usePairingStore';
import React from 'react';

// Mock the pairing store
vi.mock('../../pairing/store/usePairingStore');

describe('TeamScreen Component', () => {
  const mockAddPerson = vi.fn();
  const mockUpdatePerson = vi.fn();
  const mockRemovePerson = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (usePairingStore as any).mockReturnValue({
      people: [{ id: '1', name: 'Original Name', avatarColorHex: '#ff0000' }],
      addPerson: mockAddPerson,
      updatePerson: mockUpdatePerson,
      removePerson: mockRemovePerson,
    });
  });

  it('renders the team members list', () => {
    render(<TeamScreen />);
    expect(screen.getByText('Original Name')).toBeInTheDocument();
  });

  it('allows starting the add person process', () => {
    render(<TeamScreen />);
    const addButton = screen.getByRole('button', { name: /Add Person/i });
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText(/Full name/i)).toBeInTheDocument();
  });

  it('calls addPerson with the typed name and clears input', async () => {
    render(<TeamScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Add Person/i }));

    const input = screen.getByPlaceholderText(/Full name/i);
    fireEvent.change(input, { target: { value: 'New Teammate' } });
    fireEvent.click(screen.getByText('Add'));

    expect(mockAddPerson).toHaveBeenCalledWith('New Teammate');
    expect(input).toHaveValue('');
  });

  it('enters edit mode and updates a person', async () => {
    render(<TeamScreen />);
    const editButton = screen.getByLabelText(/Edit team member/i);
    fireEvent.click(editButton);

    const editInput = screen.getByDisplayValue('Original Name');
    fireEvent.change(editInput, { target: { value: 'Updated Name' } });

    // Choose a color swatch
    // Line 194 in TeamScreen renders PRESET_COLORS
    // Since we mock colors, we can just click one via title or color
    const colorButton = screen.getByTitle('#6366f1');
    fireEvent.click(colorButton);

    const saveButton = screen.getByLabelText(/Save changes/i);
    fireEvent.click(saveButton);

    expect(mockUpdatePerson).toHaveBeenCalledWith('1', {
      name: 'Updated Name',
      avatarColorHex: '#6366f1',
    });
  });

  it('calls removePerson when delete is clicked', () => {
    render(<TeamScreen />);
    const deleteButton = screen.getByLabelText(/Remove team member/i);
    fireEvent.click(deleteButton);
    expect(mockRemovePerson).toHaveBeenCalledWith('1');
  });

  it('handles keyboard shortcuts for saving edit', () => {
    render(<TeamScreen />);
    fireEvent.click(screen.getByLabelText(/Edit team member/i));

    const editInput = screen.getByDisplayValue('Original Name');
    fireEvent.change(editInput, { target: { value: 'Keyboard Name' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    expect(mockUpdatePerson).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ name: 'Keyboard Name' })
    );
  });

  it('handles keyboard shortcuts for canceling edit', () => {
    render(<TeamScreen />);
    fireEvent.click(screen.getByLabelText(/Edit team member/i));

    const editInput = screen.getByDisplayValue('Original Name');
    fireEvent.keyDown(editInput, { key: 'Escape' });

    expect(screen.queryByLabelText(/Save changes/i)).not.toBeInTheDocument();
  });

  it('renders empty state when no people', () => {
    (usePairingStore as any).mockReturnValue({
      people: [],
      addPerson: mockAddPerson,
      updatePerson: mockUpdatePerson,
      removePerson: mockRemovePerson,
    });

    render(<TeamScreen />);
    expect(screen.getByText(/No team members yet/i)).toBeInTheDocument();
  });

  it('renders limit banner when at MAX_PEOPLE', () => {
    (usePairingStore as any).mockReturnValue({
      people: Array(16).fill({ id: 'x', name: 'User' }),
      addPerson: mockAddPerson,
      updatePerson: mockUpdatePerson,
      removePerson: mockRemovePerson,
    });

    render(<TeamScreen />);
    expect(screen.getByText(/Team limit of 16 reached/i)).toBeInTheDocument();
  });

  it('allows canceling the add person process', () => {
    render(<TeamScreen />);
    fireEvent.click(screen.getByRole('button', { name: /Add Person/i }));

    const cancelAddButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelAddButton);

    expect(screen.queryByPlaceholderText(/Full name/i)).not.toBeInTheDocument();
  });
});
