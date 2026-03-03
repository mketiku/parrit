# Parrit 🦜

Professional-grade pairing for modern teams. A ground-up rebuild of the collaborative pairing board workflow.

Created and maintained by **Michael Ketiku**.

## The Story

When the original `parrit.io` was taken down in 2025, it left a void for many engineering teams (including mine). I've been pairing for about two years now and have seen the professional benefits firsthand—it increases code quality, eliminates silos, and makes engineering more human.

I wanted to build a modern successor that felt "alive"—using real-time sync, a good-looking interface, and a modern architecture. Parrit was built to ensure that simple rotation logic remains accessible to the community.

## Features

- **Workspace-based Auth**: Sign up with a workspace name only — no emails, no PII required.
- **Smart-Pair Algorithm**: A rotation engine that uses historical data to suggest optimal pairs, with randomization fallback.
- **Per-Board Goals & Links**: Each board supports multiple daily goals and a clickable meeting (Zoom) link.
- **Dynamic Themes**: Tropical-inspired themes ("Macaw Elite", "Night Parrot") with consistent brand/accent tokens.
- **Persistent Pairing Boards**: Create, rename, and delete boards. Drag-and-drop saves automatically.
- **Real-time Sync**: Changes appear live across all open tabs and teammates in the same workspace.
- **Team Management**: Add, edit, and remove team members with custom avatar colours.
- **Advanced Drag & Drop**: Multi-select (Shift+Click) and bulk drag to move people between boards.
- **Session History**: Save daily snapshots of your pairing configuration and delete old ones.
- **Premium UI/UX**: Light/dark mode, hover tooltips, smooth animations.

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
- A [Supabase](https://supabase.com/) project

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

Database setup files are located in the `supabase/` directory.

- **Primary Setup**: Run `supabase/schema.sql` in your Supabase SQL Editor.
- **Admin Setup**: Run `supabase/admin_setup.sql` to enable the admin role and audit logging.

Then in **Supabase → Authentication → Providers → Email**, disable:

- ✅ Confirm email
- ✅ Secure email change

### 4. Start the development server

```bash
npm run dev
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
    admin/      # Admin portal core
  components/
    layout/     # AppLayout, header, footer
    ui/         # Shared UI primitives
  lib/          # Supabase client

supabase/
  schema.sql       # Full database setup
  admin_setup.sql  # RBAC and audit logging setup
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
| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |

**4. Add redirect URL in Supabase**
In **Supabase → Authentication → URL Configuration → Redirect URLs**, add your Vercel deployment URL (e.g. `https://parrit.vercel.app`).

## Architecture Decisions

See `docs/adr/` for documented decisions:

- [ADR-0001](docs/adr/0001-workspace-pseudonym-authentication.md) — Workspace pseudonym authentication strategy

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get involved.

## Acknowledgements

This project is a spiritual successor to the original [Parrit](https://github.com/Parrit/Parrit). We are grateful for the inspiration provided by the original creators.

## License

This project is maintained by Michael Ketiku.
