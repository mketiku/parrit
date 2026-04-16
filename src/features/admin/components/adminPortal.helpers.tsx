import {
  CalendarDays,
  Eye,
  GitCommitHorizontal,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface WorkspaceInfo {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  public_view_enabled: boolean;
  member_count: number;
  board_count: number;
  app_version: string | null;
}

export interface AdminStats {
  total_sessions: number;
  sessions_this_month: number;
  sessions_this_week: number;
  total_people: number;
}

export interface StatCard {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: boolean;
}

export function filterWorkspaces(
  workspaces: WorkspaceInfo[],
  search: string
): WorkspaceInfo[] {
  const normalized = search.toLowerCase();
  return workspaces.filter((workspace) =>
    (workspace.email || '').toLowerCase().includes(normalized)
  );
}

export function maskWorkspaceLabel(workspace: WorkspaceInfo): string {
  if (!workspace.email) {
    return `Workspace ${workspace.id.slice(0, 5)}`;
  }

  const [localPart, domain] = workspace.email.split('@');
  return `${localPart.slice(0, 1)}***@${domain}`;
}

export function buildWorkspaceStatCards(
  workspaces: WorkspaceInfo[],
  now: Date = new Date()
): StatCard[] {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalWorkspaces = workspaces.length;
  const newThisMonth = workspaces.filter(
    (workspace) => new Date(workspace.created_at) >= startOfMonth
  ).length;
  const activeThirtyDays = workspaces.filter(
    (workspace) =>
      workspace.last_sign_in_at &&
      new Date(workspace.last_sign_in_at) >= thirtyDaysAgo
  ).length;
  const newThisWeek = workspaces.filter(
    (workspace) => new Date(workspace.created_at) >= sevenDaysAgo
  ).length;
  const publicViewCount = workspaces.filter(
    (workspace) => workspace.public_view_enabled
  ).length;
  const avgTeamSize =
    totalWorkspaces > 0
      ? (
          workspaces.reduce(
            (sum, workspace) => sum + workspace.member_count,
            0
          ) / totalWorkspaces
        ).toFixed(1)
      : '—';

  return [
    {
      label: 'Total Workspaces',
      value: totalWorkspaces,
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: 'Active (30d)',
      value: activeThirtyDays,
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: 'New This Month',
      value: newThisMonth,
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      label: 'New This Week',
      value: newThisWeek,
      icon: <CalendarDays className="h-5 w-5" />,
    },
    {
      label: 'Public View On',
      value: publicViewCount,
      icon: <Eye className="h-5 w-5" />,
    },
    {
      label: 'Avg Team Size',
      value: avgTeamSize,
      icon: <UserRound className="h-5 w-5" />,
    },
  ];
}

export function buildSessionStatCards(stats: AdminStats | null): StatCard[] {
  if (!stats) {
    return [];
  }

  return [
    {
      label: 'Total Sessions',
      value: stats.total_sessions,
      icon: <GitCommitHorizontal className="h-5 w-5" />,
      accent: true,
    },
    {
      label: 'Sessions This Month',
      value: stats.sessions_this_month,
      icon: <CalendarDays className="h-5 w-5" />,
      accent: true,
    },
    {
      label: 'Sessions This Week',
      value: stats.sessions_this_week,
      icon: <TrendingUp className="h-5 w-5" />,
      accent: true,
    },
    {
      label: 'Total People',
      value: stats.total_people,
      icon: <UserRound className="h-5 w-5" />,
      accent: true,
    },
  ];
}
