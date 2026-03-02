# Parrit 🦜

A modern pairing tool built to fill the gap left when the original `parrit.io` was taken down in 2025.

Created and maintained by **Michael Ketiku**.

## Overview

Parrit provides a fast, beautiful, and maintenance-free home for engineering teams to manage their daily pairing sessions. Built on the spirit of the original with modern real-time collaboration and workspace isolation baked in from day one.

## Features

- **Workspace-based Auth**: Sign up with a workspace name only — no emails, no PII required.
- **Persistent Pairing Boards**: Create, rename, and delete boards. Drag-and-drop saves automatically.
- **Real-time Sync**: Changes appear live across all open tabs and teammates in the same workspace.
- **Team Management**: Add, edit, and remove team members with custom avatar colours.
- **Advanced Drag & Drop**: Multi-select (Shift+Click) and bulk drag to move people between boards.
- **Toast Notifications**: Every action surfaces success and error feedback.
- **Premium UI/UX**: Light/dark mode, hover tooltips, smooth animations.
- **Architecture Records**: Key decisions documented as ADRs in `docs/adr/`.

## Tech Stack

- **Frontend**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State**: [Zustand](https://github.com/pmndrs/zustand)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Drag & Drop**: [@dnd-kit/core](https://dnd-kit.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## Getting Started

### Prerequisites

- Node.js (v18+)
- A free [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
git clone https://github.com/mketiku/parrit.git
cd parrit
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set up the database

Run the full schema in **Supabase → SQL Editor → New Query**:

```
supabase/schema.sql
```

This creates both tables, indexes, and row-level security policies. It is safe to re-run — it drops and recreates from scratch.

Then in **Supabase → Authentication → Providers → Email**, disable:

- ✅ Confirm email
- ✅ Secure email change

### 4. Start the development server

```bash
npm run dev
```

### Running Tests

```bash
npm run test        # unit tests (Vitest)
npx playwright test # E2E tests (Playwright)
```

## Project Structure

```
src/
  features/
    auth/       # Workspace sign-in/sign-up + auth store
    pairing/    # Drag-and-drop workspace, boards, store
    team/       # Team member management
    settings/   # Workspace settings
    static/     # About page
  components/
    layout/     # AppLayout, header, footer
    ui/         # Toaster, shared UI primitives
  lib/          # Supabase client
  store/        # Global stores (toasts)

supabase/
  schema.sql    # Full database setup (run once in Supabase SQL editor)

docs/
  adr/          # Architecture Decision Records
  context/      # Architecture, requirements, implementation plan
```

## Deployment

The app deploys to **Vercel** with automatic CI/CD from GitHub. See [`docs/deployment.md`](docs/deployment.md) for the full guide.

### Quick steps

**1. Push to GitHub**

```bash
git remote add origin git@github.com:YOUR_USERNAME/parrit.git
git push -u origin main
```

**2. Import to Vercel**

Go to [vercel.com/new](https://vercel.com/new), import the GitHub repository.

- Framework: **Vite** (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`

**3. Set environment variables**

In **Vercel → Settings → Environment Variables**, add:

| Variable                 | Value                     |
| ------------------------ | ------------------------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key    |

**4. Add redirect URL in Supabase**

In **Supabase → Authentication → URL Configuration → Redirect URLs**, add your Vercel deployment URL (e.g. `https://parrit.vercel.app`).

> ⚠️ Skipping step 4 is the most common cause of login failures after deployment.

After the initial import, every `git push` to `main` triggers an automatic production deploy. Pull requests get isolated preview URLs automatically.

---

## Architecture Decisions

See `docs/adr/` for documented decisions:

- [ADR-0001](docs/adr/0001-workspace-pseudonym-authentication.md) — Workspace pseudonym authentication strategy

## License

This project is private and maintained by Michael Ketiku.
