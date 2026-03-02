import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PairingWorkspace } from './PairingWorkspace';
import React from 'react';

// Very base test for Rendering. Drag logic testing in JSDOM with dnd-kit can be flaky without specific helper plugins, so we verify structural constraints first.

describe('PairingWorkspace Component', () => {
  it('renders the unpaired pool and mock boards', () => {
    render(<PairingWorkspace />);

    // Check Unpaired pool
    expect(screen.getByText('Unpaired Pool')).toBeInTheDocument();

    // Check mock board
    expect(screen.getByText('Phoenix')).toBeInTheDocument();
    expect(screen.getByText('Macaw')).toBeInTheDocument();
  });
});
