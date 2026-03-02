# Parrit 🦜

A modern, premium pairing tool designed for high-performance teams. Build faster, together.

Created and maintained by **Michael Ketiku**.

## Overview

Parrit was created to ensure continued support for the pairing community after the original `parrit.io` site was taken down in 2025. This new Parrit is designed to be fast, beautiful, and maintenance-free—providing a modern home for teams to manage their pairing boards and collaboration sessions.

## Features

- **Workspace-based Auth**: High-privacy authentication using Workspace IDs (no PII or personal emails required).
- **Dynamic Pairing Boards**: Create and manage boards for different team contexts with real-time feedback.
- **Team Management**: Add, edit, and remove team members with custom avatars and colors.
- **Advanced Drag & Drop**: Multi-select (Shift+Click) and bulk drag operations for efficient pairing.
- **Real-time Collaboration**: Instant synchronization and updates across the entire team.
- **Premium UI/UX**: Human-modern design with theme support (Light/Dark/System) and hover tooltips.
- **Project Governance**: Architecture decisions are documented using ADRs in `docs/adr/`.

## Tech Stack

- **Frontend**: [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) (TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [TanStack Query](https://tanstack.com/query) + [Zustand](https://github.com/pmndrs/zustand)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Drag & Drop**: [@dnd-kit/core](https://dnd-kit.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd pairing
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:
   - Create a free project at [Supabase](https://supabase.com/).
   - Copy `.env.example` to `.env` in the root directory.
   - Add your Supabase `URL` and `Anon Key` to `.env`:

   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Running Tests

- Unit Tests: `npm run test`
- E2E Tests: `npx playwright test`

## Project Structure

- `src/features/`: Feature-based modules (auth, pairing, settings, team).
- `src/components/`: Reusable UI components.
- `src/lib/`: External service clients and utilities.
- `docs/`: Project documentation and Architecture Decision Records (ADRs).

## License

This project is private and maintained by Michael Ketiku.
