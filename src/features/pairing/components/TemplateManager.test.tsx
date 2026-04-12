import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateManager } from './TemplateManager';
import { usePairingStore } from '../store/usePairingStore';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';
import React from 'react';

// Mocks
vi.mock('../store/usePairingStore');
vi.mock('../../../store/useToastStore');
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('TemplateManager Component', () => {
  const mockApplyTemplate = vi.fn();
  const mockSaveTemplate = vi.fn();
  const mockApplyBuiltinTemplate = vi.fn();
  const mockAddToast = vi.fn();

  type QueryResult<T> = {
    data: T;
    error: null;
  };

  interface MockChain<T> {
    select: (...args: unknown[]) => MockChain<T>;
    order: (...args: unknown[]) => MockChain<T>;
    delete: (...args: unknown[]) => MockChain<T>;
    eq: (...args: unknown[]) => MockChain<T>;
    then: (onFulfilled: (value: QueryResult<T>) => unknown) => Promise<unknown>;
  }

  const createMockChain = <T,>(data: T): MockChain<T> => {
    const chain: MockChain<T> = {
      select: vi.fn(() => chain),
      order: vi.fn(() => chain),
      delete: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      then: vi.fn((onFulfilled) =>
        Promise.resolve({ data, error: null }).then(onFulfilled)
      ),
    };
    return chain;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePairingStore).mockReturnValue({
      saveCurrentAsTemplate: mockSaveTemplate,
      applyTemplate: mockApplyTemplate,
      applyBuiltinTemplate: mockApplyBuiltinTemplate,
    });
    vi.mocked(useToastStore).mockReturnValue({
      addToast: mockAddToast,
    });
    vi.mocked(supabase.from).mockImplementation((() =>
      createMockChain<[]>([])) as never);
  });

  it('toggles the dropdown and loads templates', async () => {
    const mockTemplates = [
      {
        id: 't1',
        name: 'Saved Template',
        created_at: '2024-01-01',
        boards: [],
      },
    ];
    vi.mocked(supabase.from).mockImplementation((() =>
      createMockChain(mockTemplates)) as never);

    render(<TemplateManager />);
    fireEvent.click(screen.getByRole('button', { name: /manage templates/i }));

    expect(await screen.findByText(/Board Templates/i)).toBeInTheDocument();
    expect(await screen.findByText('Saved Template')).toBeInTheDocument();
  });

  it('allows applying a preset template', async () => {
    render(<TemplateManager />);
    fireEvent.click(screen.getByRole('button', { name: /manage templates/i }));

    const presetBtn = await screen.findByText('3-Board Starter');
    fireEvent.click(presetBtn);

    const confirmBtn = await screen.findByRole('button', {
      name: /Apply Template/i,
    });
    fireEvent.click(confirmBtn);

    expect(mockApplyBuiltinTemplate).toHaveBeenCalled();
  });

  it('calls saveCurrentAsTemplate when the form is submitted', async () => {
    render(<TemplateManager />);
    fireEvent.click(screen.getByRole('button', { name: /manage templates/i }));

    const input = await screen.findByPlaceholderText(/New template name/i);
    fireEvent.change(input, { target: { value: 'New Test Template' } });

    const saveBtn = screen.getByTitle(/Save Current as Template/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockSaveTemplate).toHaveBeenCalledWith('New Test Template');
    });
  });
});
