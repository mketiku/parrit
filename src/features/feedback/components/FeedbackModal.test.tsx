/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { FeedbackModal } from './FeedbackModal';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';

vi.mock('../../auth/store/useAuthStore');
vi.mock('../../../store/useToastStore');
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockInsert = vi.fn();
const mockAddToast = vi.fn();
const mockOnClose = vi.fn();

function renderModal(isOpen = true) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <FeedbackModal isOpen={isOpen} onClose={mockOnClose} />
    </MemoryRouter>
  );
}

describe('FeedbackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ user: { id: 'user-1' } });
    (useToastStore as any).mockReturnValue({ addToast: mockAddToast });
    (supabase.from as any).mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: null });
  });

  it('renders nothing when closed', () => {
    renderModal(false);
    expect(screen.queryByText('Share Feedback')).not.toBeInTheDocument();
  });

  it('renders the modal with type options and message input', () => {
    renderModal();
    expect(screen.getByText('Share Feedback')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Idea')).toBeInTheDocument();
    expect(screen.getByLabelText('Feedback message')).toBeInTheDocument();
  });

  it('disables submit when message is empty', () => {
    renderModal();
    const submitBtn = screen.getByRole('button', { name: /Send Feedback/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit once message is typed', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('Feedback message'), {
      target: { value: 'Great app!' },
    });
    expect(
      screen.getByRole('button', { name: /Send Feedback/i })
    ).toBeEnabled();
  });

  it('submits feedback with correct payload and closes on success', async () => {
    renderModal();

    fireEvent.click(screen.getByText('Bug'));
    fireEvent.change(screen.getByLabelText('Feedback message'), {
      target: { value: 'Something is broken' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Feedback/i }));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('feedback');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        type: 'bug',
        message: 'Something is broken',
        page: '/app',
      });
      expect(mockAddToast).toHaveBeenCalledWith(
        'Thanks for your feedback!',
        'success'
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error toast when insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });
    renderModal();

    fireEvent.change(screen.getByLabelText('Feedback message'), {
      target: { value: 'Test message' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Feedback/i }));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'Failed to submit feedback. Please try again.',
        'error'
      );
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByLabelText('Close feedback'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', () => {
    renderModal();
    fireEvent.click(screen.getByTestId('feedback-backdrop'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('caps message length at 1000 characters', () => {
    renderModal();
    const oversized = 'a'.repeat(1100);
    fireEvent.change(screen.getByLabelText('Feedback message'), {
      target: { value: oversized },
    });
    expect(
      (screen.getByLabelText('Feedback message') as HTMLTextAreaElement).value
    ).toHaveLength(1000);
    expect(screen.getByText('1000/1000')).toBeInTheDocument();
  });
});
