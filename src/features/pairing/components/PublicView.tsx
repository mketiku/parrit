import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import type { PairingBoard, Person } from '../types';
import { Bird, Loader2, Users, Target, Lock } from 'lucide-react';

export function PublicView() {
  const { userId } = useParams<{ userId: string }>();
  const [boards, setBoards] = useState<PairingBoard[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!userId) return;
      setIsLoading(true);

      try {
        // 1. Check if public view is enabled
        const { data: settingsList } = await supabase
          .from('workspace_settings')
          .select('public_view_enabled')
          .eq('user_id', userId);

        const isPublicEnabled = settingsList?.[0]?.public_view_enabled ?? false;

        if (!isPublicEnabled) {
          setIsPublic(false);
          setIsLoading(false);
          return;
        }

        setIsPublic(true);

        // 2. Fetch People and Boards
        const [peopleRes, boardsRes] = await Promise.all([
          supabase.from('people').select('*').eq('user_id', userId),
          supabase
            .from('pairing_boards')
            .select('*')
            .eq('user_id', userId)
            .order('sort_order'),
        ]);

        if (peopleRes.data) {
          interface PersonRow {
            id: string;
            name: string;
            avatar_color_hex: string;
            user_id: string;
            created_at: string;
          }
          setPeople(
            (peopleRes.data as PersonRow[]).map((p) => ({
              id: p.id,
              name: p.name,
              avatarColorHex: p.avatar_color_hex,
              userId: p.user_id,
              createdAt: p.created_at,
            }))
          );
        }
        if (boardsRes.data) {
          interface BoardRow {
            id: string;
            user_id: string;
            name: string;
            is_exempt: boolean;
            goals: string[];
            meeting_link: string;
            sort_order: number;
            assigned_person_ids: string[];
            created_at: string;
          }
          setBoards(
            (boardsRes.data as BoardRow[]).map((b) => ({
              id: b.id,
              userId: b.user_id,
              name: b.name,
              isExempt: b.is_exempt,
              goals: b.goals,
              meetingLink: b.meeting_link,
              sortOrder: b.sort_order,
              assignedPersonIds: b.assigned_person_ids,
              createdAt: b.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isPublic === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Private Workspace
        </h1>
        <p className="mt-2 max-w-xs text-neutral-500 dark:text-neutral-400">
          This workspace is not currently shared publicly.
        </p>
        <Link
          to="/"
          className="mt-8 font-semibold text-brand-500 hover:text-brand-600 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8 dark:bg-neutral-950 font-sans">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg">
              <Bird className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Parrit Overview
              </h1>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Read-only pairing status
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => {
            const assigned = (board.assignedPersonIds ?? [])
              .map((id: string) => people.find((p) => p.id === id))
              .filter(Boolean) as Person[];

            return (
              <div
                key={board.id}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${board.isExempt ? 'bg-amber-500' : 'bg-brand-500'}`}
                  />
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 truncate flex-1">
                    {board.name}
                  </h3>
                  {board.isExempt && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                      EXEMPT
                    </span>
                  )}
                </div>

                {board.goals && (board.goals as string[]).length > 0 && (
                  <div className="mb-6 space-y-2">
                    {(board.goals as string[]).map((goal, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Target className="mt-1 h-3 w-3 shrink-0 text-brand-500/60" />
                        <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                          {goal}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  {assigned.length === 0 ? (
                    <span className="text-xs italic text-neutral-400">
                      Empty board
                    </span>
                  ) : (
                    assigned.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 rounded-full bg-neutral-100/50 pr-3 py-1 dark:bg-neutral-800/50"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                          style={{ backgroundColor: p.avatarColorHex }}
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                          {p.name.split(' ')[0]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {boards.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-neutral-200 py-20 dark:border-neutral-800">
            <Users className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-700" />
            <p className="font-medium text-neutral-500">
              No active boards found.
            </p>
          </div>
        )}

        <footer className="mt-16 text-center border-t border-neutral-100 pt-8 dark:border-neutral-900">
          <p className="text-xs font-medium text-neutral-400">
            Powered by Parrit 🦜 • Team Orchestration Simplified
          </p>
        </footer>
      </div>
    </div>
  );
}
