import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import React from 'react';

describe('AppLayout Component', () => {
    it('renders the header with logo and navigation links', () => {
        render(
            <MemoryRouter>
                <AppLayout />
            </MemoryRouter>
        );

        // Assert main logo is present
        expect(screen.getByText(/Parrit/i)).toBeInTheDocument();

        // Assert navigation items are present based on UI design
        expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Team/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();
    });

    it('renders a main content area for children routes', () => {
        render(
            <MemoryRouter>
                <AppLayout />
            </MemoryRouter>
        );

        // Role 'main' should be there for a semantic html layout
        expect(screen.getByRole('main')).toBeInTheDocument();
    });
});
