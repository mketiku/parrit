# Security & Row Level Security (RLS) Policies

This document defines how we ensure data privacy and security in the Parrit Modern backend using Supabase RLS.

## 1. Authentication Strategy
- **Provider**: Supabase Auth (Email + Magic Link / Social).
- **Session Duration**: Standard JWT-based sessions.
- **Identity**: Every database query is executed in the context of the `auth.uid()`.

---

## 2. Table-Specific RLS Policies

### `profiles`
- **SELECT**: `auth.uid() == id` (Users see only themselves).
- **INSERT/UPDATE**: `auth.uid() == id`.
- **DELETE**: No public deletion; handled via account close service.

### `workspaces`
- **SELECT**: 
  - If `public_view_enabled == true`, then ALL can SELECT.
  - Else, user must have a record in `memberships` for this `workspace_id` where `profile_id == auth.uid()`.
- **INSERT**: `auth.uid() == owner_id`.
- **UPDATE/DELETE**: User must have a `membership` with role `OWNER`.

### `memberships` (The Gatekeeper)
- **SELECT**: User must belong to the workspace in question.
- **INSERT/UPDATE/DELETE**: User must have a `membership` with role `OWNER` for that workspace.

### `people`, `pairing_boards`, `pairing_sessions`, `pairing_assignments`, `board_templates`
- **SELECT**:
  - If the associated Workspace has `public_view_enabled == true`, ALL can SELECT.
  - Else, user must have a `membership` for the workspace.
- **INSERT/UPDATE/DELETE**:
  - User must have a `membership` for the workspace with a role of `OWNER` or `EDITOR`.

---

## 3. Real-time Security
- **Channels**: Subscriptions are scoped by `workspace_id`.
- **Auth**: Supabase Realtime automatically honors RLS policies. If a user doesn't have `SELECT` access to a table/row, they will not receive broadcast events for it.

---

## 4. Stakeholder (View-Only) Access
- **Mechanism**: The `public_view_enabled` flag on the `workspaces` table.
- **Security Check**: This flag is only toggleable by a workspace `OWNER`. 
- **Privacy**: When enabled, anyone with the workspace ID (or slug) can view the current board state, but cannot move people or save history (Insert/Update are still protected by role checks).
