import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TemplateManager } from './TemplateManager';
import React from 'react';
import { usePairingStore } from '../store/usePairingStore';
import { useToastStore } from '../../../store/useToastStore';
import { supabase } from '../../../lib/supabase';

// Mocks
vi.mock('../store/usePairingStore');
vi.mock('../../../store/useToastStore');
vi.mock('../../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnValue(Promise.resolve({ data: [{ id: 't1', name: 'My Template', boards: [] }], error: null })),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
        })),
    },
}));

describe('TemplateManager Component', () => {
    const mockSaveTemplate = vi.fn();
    const mockApplyTemplate = vi.fn();
    const mockAddToast = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usePairingStore).mockReturnValue({
            saveCurrentAsTemplate: mockSaveTemplate,
            applyTemplate: mockApplyTemplate,
            applyBuiltinTemplate: vi.fn(),
        } as any);
        vi.mocked(useToastStore).mockReturnValue({
            addToast: mockAddToast,
        } as any);
    });

    it('toggles the dropdown and loads templates', async () => {
        render(<TemplateManager />);

        const toggleBtn = screen.getByText(/Templates/i);
        fireEvent.click(toggleBtn);

        expect(screen.getByText(/Board Templates/i)).toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('My Template')).toBeInTheDocument());
    });

    it('calls applyTemplate when a template is clicked', async () => {
        render(<TemplateManager />);
        fireEvent.click(screen.getByText(/Templates/i));

        const templateItem = await screen.findByText('My Template');
        fireEvent.click(templateItem);

        expect(mockApplyTemplate).toHaveBeenCalledWith('t1');
    });

    it('calls saveCurrentAsTemplate when the form is submitted', async () => {
        render(<TemplateManager />);
        fireEvent.click(screen.getByText(/Templates/i));

        const input = screen.getByPlaceholderText(/New template name/i);
        fireEvent.change(input, { target: { value: 'New Test Template' } });

        const saveBtn = screen.getByTitle(/Save Current as Template/i);
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockSaveTemplate).toHaveBeenCalledWith('New Test Template');
        });
    });
});
