import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import type { PairingBoard, Person, PersonRecord, BoardRecord } from '../types';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { WorkspaceDashboardDisplay } from './WorkspaceDashboardDisplay';
import { Loader2, Lock, ArrowRight } from 'lucide-react';

export function PublicView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { isAdmin, isLoading: isAuthLoading } = useAuthStore();
  const [boards, setBoards] = useState<PairingBoard[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [isAdminView, setIsAdminView] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!shareToken) return;

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(shareToken)) {
        setIsPublic(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // 1. Check if public view is enabled (lookup by share_token, get user_id)
        const { data: settings } = await supabase
          .from('workspace_settings')
          .select('public_view_enabled, user_id')
          .eq('share_token', shareToken)
          .maybeSingle();

        if (!settings) {
          setIsPublic(false);
          setIsLoading(false);
          return;
        }

        const actualUserId = settings.user_id;
        const isPublicEnabled = settings?.public_view_enabled ?? false;

        // RBAC Check: Allow access if public or if current user is an admin
        if (!isPublicEnabled && !isAdmin) {
          setIsPublic(false);
          setIsLoading(false);
          return;
        }

        setIsPublic(true);
        setIsAdminView(isAdmin && !isPublicEnabled);

        // 2. Fetch Data (Admin utilizes the secure logged RPC)
        if (isAdmin && !isPublicEnabled) {
          const { data, error } = await supabase.rpc(
            'admin_get_workspace_data',
            {
              target_user_id: actualUserId,
            }
          );

          if (error) throw error;

          if (data) {
            const adminData = data as unknown as {
              people: PersonRecord[];
              boards: BoardRecord[];
            };
            setPeople(
              (adminData.people || []).map((p) => ({
                id: p.id,
                name: p.name,
                avatarColorHex: p.avatar_color_hex,
                userId: p.user_id,
                createdAt: p.created_at,
              }))
            );
            setBoards(
              (adminData.boards || []).map((b) => ({
                id: b.id,
                userId: b.user_id,
                name: b.name,
                isExempt: b.is_exempt,
                isLocked: b.is_locked || false,
                goals: b.goals,
                meetingLink: b.meeting_link || undefined,
                sortOrder: b.sort_order,
                assignedPersonIds: b.assigned_person_ids,
                createdAt: b.created_at,
              }))
            );
          }
        } else {
          const [peopleRes, boardsRes] = await Promise.all([
            supabase.from('people').select('*').eq('user_id', actualUserId),
            supabase
              .from('pairing_boards')
              .select('*')
              .eq('user_id', actualUserId)
              .order('sort_order'),
          ]);

          if (peopleRes.data) {
            setPeople(
              (peopleRes.data as unknown as PersonRecord[]).map((p) => ({
                id: p.id,
                name: p.name,
                avatarColorHex: p.avatar_color_hex,
                userId: p.user_id,
                createdAt: p.created_at,
              }))
            );
          }
          if (boardsRes.data) {
            setBoards(
              (boardsRes.data as unknown as BoardRecord[]).map((b) => ({
                id: b.id,
                userId: b.user_id,
                name: b.name,
                isExempt: b.is_exempt,
                isLocked: b.is_locked || false,
                goals: b.goals,
                meetingLink: b.meeting_link || undefined,
                sortOrder: b.sort_order,
                assignedPersonIds: b.assigned_person_ids,
                createdAt: b.created_at,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    if (!isAuthLoading) {
      fetchData();
    }
  }, [shareToken, isAdmin, isAuthLoading]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isPublic === false && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-neutral-50 dark:bg-neutral-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white text-neutral-400 shadow-xl dark:bg-neutral-900">
              <Lock className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            Access Restricted
          </h1>
          <p className="text-neutral-500 dark:text-neutral-300 mb-10 leading-relaxed">
            This workspace dashboard is currently private.
          </p>
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-8 py-4 text-sm font-bold text-white shadow-xl hover:bg-black transition-all dark:bg-brand-500 dark:hover:bg-brand-600"
          >
            Go to Homepage
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8 dark:bg-neutral-950">
      <WorkspaceDashboardDisplay
        boards={boards}
        people={people}
        isAdminView={isAdminView}
      />

      <footer className="mt-24 border-t border-neutral-200/50 pt-16 dark:border-neutral-800/50 px-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-500">
          Crafted for Modern Engineering Teams • Parrit
        </p>
      </footer>
    </div>
  );
}
