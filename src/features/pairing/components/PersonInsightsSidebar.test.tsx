import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PersonInsightsSidebar } from './PersonInsightsSidebar';
import type { PersonStats } from '../hooks/useHistoryAnalytics';

describe('PersonInsightsSidebar', () => {
  const mockStats: PersonStats = {
    id: 'p1',
    name: 'Alice',
    avatarColor: '#ff0000',
    totalPairings: 10,
    partnerCounts: {
      p2: { name: 'Bob', count: 5 },
      p3: { name: 'Charlie', count: 3 },
    },
    timeline: [
      { date: '2024-01-01T10:00:00Z', partnerName: 'Bob' },
      { date: '2024-01-02T10:00:00Z', partnerName: 'Charlie' },
    ],
  };

  const mockOnClose = vi.fn();

  it('should render nothing if stats is null', () => {
    const { container } = render(
      <PersonInsightsSidebar stats={null} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render person name and basic stats', () => {
    render(<PersonInsightsSidebar stats={mockStats} onClose={mockOnClose} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();

    // Total Pairings card
    const totalPairingsLabel = screen.getByText(/Total Pairings/i);
    const totalPairingsCard = totalPairingsLabel.closest('.bg-neutral-50');
    expect(totalPairingsCard).toHaveTextContent('10');

    // Unique Partners card
    const uniquePartnersLabel = screen.getByText(/Unique Partners/i);
    const uniquePartnersCard = uniquePartnersLabel.closest('.bg-neutral-50');
    expect(uniquePartnersCard).toHaveTextContent('2');
  });

  it('should render favorite partners in order', () => {
    render(<PersonInsightsSidebar stats={mockStats} onClose={mockOnClose} />);

    const partnerNames = screen.getAllByText(/Bob|Charlie/);
    expect(partnerNames[0]).toHaveTextContent('Bob');
    expect(screen.getByText('5')).toBeInTheDocument(); // Bob's count
    expect(screen.getByText('3')).toBeInTheDocument(); // Charlie's count
  });

  it('should render timeline items with formatted dates', () => {
    render(<PersonInsightsSidebar stats={mockStats} onClose={mockOnClose} />);

    // date-fns format 'MMM do, yyyy' for 2024-01-01 is 'Jan 1st, 2024'
    expect(screen.getByText('Jan 1st, 2024')).toBeInTheDocument();
    expect(screen.getByText('Paired with Bob')).toBeInTheDocument();
    expect(screen.getByText('Jan 2nd, 2024')).toBeInTheDocument();
    expect(screen.getByText('Paired with Charlie')).toBeInTheDocument();
  });

  it('should call onClose when clicking close button', () => {
    render(<PersonInsightsSidebar stats={mockStats} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close highlights');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should render empty partner message if no pairings', () => {
    const emptyStats: PersonStats = {
      ...mockStats,
      totalPairings: 0,
      partnerCounts: {},
      timeline: [],
    };
    render(<PersonInsightsSidebar stats={emptyStats} onClose={mockOnClose} />);

    expect(screen.getByText('No pairings recorded yet.')).toBeInTheDocument();
  });
});
