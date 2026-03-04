import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PairingMatrixView } from './PairingMatrixView';
import React from 'react';

describe('PairingMatrixView Component', () => {
    const mockMatrix = {
        personIds: ['p1', 'p2'],
        personNames: {
            p1: 'Alice',
            p2: 'Bob',
        },
        counts: {
            p1: { p2: 5 },
            p2: { p1: 5 },
        },
    };

    it('renders the character names in headers and rows', () => {
        render(<PairingMatrixView matrix={mockMatrix} />);

        // Names appear in both row and col headers
        expect(screen.getAllByText('Alice')).toHaveLength(2);
        expect(screen.getAllByText('Bob')).toHaveLength(2);
    });

    it('displays the pairing counts correctly', () => {
        render(<PairingMatrixView matrix={mockMatrix} />);

        // Count should appear twice (p1->p2 and p2->p1)
        expect(screen.getAllByText('5')).toHaveLength(2);
    });

    it('returns null if matrix is empty', () => {
        const { container } = render(
            <PairingMatrixView matrix={{ personIds: [], personNames: {}, counts: {} }} />
        );
        expect(container.firstChild).toBeNull();
    });
});
