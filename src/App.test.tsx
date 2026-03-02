import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';
import React from 'react';

describe('App Root Component', () => {
    it('renders the layout and default dashboard view', () => {
        render(<App />);

        // Header Logo should exist
        expect(screen.getByText('Parrit')).toBeInTheDocument();

        // Default route placeholder text should exist
        expect(
            screen.getByText('Current Pairing Workspace: Phoenix')
        ).toBeInTheDocument();
    });
});
