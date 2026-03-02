# Implementation Plan: Modern Pairing Tool (Ideal Version)

This plan outlines a from-scratch build of parrit.org as a modern, premium web application. It utilizes a high-performance, serverless stack using **Vite**, **React**, **Supabase**, and **Vercel**.

## Goal
Create an "ideal" pairing tool that is fast, beautiful, and maintenance-free.

## Tech Stack (The "Ideal" Choice)

- **Frontend**: Vite + React 18 (TypeScript)
- **Styling**: Tailwind CSS + Shadcn/ui (Premium component library)
- **State Management**: TanStack Query (Server state) + Zustand (Client state)
- **Backend/DB**: Supabase (PostgreSQL + Auth + Realtime)
- **Drag & Drop**: `@dnd-kit/core` (Performant and accessible)
- **Deployment**: Vercel (Optimized for SPA routing and edge performance)
- **Security**: Supabase Row Level Security (RLS) for multi-tenant isolation.

---

## Proposed Changes

### 1. Database Schema & Security (Supabase)
We will leverage PostgreSQL's power with Row Level Security (RLS) to ensure data is isolated between workspaces. See [security_policies.md](security_policies.md) for detailed rules.

- **`profiles`**: Extends Supabase Auth with display names and individual user settings.
- **`workspaces`**: Replaces the 'Project' model. Identifiable by a **UUID**. Owned by a profile.
- **`memberships`**: Links `profiles` to `workspaces` with roles (Owner, Editor, Viewer).
- **`people`**: Team members.
  - `id`, `project_id`, `name`, `image_url` (optional avatar).
- **`pairing_boards`**:
  - `id`, `project_id`, `name`, `is_exempt` (for OOO/Vacation), `goal_text`, `meeting_link`.
- **`board_templates`**:
  - `id`, `project_id`, `name`, `configuration_json` (layouts).
- **`pairing_sessions`**: Recorded pairing events.
  - `id`, `project_id`, `timestamp`.
- **`pairing_assignments`**: Links people to boards within a session.
  - `session_id`, `person_id`, `board_id`.

### 2. Premium UI/UX Features
To make this "ideal," we will implement:
- **Glassmorphism Design**: Sleek, modern cards for pairing boards.
- **Real-time Sync**: Use Supabase Realtime so multiple users can see drag-and-drop actions simultaneously.
- **Dynamic Avatars**: Use initials + accessible color palettes for people; no upload required but visually distinctive.
- **Micro-animations**: Smooth transitions when moving people between boards using Framer Motion.
- **Multi-Theme Support**: Integrated `ThemeProvider` (System/Light/Dark) using Tailwind and Shadcn strategy.
- **Optimistic UI**: Instant local updates with background sync and "Dirty State" conflict toasts.
- **Accessibility First**: Keyboard shortcuts and ARIA support.
- **Stakeholder Views**: Read-only, unauthenticated project views.
- **Team Stats Modal**: (Nice-to-have) Dynamic visual reporting of pairing history.
- **Mobile Responsive**: A mobile-first layout for viewing pairs on the go.

### 3. Core Logic
- **Recommendation Engine**: Implement a weighted-random pairing algorithm using a **Strategy Pattern**. This design allows the rotation logic to be swapped or tuned (e.g., "Priority on New Pairs" vs. "Priority on Stale Pairs") without modifying the core UI or state management code.
- **Auth Flow**: Use Supabase's Magic Link or Social Auth for a frictionless experience.

### 4. Project Structure (Feature-based)
```
src/
  features/
    auth/           # Login, Session management
    pairing/        # Drag & Drop boards, Logic
    recommendation/ # Suggestion engine
    history/        # Past pairing sessions
    analytics/      # (Optional) Team stats and insights logic
  components/       # Reusable UI (Shadcn)
  lib/              # Supabase client, utils
```

---

## Verification Plan

### Automated Tests
- **Vitest**: Unit tests for the recommendation algorithm.
- **Playwright**: End-to-end tests for the "Happy Path" (Login -> Create Person -> Drag to Board -> Save).

### Manual Verification
- **Real-time Check**: Open the app in two windows; moving a person in one should update the other instantly.
- **Responsive Check**: Verify the drag-and-drop experience on a tablet/mobile device.
