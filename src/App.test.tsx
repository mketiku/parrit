import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import React from 'react';

describe('App', () => {
    it('renders the title', () => {
        render(<App />);
        expect(screen.getByText(/Parrit/i)).toBeInTheDocument();
    });

    it('renders the description', () => {
        render(<App />);
        expect(screen.getByText(/A modern, premium pairing tool/i)).toBeInTheDocument();
    });

    it('renders segments with proper color', () => {
        render(<App />);
        const parrot = screen.getByText('🦜');
        expect(parrot).toBeInTheDocument();
    });
});
