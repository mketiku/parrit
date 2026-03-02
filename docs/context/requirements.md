# Feature Requirements: Modern Parrit

This document outlines the core features for the modern, from-scratch version of Parrit.

## 1. Project & Account Management

- ✅ **Workspace-based Auth**: (Modified) Users sign up with Workspace Name instead of personal email.
- ✅ **Data Persistence**: All people, boards, and history are saved to the project.
- ✅ **Session Links**: Ability to add/edit a Zoom link to a pairing board for easy joining.
- ✅ **Project Export/Import**: JSON export/import (people, boards, goals, assignments). Available in Settings.
- ⏳ **Stakeholder View-Only Links**: (Planned).

## 2. Pairing Board Workspace

- ✅ **Dynamic Boards**: Create, rename, and delete pairing boards.
- ✅ **Exempt Boards**: Ability to mark boards (like "OUT OF OFFICE") as exempt.
- ✅ **Per-Board Goals**: (Enhanced) Support for multiple daily goals per board.
- ✅ **Drag & Drop**: Seamlessly move people between boards.
- ✅ **Multi-Select**: Bulk move people using Shift+Click.
- ✅ **Board Templates**: Save current board layout as a named template. Apply templates from the dashboard.
- ⏳ **Role Management**: (Planned).

## 3. Team Member Management

- ✅ **Person CRUD**: Add/edit/delete team members.
- ✅ **Initial-based Avatars**: Colors + initials based on name.
- ✅ **Unpaired List**: Central pool for unassigned people.
- ✅ **Stale Pair Highlighting**: Boards with pairs that have worked together in the last 3 sessions show an amber warning badge.

## 4. Recommendation Engine

- ✅ **Pair Suggestion**: "Recommend" button using historical friction data.
- ✅ **Fallback Randomization**: Works even with zero history.

## 5. Pairing History

- ✅ **Save Pairing**: Snapshots of all boards.
- ✅ **History Timeline**: Chronological list of sessions.
- ✅ **Session Management**: Delete historical snapshots.

## 6. User Experience (Modern Goals)

- ✅ **Theme Support**: Custom Tropical themes ("Macaw Elite", "Night Parrot").
- ✅ **Premium Aesthetics**: Glassmorphism, smooth animations, brand consistency.
- ⏳ **Accessibility**: Ongoing optimization.

## 7. Deployment & Infrastructure

- ✅ **Hosting**: Vercel-optimized.
- ✅ **Analytics**: Vercel Analytics integrated.

## 8. Development Progress

- **Tech Stack Completed**: Vite, React 19, Tailwind CSS v4, Zustand, Supabase.
- **Auth Strategy**: ADR-0001 implemented.
- **Styling Strategy**: Multi-theme system with semantic tokens implemented.
