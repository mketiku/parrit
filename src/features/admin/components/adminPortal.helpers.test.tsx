// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildSessionStatCards,
  buildWorkspaceStatCards,
  filterWorkspaces,
  maskWorkspaceLabel,
  type WorkspaceInfo,
} from './adminPortal.helpers';

const workspaces: WorkspaceInfo[] = [
  {
    id: 'workspace-1',
    email: 'team-a@parrit.com',
    created_at: '2026-03-25T00:00:00.000Z',
    last_sign_in_at: '2026-03-26T00:00:00.000Z',
    public_view_enabled: true,
    member_count: 4,
    board_count: 2,
    app_version: '1.2.2',
  },
  {
    id: 'workspace-2',
    email: 'ops@parrit.com',
    created_at: '2026-02-01T00:00:00.000Z',
    last_sign_in_at: null,
    public_view_enabled: false,
    member_count: 2,
    board_count: 1,
    app_version: null,
  },
];

describe('adminPortal helpers', () => {
  it('filters workspaces by email search case-insensitively', () => {
    expect(filterWorkspaces(workspaces, 'TEAM')).toEqual([workspaces[0]]);
  });

  it('masks workspace emails for display', () => {
    expect(maskWorkspaceLabel(workspaces[0])).toBe('t***@parrit.com');
    expect(
      maskWorkspaceLabel({ ...workspaces[0], email: null, id: 'abcdef123' })
    ).toBe('Workspace abcde');
  });

  it('builds workspace stats from workspace activity', () => {
    const cards = buildWorkspaceStatCards(workspaces, new Date('2026-03-27'));
    expect(cards.map((card) => [card.label, card.value])).toEqual([
      ['Total Workspaces', 2],
      ['Active (30d)', 1],
      ['New This Month', 1],
      ['New This Week', 1],
      ['Public View On', 1],
      ['Avg Team Size', '3.0'],
    ]);
  });

  it('builds session stat cards only when stats exist', () => {
    expect(buildSessionStatCards(null)).toEqual([]);
    expect(
      buildSessionStatCards({
        total_sessions: 30,
        sessions_this_month: 12,
        sessions_this_week: 4,
        total_people: 17,
      }).map((card) => [card.label, card.value, card.accent])
    ).toEqual([
      ['Total Sessions', 30, true],
      ['Sessions This Month', 12, true],
      ['Sessions This Week', 4, true],
      ['Total People', 17, true],
    ]);
  });
});
